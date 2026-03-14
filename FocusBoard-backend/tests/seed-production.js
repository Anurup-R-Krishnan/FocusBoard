const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
let authToken = '';

const seedCategories = [
  { name: 'Development', color: '#3B82F6', keywords: ['code', 'vscode', 'programming', 'github', 'terminal'] },
  { name: 'Design', color: '#EC4899', keywords: ['figma', 'photoshop', 'design', 'sketch'] },
  { name: 'Communication', color: '#10B981', keywords: ['slack', 'teams', 'email', 'zoom', 'discord'] },
  { name: 'Research', color: '#A855F7', keywords: ['google', 'documentation', 'stackoverflow', 'research'] },
  { name: 'Entertainment', color: '#EF4444', keywords: ['youtube', 'netflix', 'spotify', 'gaming'] },
  { name: 'Productivity', color: '#F59E0B', keywords: ['notion', 'trello', 'asana', 'calendar'] },
];

async function login() {
  try {
    const res = await axios.post(`${BACKEND_URL}/api/auth/dev-login`);
    authToken = res.data.token;
    console.log('✓ Logged in');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.message);
    return false;
  }
}

async function seedData() {
  console.log('==========================================');
  console.log('FocusBoard Data Seeding');
  console.log('==========================================');
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  if (!await login()) {
    process.exit(1);
  }

  console.log('--- Seeding Categories ---');
  for (const cat of seedCategories) {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/categories`, cat, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✓ Created: ${cat.name} (${res.data._id})`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠ Skipped: ${cat.name} (already exists)`);
      } else {
        console.error(`✗ Failed: ${cat.name}`, error.response?.data || error.message);
      }
    }
  }

  console.log('\n--- Generating Embeddings ---');
  console.log('Run this command to generate embeddings:');
  console.log('Or locally with MONGODB_URL set to production');

  console.log('\n==========================================');
  console.log('✓ Seeding Complete!');
  console.log('==========================================\n');
}

seedData();
