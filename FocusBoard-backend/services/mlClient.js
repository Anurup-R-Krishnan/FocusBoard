'use strict';

import * as ml from '../mlService.js';

const client = {
  post: async (path, data) => {
    switch (path) {
      case '/find-similar': {
        const { text, categories, threshold } = data;
        const result = await ml.findSimilar(text, categories, threshold);
        return { data: { ...result, ...ml.modelMetadata() } };
      }
      case '/check-nsfw': {
        const { url, window_title } = data;
        return { data: ml.checkNsfw(url || '', window_title || '') };
      }
      case '/embed': {
        const { text } = data;
        return { data: { embedding: await ml.embedText(text), ...ml.modelMetadata() } };
      }
      case '/embed/batch': {
        const { texts } = data;
        const embeddings = await Promise.all(texts.map(t => ml.embedText(t)));
        return { data: { embeddings, ...ml.modelMetadata() } };
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

export default client;
