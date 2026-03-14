const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';

const apps = [
  'Visual Studio Code', 'Google Chrome', 'Figma', 'Slack', 'Terminal',
  'Postman', 'MongoDB Compass', 'Notion', 'Spotify', 'Discord'
];

const windowTitles = [
  'main.js', 'Dashboard Design', 'Team Chat', 'API Testing', 'Database Query',
  'Documentation', 'Music Player', 'Video Call', 'Code Review', 'Planning'
];

async function login() {
  try {
    const res = await axios.post(`${API_BASE}/auth/dev-login`);
    authToken = res.data.token;
    console.log('✓ Logged in');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.message);
    return false;
  }
}

async function createBulkActivities(count = 100) {
  console.log(`\n--- Creating ${count} Activities ---`);
  const startTime = Date.now();
  const now = new Date();
  const promises = [];

  for (let i = 0; i < count; i++) {
    const app = apps[Math.floor(Math.random() * apps.length)];
    const title = windowTitles[Math.floor(Math.random() * windowTitles.length)];
    const activityStart = new Date(now.getTime() - (count - i) * 60000); // 1 min intervals
    const activityEnd = new Date(activityStart.getTime() + Math.random() * 1800000); // 0-30 min duration

    const promise = axios.post(`${API_BASE}/activities`, {
      app_name: app,
      window_title: title,
      start_time: activityStart.toISOString(),
      end_time: activityEnd.toISOString(),
      idle: Math.random() > 0.8,
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
    }).catch(err => ({ error: err.message }));

    promises.push(promise);

    // Batch requests in groups of 10
    if ((i + 1) % 10 === 0) {
      await Promise.all(promises.splice(0, 10));
      process.stdout.write(`\rProgress: ${i + 1}/${count}`);
    }
  }

  // Wait for remaining
  if (promises.length > 0) {
    await Promise.all(promises);
  }

  const duration = Date.now() - startTime;
  console.log(`\n✓ Created ${count} activities in ${(duration / 1000).toFixed(2)}s`);
  console.log(`  Average: ${(duration / count).toFixed(0)}ms per activity`);
}

async function testFetchPerformance() {
  console.log('\n--- Testing Fetch Performance ---');
  
  const tests = [
    { name: 'Fetch all activities', url: `${API_BASE}/activities` },
    { name: 'Fetch with date filter', url: `${API_BASE}/activities?startDate=${new Date(Date.now() - 86400000).toISOString()}` },
    { name: 'Fetch categories', url: `${API_BASE}/categories` },
  ];

  for (const test of tests) {
    const startTime = Date.now();
    try {
      const res = await axios.get(test.url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const duration = Date.now() - startTime;
      console.log(`✓ ${test.name}: ${duration}ms (${res.data.length} items)`);
    } catch (error) {
      console.error(`✗ ${test.name} failed:`, error.message);
    }
  }
}

async function testCategorizationPerformance() {
  console.log('\n--- Testing Categorization Performance ---');
  
  try {
    const res = await axios.get(`${API_BASE}/activities?limit=50`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const categorized = res.data.filter(a => a.category_id).length;
    const uncategorized = res.data.length - categorized;

    console.log(`✓ Categorization stats (last 50 activities):`);
    console.log(`  - Categorized: ${categorized} (${((categorized / res.data.length) * 100).toFixed(1)}%)`);
    console.log(`  - Uncategorized: ${uncategorized}`);
  } catch (error) {
    console.error('✗ Failed to fetch categorization stats:', error.message);
  }
}

async function runPerformanceTest() {
  console.log('=== FocusBoard Performance Test ===\n');
  
  if (!await login()) {
    process.exit(1);
  }

  await createBulkActivities(150);
  await testFetchPerformance();
  await testCategorizationPerformance();

  console.log('\n=== Performance Test Complete ===');
}

runPerformanceTest();
