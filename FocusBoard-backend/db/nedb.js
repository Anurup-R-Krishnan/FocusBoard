'use strict';

const path = require('path');
const Datastore = require('@seald-io/nedb');
const { randomUUID } = require('crypto');
const fs = require('fs');

const DB_DIR = process.env.FOCUSBOARD_DATA_DIR
  ? path.resolve(process.env.FOCUSBOARD_DATA_DIR)
  : path.join(__dirname, '..', 'data');

const MODEL_REGISTRY = {};
const DATABASE_REGISTRY = {};

function getDBPath(name) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  return path.join(DB_DIR, `${name}.db`);
}

function applyDefaults(doc, schema) {
  for (const [key, field] of Object.entries(schema)) {
    if (doc[key] === undefined && field.default !== undefined) {
      doc[key] = typeof field.default === 'function' ? field.default() : field.default;
    }
  }
  return doc;
}

function applyTimestamps(doc, isNew) {
  const now = new Date().toISOString();
  if (isNew) doc.createdAt = now;
  doc.updatedAt = now;
  return doc;
}

function parseProjection(select) {
  if (!select || typeof select !== 'string') return undefined;
  const proj = {};
  select.split(/\s+/).forEach(f => {
    if (f.startsWith('-')) { proj[f.slice(1)] = 0; }
    else { proj[f] = 1; }
  });
  return proj;
}

async function applyPopulates(results, populates) {
  if (!populates || populates.length === 0) return results;
  const single = !Array.isArray(results);
  const docs = single ? [results] : results;

  for (const pop of populates) {
    const targetModel = MODEL_REGISTRY[pop.model];
    if (!targetModel) continue;

    const refIds = [...new Set(docs.map(d => d[pop.path]).filter(Boolean))];
    if (refIds.length === 0) continue;

    const refDocs = await targetModel.datastore.findAsync({ _id: { $in: refIds } });
    const refMap = {};
    for (const ref of refDocs) {
      refMap[ref._id] = { ...ref };
    }

    const projection = pop.select ? parseProjection(pop.select) : undefined;
    for (const doc of docs) {
      if (doc[pop.path] && refMap[doc[pop.path]]) {
        let ref = refMap[doc[pop.path]];
        if (projection) {
          const filtered = {};
          for (const [key, val] of Object.entries(projection)) {
            if (val === 1 && ref[key] !== undefined) filtered[key] = ref[key];
            if (val === 0 && key !== '_id') delete ref[key];
          }
          doc[pop.path] = { ...filtered, _id: ref._id };
        } else {
          doc[pop.path] = ref;
        }
      }
    }
  }

  return single ? docs[0] : docs;
}

class QueryBuilder {
  constructor(cursor, model) {
    this.cursor = cursor;
    this.model = model;
    this._populates = [];
  }

  sort(s) { this.cursor.sort(s); return this; }
  limit(n) { this.cursor.limit(n); return this; }
  skip(n) { this.cursor.skip(n); return this; }

  select(s) {
    const proj = parseProjection(s);
    if (proj) this.cursor.projection(proj);
    return this;
  }

  populate(path, select) {
    const refDef = this.model.schema[path];
    const model = refDef && refDef.ref ? MODEL_REGISTRY[refDef.ref] : null;
    if (model) {
      this._populates.push({ path, select, model: refDef.ref });
    }
    return this;
  }

  exec() {
    return this.cursor.execAsync()
      .then(results => this._populates.length > 0 ? applyPopulates(results, this._populates) : results);
  }

  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
  finally(fn) { return this.exec().finally(fn); }
}

class NeDBModel {
  constructor(name, schema = {}, options = {}) {
    this.name = name;
    this.schema = schema;
    this.options = options;
    this.timestamps = options.timestamps || false;

    const dbPath = getDBPath(name);
    this.datastore = new Datastore({ filename: dbPath, autoload: true });

    if (options.indices) {
      for (const idx of options.indices) {
        const opts = typeof idx === 'string' ? { fieldName: idx } : idx;
        this.datastore.ensureIndex(opts);
      }
    }

    DATABASE_REGISTRY[name] = this;
    if (options.modelName) {
      MODEL_REGISTRY[options.modelName] = this;
    }
  }

