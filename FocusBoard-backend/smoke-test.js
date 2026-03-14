const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

const endpoints = [
  { method: 'GET', path: '/', name: 'Root' },
  { method: 'GET', path: '/health', name: 'Health Check' },
  { method: 'GET', path: '/api/activities', name: 'Activities - Get All' },
  { method: 'GET', path: '/api/goals', name: 'Goals - Get All' },
  { method: 'GET', path: '/api/events', name: 'Events - Get All' },
  { method: 'GET', path: '/api/categories', name: 'Categories - Get All' },
  { method: 'GET', path: '/api/leads', name: 'Leads - Get All' },
  { method: 'GET', path: '/api/activity-mappings', name: 'Activity Mappings - Get All' },
  { method: 'GET', path: '/api/category-goals', name: 'Category Goals - Get All' },
  { method: 'GET', path: '/api/issue-types', name: 'Issue Types - Get All' },
  { method: 'GET', path: '/api/support-tickets', name: 'Support Tickets - Get All' },
  { method: 'GET', path: '/api/ticket-resolutions', name: 'Ticket Resolutions - Get All' },
  { method: 'GET', path: '/api/user-feedback', name: 'User Feedback - Get All' },
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, { method: endpoint.method });
    const status = response.status;
    const body = await response.json().catch(() => ({}));
    const ok = status >= 200 && status < 500;
    const dbOffline = body.offline === true;
    return { ...endpoint, status, ok, dbOffline };
  } catch (error) {
    return { ...endpoint, status: 'ERROR', ok: false, error: error.message };
  }
}

async function runSmokeTest() {
  console.log(`\n🔥 Smoke Test - ${BASE_URL}\n${'='.repeat(60)}\n`);
  
  const results = await Promise.all(endpoints.map(testEndpoint));
  
  const dbOffline = results.some(r => r.dbOffline);
  if (dbOffline) console.log('⚠️  Database is offline - API endpoints returning 503\n');
  
  results.forEach(r => {
    const icon = r.ok ? '✅' : '❌';
    const status = r.error ? `ERROR: ${r.error}` : r.dbOffline ? `${r.status} (DB offline)` : r.status;
    console.log(`${icon} [${r.method}] ${r.path.padEnd(35)} → ${status}`);
  });
  
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | Total: ${results.length}\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runSmokeTest();
