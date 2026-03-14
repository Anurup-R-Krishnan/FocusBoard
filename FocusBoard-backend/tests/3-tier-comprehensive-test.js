const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3000/api';
const ML_SERVICE = 'http://localhost:5001';

let TOKEN = '';
let CATEGORY_ID = '';

const testData = {
  tier1_ruleMatching: [],
  tier2_mlEmbedding: [],
  tier3_nsfw: [],
  performance: {}
};

const log = (tier, message) => {
  console.log(`[${tier}] ${message}`);
  testData[tier].push({ timestamp: new Date().toISOString(), message });
};

const test3TierSystem = async () => {
  console.log('=== 3-TIER CATEGORIZATION SYSTEM TEST ===\n');
  
  // Setup
  console.log('[Setup] Getting auth token...');
  const auth = await axios.post(`${API_BASE}/auth/dev-login`, { email_id: 'admin@test.com' });
  TOKEN = auth.data.data.token;
  
  console.log('[Setup] Creating test categories...');
  const categories = [
    { name: 'Development', description: 'Programming coding software development' },
    { name: 'Communication', description: 'Email chat messaging slack teams' },
    { name: 'Entertainment', description: 'Games videos music streaming' },
    { name: 'Productivity', description: 'Documents spreadsheets notes planning' },
    { name: 'Design', description: 'Graphics design figma photoshop creative' }
  ];
  
  for (const cat of categories) {
    const res = await axios.post(`${API_BASE}/categories`, cat, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    if (cat.name === 'Development') CATEGORY_ID = res.data.data._id;
  }
  
  console.log('[Setup] Generating embeddings...');
  const { exec } = require('child_process');
  await new Promise((resolve) => {
    exec('npm run generate-embeddings', { cwd: '/home/anuruprkris/Project/focus/FocusBoard-backend' }, resolve);
  });
  
  // TIER 1: Rule-Based Matching
  console.log('\n=== TIER 1: RULE-BASED MATCHING ===\n');
  
  log('tier1_ruleMatching', 'Creating tracking rules...');
  const rules = [
    { pattern: '*code*', matchType: 'app_name', priority: 100 },
    { pattern: '*studio*', matchType: 'app_name', priority: 90 },
    { pattern: '*slack*', matchType: 'app_name', priority: 80 }
  ];
  
  for (const rule of rules) {
    await axios.post(`${API_BASE}/tracking-rules`, 
      { ...rule, categoryId: CATEGORY_ID },
      { headers: { Authorization: `Bearer ${TOKEN}` }}
    );
  }
  
  log('tier1_ruleMatching', 'Testing rule matching...');
  const tier1Tests = [
    { app: 'Visual Studio Code', shouldMatch: true },
    { app: 'VS Code', shouldMatch: true },
    { app: 'Android Studio', shouldMatch: true },
    { app: 'Slack', shouldMatch: true },
    { app: 'Chrome', shouldMatch: false },
    { app: 'Firefox', shouldMatch: false }
  ];
  
  let tier1Correct = 0;
  for (const test of tier1Tests) {
    const activity = await axios.post(`${API_BASE}/activities`, {
      app_name: test.app,
      window_title: 'Test',
      url: '',
      start_time: new Date().toISOString()
    });
    
    const mappings = await axios.get(`${API_BASE}/activity-mappings?activityId=${activity.data.data._id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    const matched = mappings.data.total > 0;
    const correct = matched === test.shouldMatch;
    if (correct) tier1Correct++;
    
    log('tier1_ruleMatching', `${test.app}: Expected ${test.shouldMatch}, Got ${matched} - ${correct ? 'PASS' : 'FAIL'}`);
  }
  
  log('tier1_ruleMatching', `Accuracy: ${tier1Correct}/${tier1Tests.length} (${(tier1Correct/tier1Tests.length*100).toFixed(1)}%)`);
  
  // TIER 2: ML Embedding
  console.log('\n=== TIER 2: ML EMBEDDING CATEGORIZATION ===\n');
  
  log('tier2_mlEmbedding', 'Creating uncategorized activities...');
  const tier2Tests = [
    { app: 'PyCharm', expected: 'Development' },
    { app: 'IntelliJ IDEA', expected: 'Development' },
    { app: 'Microsoft Teams', expected: 'Communication' },
    { app: 'Discord', expected: 'Communication' },
    { app: 'Spotify', expected: 'Entertainment' },
    { app: 'Netflix', expected: 'Entertainment' },
    { app: 'Microsoft Word', expected: 'Productivity' },
    { app: 'Google Docs', expected: 'Productivity' },
    { app: 'Adobe Photoshop', expected: 'Design' },
    { app: 'Figma', expected: 'Design' }
  ];
  
  const activityIds = [];
  for (const test of tier2Tests) {
    const activity = await axios.post(`${API_BASE}/activities`, {
      app_name: test.app,
      window_title: '',
      url: '',
      start_time: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    });
    activityIds.push({ id: activity.data.data._id, ...test });
  }
  
  log('tier2_mlEmbedding', 'Triggering background categorization...');
  const { runCategorizationJob } = require('../services/backgroundCategorization');
  await runCategorizationJob();
  
  log('tier2_mlEmbedding', 'Checking ML categorization results...');
  let tier2Correct = 0;
  for (const test of activityIds) {
    const mappings = await axios.get(`${API_BASE}/activity-mappings?activityId=${test.id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    if (mappings.data.total > 0) {
      const categoryName = mappings.data.data[0].categoryId.name;
      const correct = categoryName === test.expected;
      if (correct) tier2Correct++;
      log('tier2_mlEmbedding', `${test.app}: Expected ${test.expected}, Got ${categoryName} - ${correct ? 'PASS' : 'FAIL'}`);
    } else {
      log('tier2_mlEmbedding', `${test.app}: No mapping created - FAIL`);
    }
  }
  
  log('tier2_mlEmbedding', `Accuracy: ${tier2Correct}/${tier2Tests.length} (${(tier2Correct/tier2Tests.length*100).toFixed(1)}%)`);
  
  // TIER 3: NSFW Detection
  console.log('\n=== TIER 3: NSFW DETECTION ===\n');
  
  log('tier3_nsfw', 'Testing NSFW filters...');
  const nsfwTests = [
    { url: 'https://pornhub.com/video', title: 'Normal Title', shouldFlag: true, reason: 'Domain' },
    { url: 'https://xvideos.com', title: 'Test', shouldFlag: true, reason: 'Domain' },
    { url: 'https://google.com', title: 'xxx content here', shouldFlag: true, reason: 'Keyword' },
    { url: 'https://youtube.com', title: 'adult video', shouldFlag: true, reason: 'Keyword' },
    { url: 'https://github.com', title: 'Code Review', shouldFlag: false, reason: 'Clean' },
    { url: 'https://stackoverflow.com', title: 'Programming Help', shouldFlag: false, reason: 'Clean' }
  ];
  
  let tier3Correct = 0;
  for (const test of nsfwTests) {
    const result = await axios.post(`${ML_SERVICE}/check-nsfw`, {
      url: test.url,
      window_title: test.title
    });
    
    const correct = result.data.flagged === test.shouldFlag;
    if (correct) tier3Correct++;
    
    log('tier3_nsfw', `URL: ${test.url}, Title: "${test.title}" - Expected ${test.shouldFlag}, Got ${result.data.flagged} (${result.data.reason || 'clean'}) - ${correct ? 'PASS' : 'FAIL'}`);
  }
  
  log('tier3_nsfw', `Accuracy: ${tier3Correct}/${nsfwTests.length} (${(tier3Correct/nsfwTests.length*100).toFixed(1)}%)`);
  
  // Performance Test
  console.log('\n=== PERFORMANCE TEST ===\n');
  const start = Date.now();
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(axios.post(`${API_BASE}/activities`, {
      app_name: `TestApp${i}`,
      window_title: `Window${i}`,
      url: '',
      start_time: new Date().toISOString()
    }).catch(() => null));
  }
  await Promise.all(promises);
  const duration = Date.now() - start;
  
  testData.performance = {
    total_activities: 100,
    duration_ms: duration,
    avg_per_activity_ms: duration / 100
  };
  
  console.log(`[Performance] 100 activities created in ${duration}ms (${(duration/100).toFixed(2)}ms avg)`);
  
  // Save report
  fs.writeFileSync('/home/anuruprkris/Project/focus/FocusBoard-backend/tests/3-tier-test-report.json', 
    JSON.stringify(testData, null, 2));
  
  console.log('\n=== TEST COMPLETE ===');
  console.log(`Report saved to: tests/3-tier-test-report.json`);
  
  process.exit(0);
};

test3TierSystem().catch(console.error);