  _buildDoc(data, isNew) {
    let doc = { ...data };
    if (isNew) {
      if (!doc._id && this.schema._id && this.schema._id.default) {
        doc._id = typeof this.schema._id.default === 'function'
          ? this.schema._id.default()
          : this.schema._id.default;
      } else if (!doc._id) {
        doc._id = randomUUID();
      }
    }
    doc = applyDefaults(doc, this.schema);
    if (this.timestamps) doc = applyTimestamps(doc, isNew);
    return doc;
  }

  find(filter) { return new QueryBuilder(this.datastore.find(filter || {}), this); }
  findOne(filter) { return new QueryBuilder(this.datastore.findOne(filter || {}), this); }
  findById(id) { return this.findOne({ _id: id }); }
  countDocuments(filter) { return this.datastore.countAsync(filter || {}); }

  async distinct(field) {
    const docs = await this.datastore.findAsync({});
    return [...new Set(docs.map(d => d[field]).filter(f => f != null))];
  }

  async create(data) {
    const doc = this._buildDoc(data, true);
    return this.datastore.insertAsync(doc);
  }

  async insert(data) { return this.create(data); }

  findOneAndUpdate(filter, update, options = {}) {
    const promise = (async () => {
      const existing = await this.findOne(filter).exec();
      if (!existing) {
        if (options.upsert) {
          const mergeData = update.$set || update;
          const newDoc = this._buildDoc({ ...filter, ...mergeData }, true);
          return this.datastore.insertAsync(newDoc);
        }
        return null;
      }

      const setData = update.$set || update;
      const unsetData = update.$unset || {};
      const updated = { ...existing, ...setData };
      for (const key of Object.keys(unsetData)) {
        delete updated[key];
      }
      if (this.timestamps) updated.updatedAt = new Date().toISOString();

      await this.datastore.updateAsync({ _id: existing._id }, updated, {});
      return updated;
    })();
    return new MutationResult(promise, this);
  }

  findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  findOneAndDelete(filter) {
    const promise = (async () => {
      const doc = await this.findOne(filter).exec();
      if (!doc) return null;
      await this.datastore.removeAsync({ _id: doc._id }, {});
      return doc;
    })();
    return new MutationResult(promise, this);
  }

  findByIdAndDelete(id) { return this.findOneAndDelete({ _id: id }); }

  async deleteMany(filter) {
    const numRemoved = await this.datastore.removeAsync(filter || {}, { multi: true });
    return { deletedCount: numRemoved };
  }

  async updateMany(filter, update) {
    const numAffected = await this.datastore.updateAsync(filter || {}, update, { multi: true });
    return { numAffected };
  }

  async updateOne(filter, update) {
    const numAffected = await this.datastore.updateAsync(filter, update, {});
    return { numAffected };
  }

  findAsync(filter) { return this.datastore.findAsync(filter || {}); }
  findOneAsync(filter) { return this.datastore.findOneAsync(filter || {}); }
}

function createModel(name, schema, options = {}) {
  return new NeDBModel(name, schema, options);
}

async function closeAll() {
  for (const [, model] of Object.entries(DATABASE_REGISTRY)) {
    model.datastore.stopAutocompaction();
  }
}

function getModelByName(name) {
  return MODEL_REGISTRY[name];
}

class MutationResult {
  constructor(promise, model) {
    this._promise = promise;
    this._model = model;
    this._populates = [];
    this._select = null;
  }

  populate(path, select) {
    const refDef = this._model.schema[path];
    const model = refDef && refDef.ref ? MODEL_REGISTRY[refDef.ref] : null;
    if (model) {
      this._populates.push({ path, select, model: refDef.ref });
    }
    return this;
  }

  select(s) { this._select = s; return this; }

  async exec() {
    let result = await this._promise;
    if (!result) return null;
    if (this._populates.length > 0) {
      result = await applyPopulates(result, this._populates);
    }
    if (this._select) {
      const proj = parseProjection(this._select);
      if (proj) {
        const filtered = {};
        for (const [key, val] of Object.entries(proj)) {
          if (val === 1 && result[key] !== undefined) filtered[key] = result[key];
          if (val === 0 && key !== '_id') delete result[key];
        }
        result = { ...filtered, _id: result._id };
      }
    }
    return result;
  }

  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
  finally(fn) { return this.exec().finally(fn); }
}

module.exports = {
  createModel,
  closeAll,
  getModelByName,
  NeDBModel,
  applyPopulates,
  QueryBuilder,
  MutationResult,
};
