const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';

// Test data
const testCategories = [
  { name: 'Development', color: '#3B82F6', keywords: ['code', 'programming', 'development'] },
  { name: 'Design', color: '#EC4899', keywords: ['figma', 'design', 'photoshop'] },
  { name: 'Communication', color: '#10B981', keywords: ['slack', 'email', 'teams'] },
  { name: 'Research', color: '#A855F7', keywords: ['google', 'research', 'documentation'] },
  { name: 'Entertainment', color: '#EF4444', keywords: ['youtube', 'netflix', 'gaming'] },
];

const testActivities = [
  { app_name: 'Visual Studio Code', window_title: 'main.js - FocusBoard', url: '' },
  { app_name: 'Google Chrome', window_title: 'React Documentation', url: 'https://react.dev' },
  { app_name: 'Figma', window_title: 'Dashboard Design', url: '' },
  { app_name: 'Slack', window_title: 'Team Chat', url: '' },
  { app_name: 'Terminal', window_title: 'npm run dev', url: '' },
];

async function login() {
  try {
    const res = await axios.post(`${API_BASE}/auth/dev-login`);
    authToken = res.data.token;
    console.log('✓ Logged in successfully');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createCategories() {
  console.log('\n--- Creating Categories ---');
  for (const cat of testCategories) {
    try {
      const res = await axios.post(`${API_BASE}/categories`, cat, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log(`✓ Created category: ${cat.name} (${res.data._id})`);
    } catch (error) {
      console.error(`✗ Failed to create ${cat.name}:`, error.response?.data || error.message);
    }
  }
}

async function createActivities() {
  console.log('\n--- Creating Activities ---');
  const now = new Date();
  
  for (let i = 0; i < testActivities.length; i++) {
    const activity = testActivities[i];
    const startTime = new Date(now.getTime() - (testActivities.length - i) * 3600000);
    const endTime = new Date(startTime.getTime() + 1800000); // 30 min duration

    try {
      const res = await axios.post(`${API_BASE}/activities`, {
        ...activity,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        idle: false,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log(`✓ Created activity: ${activity.app_name} (${res.data._id})`);
    } catch (error) {
      console.error(`✗ Failed to create activity:`, error.response?.data || error.message);
    }
  }
}

async function fetchAndDisplay() {
  console.log('\n--- Fetching Data ---');
  
  try {
    const [categoriesRes, activitiesRes] = await Promise.all([
      axios.get(`${API_BASE}/categories`, { headers: { Authorization: `Bearer ${authToken}` } }),
      axios.get(`${API_BASE}/activities`, { headers: { Authorization: `Bearer ${authToken}` } }),
    ]);

    console.log(`\n✓ Categories: ${categoriesRes.data.length}`);
    categoriesRes.data.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.color})`);
    });

    console.log(`\n✓ Activities: ${activitiesRes.data.length}`);
    activitiesRes.data.slice(0, 5).forEach(act => {
      const category = act.category_id ? act.category_id.name : 'Uncategorized';
      console.log(`  - ${act.app_name} → ${category}`);
    });
  } catch (error) {
    console.error('✗ Failed to fetch data:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('=== FocusBoard Integration Test ===\n');
  
  if (!await login()) {
    process.exit(1);
  }

  await createCategories();
  await createActivities();
  await fetchAndDisplay();

  console.log('\n=== Test Complete ===');
}

runTests();
