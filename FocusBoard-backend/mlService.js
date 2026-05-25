'use strict';

const crypto = require('crypto');

const EMBEDDING_DIM = 384;
const MIN_SIMILARITY_THRESHOLD = 0.3;
const EMBED_CACHE_MAX = 256;

const embedCache = new Map();

const NSFW_KEYWORDS = [
  "nsfw", "porn", "xxx", "adult", "explicit", "nude", "sex",
  "gambling", "casino", "lottery", "betting", "poker"
];

const NSFW_DOMAINS = [
  "pornhub", "xvideos", "xhamster", "redtube", "youporn",
  "brazzers", "bangbros", "naughtyamerica", "playboy",
  "casino", "bet365", "pokerstars", "draftkings", "fanduel"
];

const SUSPICIOUS_PATTERNS = [
  /\.xxx\//, /\/adult\//, /\/18\+/, /\/nsfw\//,
  /gay\./, /lesbian\./, /transgender\./,
];

const APP_HINTS = [
  [["pycharm", "intellij", "vscode", "visual studio", "android studio", "terminal", "code", "sublime", "atom", "webstorm"],
   "development programming coding software engineering"],
  [["slack", "teams", "discord", "gmail", "email", "outlook", "zoom", "meet"],
   "communication messaging chat collaboration"],
  [["spotify", "netflix", "youtube", "music", "video", "game", "twitch", "hulu", "disney"],
   "entertainment games videos streaming leisure"],
  [["word", "docs", "notion", "sheet", "excel", "drive", "pdf", "evernote", "onenote"],
   "productivity documents spreadsheets notes office work"],
  [["photoshop", "figma", "illustrator", "design", "sketch", "indesign", "xd", "canva"],
   "design graphics creative visual"],
  [["chrome", "firefox", "safari", "edge", "browser"],
   "web browsing internet"],
];

function cosineSimilarity(a, b) {
  if (a.length === 0 || b.length === 0) return 0.0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0.0;
  return dot / denom;
}

function expandActivityText(text) {
  const textLower = text.toLowerCase();
  const hints = [];
  for (const [keys, hint] of APP_HINTS) {
    if (keys.some(k => textLower.includes(k))) {
      hints.push(hint);
    }
  }
  return hints.length > 0 ? `${text} ${hints.join(' ')}` : text;
}

function embedText(text) {
  const cached = embedCache.get(text);
  if (cached) return cached;

  const textLower = (text || '').toLowerCase();
  const vec = new Float64Array(EMBEDDING_DIM);

  if (!textLower.trim()) {
    const result = Array.from(vec);
    embedCache.set(text, result);
    if (embedCache.size > EMBED_CACHE_MAX) {
      const firstKey = embedCache.keys().next().value;
      embedCache.delete(firstKey);
    }
    return result;
  }

  const tokens = textLower.match(/\b\w+\b/g) || [];
  for (const token of tokens) {
    const h = crypto.createHash('md5').update(token).digest('hex');
    const idx = parseInt(h, 16) % EMBEDDING_DIM;
    vec[idx] += 1.0;
  }

  const compact = textLower.replace(/\s+/g, ' ').slice(0, 500);
  for (let i = 0; i < compact.length - 2; i++) {
    const gram = compact.slice(i, i + 3);
    const h = crypto.createHash('md5').update(gram).digest('hex');
    const idx = parseInt(h, 16) % EMBEDDING_DIM;
    vec[idx] += 0.5;
  }

  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }

  const result = Array.from(vec);
  embedCache.set(text, result);
  if (embedCache.size > EMBED_CACHE_MAX) {
    const firstKey = embedCache.keys().next().value;
    embedCache.delete(firstKey);
  }
  return result;
}

function modelMetadata() {
  return {
    model_name: 'hash-fallback',
    model_version: '1.0',
    embedding_dim: EMBEDDING_DIM,
  };
}

function checkNsfw(url, windowTitle) {
  const urlLower = (url || '').toLowerCase();
  const titleLower = (windowTitle || '').toLowerCase();
  const text = `${urlLower} ${titleLower}`;

  const matchedKeywords = NSFW_KEYWORDS.filter(kw => text.includes(kw));
  if (matchedKeywords.length > 0) {
    return { flagged: true, reason: `Matched keywords: ${matchedKeywords.join(', ')}`, confidence: 0.9 };
  }

  const matchedDomains = NSFW_DOMAINS.filter(d => urlLower.includes(d));
  if (matchedDomains.length > 0) {
    return { flagged: true, reason: `Matched blocked domains: ${matchedDomains.join(', ')}`, confidence: 0.95 };
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return { flagged: true, reason: 'Suspicious URL pattern detected', confidence: 0.7 };
    }
  }

  return { flagged: false, reason: '', confidence: 0.1 };
}

function findSimilar(text, categories, threshold) {
  if (!text || !categories || categories.length === 0) {
    return { categoryId: null, similarity: 0.0, meetsThreshold: false };
  }

  const effectiveThreshold = threshold != null ? threshold : MIN_SIMILARITY_THRESHOLD;
  const textEmb = embedText(expandActivityText(text));

  let bestMatch = null;
  let bestSimilarity = 0.0;

  for (const cat of categories) {
    if (!cat.embedding || cat.embedding.length === 0) continue;
    try {
      const sim = cosineSimilarity(textEmb, cat.embedding);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = cat;
      }
    } catch (e) {
      continue;
    }
  }

  if (bestMatch) {
    const meetsThreshold = bestSimilarity >= effectiveThreshold;
    return {
      categoryId: meetsThreshold ? bestMatch._id : null,
      similarity: bestSimilarity,
      meetsThreshold,
    };
  }

  return { categoryId: null, similarity: 0.0, meetsThreshold: false };
}

function findSimilarBatch(texts, categories, threshold) {
  return texts.map(text => findSimilar(text, categories, threshold));
}

function getModelStatus() {
  return {
    loaded: true,
    attempted: true,
    model_name: 'hash-fallback',
    model_version: '1.0',
    error: null,
    embedding_dim: EMBEDDING_DIM,
  };
}

module.exports = {
  embedText,
  expandActivityText,
  cosineSimilarity,
  checkNsfw,
  findSimilar,
  findSimilarBatch,
  getModelStatus,
  modelMetadata,
  EMBEDDING_DIM,
};
