const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

const performanceTest = async () => {
  console.log('[Performance Test] Creating 100 activities simultaneously...\n');
  
  const apps = [
    'Visual Studio Code', 'Chrome', 'Firefox', 'Slack', 'Discord',
    'Spotify', 'Terminal', 'Postman', 'Docker', 'MongoDB Compass',
    'Figma', 'Notion', 'Zoom', 'Teams', 'Excel'
  ];
  
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < 100; i++) {
    const app = apps[i % apps.length];
    const promise = axios.post(`${API_BASE}/activities`, {
      app_name: `${app} ${i}`,
      window_title: `Window ${i}`,
      url: `https://example.com/${i}`,
      start_time: new Date(Date.now() - i * 1000).toISOString(),
      color: 'blue',
      idle: 0
    }).catch(err => ({ error: err.message }));
    
    promises.push(promise);
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  const successful = results.filter(r => r.data?.success).length;
  const failed = results.filter(r => r.error).length;
  
  console.log(`[Performance Test] Completed in ${endTime - startTime}ms`);
  console.log(`[Performance Test] Successful: ${successful}`);
  console.log(`[Performance Test] Failed: ${failed}`);
  console.log(`[Performance Test] Average: ${((endTime - startTime) / 100).toFixed(2)}ms per activity`);
  
  console.log('\n[Performance Test] Checking auto-categorization...');
  const mappings = await axios.get(`${API_BASE}/activity-mappings`);
  console.log(`[Performance Test] Mappings created: ${mappings.data.total}`);
};

performanceTest().catch(console.error);
