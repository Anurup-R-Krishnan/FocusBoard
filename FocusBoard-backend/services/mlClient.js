'use strict';

const ml = require('../mlService');

const client = {
  post: async (path, data) => {
    switch (path) {
      case '/find-similar': {
        const { text, categories, threshold } = data;
        const result = ml.findSimilar(text, categories, threshold);
        return { data: { ...result, ...ml.modelMetadata() } };
      }
      case '/check-nsfw': {
        const { url, window_title } = data;
        return { data: ml.checkNsfw(url || '', window_title || '') };
      }
      case '/embed': {
        const { text } = data;
        return { data: { embedding: ml.embedText(text), ...ml.modelMetadata() } };
      }
      case '/embed/batch': {
        const { texts } = data;
        return { data: { embeddings: texts.map(t => ml.embedText(t)), ...ml.modelMetadata() } };
      }
      default:
        throw new Error(`Unknown ML endpoint: ${path}`);
    }
  },
  get: async (path) => {
    switch (path) {
      case '/health':
        return { data: { status: 'healthy', model_loaded: true, model_info: ml.getModelStatus() } };
      case '/model/status':
        return { data: ml.getModelStatus() };
      case '/health/model':
        return { data: { status: 'ready', model: ml.getModelStatus() } };
      default:
        throw new Error(`Unknown ML endpoint: ${path}`);
    }
  },
};

module.exports = client;
