const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const ML_SERVICE = 'http://localhost:5001';

const testIntegration = async () => {
  console.log('[Integration Test] Starting tests\n');

  try {
    // Test 1: ML Service Health Check
    console.log('[Test 1] Testing ML Service Health...');
    const healthCheck = await axios.get(`${ML_SERVICE}/health`);
    console.log('[Test 1] ML Service is healthy:', healthCheck.data);

    // Test 2: Create Tracking Rule
    console.log('\n[Test 2] Creating tracking rule for "Visual Studio Code"...');
    const ruleResponse = await axios.post(`${API_BASE}/tracking-rules`, {
      categoryId: 'test-category-id',
      pattern: 'Visual Studio Code',
      matchType: 'app_name',
      priority: 100
    }, {
      headers: { Authorization: 'Bearer YOUR_TOKEN_HERE' }
    });
    console.log('[Test 2] Rule created:', ruleResponse.data);

    // Test 3: Create Activity with Rule Match
    console.log('\n[Test 3] Creating activity that matches rule...');
    const activityResponse = await axios.post(`${API_BASE}/activities`, {
      app_name: 'Visual Studio Code',
      window_title: 'main.js - FocusBoard',
      url: '',
      start_time: new Date().toISOString(),
      color: 'blue',
      idle: 0
    });
    console.log('[Test 3] Activity created:', activityResponse.data);

    // Test 4: Verify Mapping Created
    console.log('\n[Test 4] Checking if mapping was auto-created...');
    const mappings = await axios.get(`${API_BASE}/activity-mappings?activityId=${activityResponse.data.data._id}`, {
      headers: { Authorization: 'Bearer YOUR_TOKEN_HERE' }
    });
    console.log('[Test 4] Mappings found:', mappings.data.total);

    // Test 5: Create Activity Without Rule Match
    console.log('\n[Test 5] Creating activity without rule match...');
    const uncategorizedActivity = await axios.post(`${API_BASE}/activities`, {
      app_name: 'Unknown App',
      window_title: 'Some Window',
      url: '',
      start_time: new Date().toISOString(),
      color: 'blue',
      idle: 0
    });
    console.log('[Test 5] Uncategorized activity created:', uncategorizedActivity.data.data._id);
    console.log('[Test 5] Wait 2 minutes for background job to categorize...');

    // Test 6: NSFW URL Detection
    console.log('\n[Test 6] Testing NSFW URL detection...');
    const nsfwActivity = await axios.post(`${API_BASE}/activities`, {
      app_name: 'Chrome',
      window_title: 'Browsing',
      url: 'https://pornhub.com/test',
      start_time: new Date().toISOString(),
      color: 'blue',
      idle: 0
    });
    console.log('[Test 6] NSFW activity created, flagged:', nsfwActivity.data.data.nsfw_flagged);

    // Test 7: Manual Override with Rule Suggestion
    console.log('\n[Test 7] Testing manual override...');
    if (mappings.data.data.length > 0) {
      const overrideResponse = await axios.put(
        `${API_BASE}/activity-mappings/${mappings.data.data[0]._id}`,
        {
          categoryId: 'new-category-id',
          isManualOverride: true
        },
        {
          headers: { Authorization: 'Bearer YOUR_TOKEN_HERE' }
        }
      );
      console.log('[Test 7] Override response:', overrideResponse.data);
      if (overrideResponse.data.suggestRule) {
        console.log('[Test 7] Rule suggestion:', overrideResponse.data.message);
      }
    }

    // Test 8: Parental Controls
    console.log('\n[Test 8] Testing parental controls...');
    const parentalResponse = await axios.put(
      `${API_BASE}/auth/parental-controls`,
      {
        age: 14,
        parentEmail: 'parent@example.com',
        nsfwAlertPreference: 'both'
      },
      {
        headers: { Authorization: 'Bearer YOUR_TOKEN_HERE' }
      }
    );
    console.log('[Test 8] Parental controls updated:', parentalResponse.data);

    console.log('\n[Integration Test] All tests completed');
    console.log('\n[Manual Tests Required]');
    console.log('- Wait 2 minutes and check if uncategorized activity gets categorized');
    console.log('- Verify NSFW alerts are sent to parent email');
    console.log('- Test with 100 simultaneous activities for performance');

  } catch (error) {
    console.error('[Integration Test] Test failed:', error.response?.data || error.message);
  }
};

testIntegration();
