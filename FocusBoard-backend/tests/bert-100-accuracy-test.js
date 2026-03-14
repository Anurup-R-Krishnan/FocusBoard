const axios = require('axios');
const fs = require('fs');

const ML_SERVICE = 'http://localhost:5001';

const testCases = [
  // Development (20 tests)
  { text: 'Visual Studio Code', expected: 'Development', category: 'IDE' },
  { text: 'PyCharm Python IDE', expected: 'Development', category: 'IDE' },
  { text: 'IntelliJ IDEA Java', expected: 'Development', category: 'IDE' },
  { text: 'Android Studio', expected: 'Development', category: 'IDE' },
  { text: 'Xcode Swift', expected: 'Development', category: 'IDE' },
  { text: 'GitHub code review', expected: 'Development', category: 'Version Control' },
  { text: 'GitLab repository', expected: 'Development', category: 'Version Control' },
  { text: 'Terminal bash shell', expected: 'Development', category: 'CLI' },
  { text: 'Docker container', expected: 'Development', category: 'DevOps' },
  { text: 'Kubernetes deployment', expected: 'Development', category: 'DevOps' },
  { text: 'npm package manager', expected: 'Development', category: 'Tools' },
  { text: 'Postman API testing', expected: 'Development', category: 'Tools' },
  { text: 'MongoDB Compass database', expected: 'Development', category: 'Database' },
  { text: 'MySQL Workbench', expected: 'Development', category: 'Database' },
  { text: 'Redis Commander', expected: 'Development', category: 'Database' },
  { text: 'Vim text editor', expected: 'Development', category: 'Editor' },
  { text: 'Sublime Text coding', expected: 'Development', category: 'Editor' },
  { text: 'Eclipse IDE Java', expected: 'Development', category: 'IDE' },
  { text: 'NetBeans programming', expected: 'Development', category: 'IDE' },
  { text: 'Atom code editor', expected: 'Development', category: 'Editor' },
  
  // Communication (20 tests)
  { text: 'Slack team chat', expected: 'Communication', category: 'Messaging' },
  { text: 'Microsoft Teams meeting', expected: 'Communication', category: 'Messaging' },
  { text: 'Discord voice chat', expected: 'Communication', category: 'Messaging' },
  { text: 'Zoom video call', expected: 'Communication', category: 'Video' },
  { text: 'Google Meet conference', expected: 'Communication', category: 'Video' },
  { text: 'Skype call', expected: 'Communication', category: 'Video' },
  { text: 'WhatsApp messaging', expected: 'Communication', category: 'Messaging' },
  { text: 'Telegram chat', expected: 'Communication', category: 'Messaging' },
  { text: 'Gmail email', expected: 'Communication', category: 'Email' },
  { text: 'Outlook mail', expected: 'Communication', category: 'Email' },
  { text: 'Thunderbird email client', expected: 'Communication', category: 'Email' },
  { text: 'Signal secure messaging', expected: 'Communication', category: 'Messaging' },
  { text: 'Webex meeting', expected: 'Communication', category: 'Video' },
  { text: 'GoToMeeting conference', expected: 'Communication', category: 'Video' },
  { text: 'Mattermost team chat', expected: 'Communication', category: 'Messaging' },
  { text: 'Rocket.Chat messaging', expected: 'Communication', category: 'Messaging' },
  { text: 'IRC chat client', expected: 'Communication', category: 'Messaging' },
  { text: 'Matrix Element chat', expected: 'Communication', category: 'Messaging' },
  { text: 'Jitsi video call', expected: 'Communication', category: 'Video' },
  { text: 'BigBlueButton conference', expected: 'Communication', category: 'Video' },
  
  // Entertainment (20 tests)
  { text: 'Spotify music streaming', expected: 'Entertainment', category: 'Music' },
  { text: 'Netflix watching movies', expected: 'Entertainment', category: 'Video' },
  { text: 'YouTube videos', expected: 'Entertainment', category: 'Video' },
  { text: 'Twitch live streaming', expected: 'Entertainment', category: 'Streaming' },
  { text: 'Steam gaming platform', expected: 'Entertainment', category: 'Gaming' },
  { text: 'Epic Games Launcher', expected: 'Entertainment', category: 'Gaming' },
  { text: 'Discord gaming chat', expected: 'Entertainment', category: 'Gaming' },
  { text: 'Apple Music streaming', expected: 'Entertainment', category: 'Music' },
  { text: 'Amazon Prime Video', expected: 'Entertainment', category: 'Video' },
  { text: 'Hulu streaming', expected: 'Entertainment', category: 'Video' },
  { text: 'Disney Plus movies', expected: 'Entertainment', category: 'Video' },
  { text: 'HBO Max series', expected: 'Entertainment', category: 'Video' },
  { text: 'Tidal music', expected: 'Entertainment', category: 'Music' },
  { text: 'SoundCloud audio', expected: 'Entertainment', category: 'Music' },
  { text: 'Deezer music player', expected: 'Entertainment', category: 'Music' },
  { text: 'VLC media player', expected: 'Entertainment', category: 'Media' },
  { text: 'Plex media server', expected: 'Entertainment', category: 'Media' },
  { text: 'Kodi entertainment center', expected: 'Entertainment', category: 'Media' },
  { text: 'Minecraft game', expected: 'Entertainment', category: 'Gaming' },
  { text: 'Fortnite gaming', expected: 'Entertainment', category: 'Gaming' },
  
  // Productivity (20 tests)
  { text: 'Microsoft Word document', expected: 'Productivity', category: 'Documents' },
  { text: 'Google Docs writing', expected: 'Productivity', category: 'Documents' },
  { text: 'Excel spreadsheet', expected: 'Productivity', category: 'Spreadsheet' },
  { text: 'Google Sheets data', expected: 'Productivity', category: 'Spreadsheet' },
  { text: 'PowerPoint presentation', expected: 'Productivity', category: 'Presentation' },
  { text: 'Google Slides deck', expected: 'Productivity', category: 'Presentation' },
  { text: 'Notion notes', expected: 'Productivity', category: 'Notes' },
  { text: 'Evernote notebook', expected: 'Productivity', category: 'Notes' },
  { text: 'OneNote digital notes', expected: 'Productivity', category: 'Notes' },
  { text: 'Trello project board', expected: 'Productivity', category: 'Project Management' },
  { text: 'Asana task management', expected: 'Productivity', category: 'Project Management' },
  { text: 'Jira issue tracking', expected: 'Productivity', category: 'Project Management' },
  { text: 'Monday.com workflow', expected: 'Productivity', category: 'Project Management' },
  { text: 'Todoist task list', expected: 'Productivity', category: 'Tasks' },
  { text: 'TickTick todo app', expected: 'Productivity', category: 'Tasks' },
  { text: 'Obsidian knowledge base', expected: 'Productivity', category: 'Notes' },
  { text: 'Roam Research notes', expected: 'Productivity', category: 'Notes' },
  { text: 'Airtable database', expected: 'Productivity', category: 'Database' },
  { text: 'Coda documents', expected: 'Productivity', category: 'Documents' },
  { text: 'LibreOffice Writer', expected: 'Productivity', category: 'Documents' },
  
  // Design (20 tests)
  { text: 'Figma design tool', expected: 'Design', category: 'UI/UX' },
  { text: 'Adobe Photoshop editing', expected: 'Design', category: 'Graphics' },
  { text: 'Adobe Illustrator vector', expected: 'Design', category: 'Graphics' },
  { text: 'Sketch app design', expected: 'Design', category: 'UI/UX' },
  { text: 'Adobe XD prototyping', expected: 'Design', category: 'UI/UX' },
  { text: 'InVision design', expected: 'Design', category: 'UI/UX' },
  { text: 'Canva graphic design', expected: 'Design', category: 'Graphics' },
  { text: 'GIMP image editor', expected: 'Design', category: 'Graphics' },
  { text: 'Inkscape vector graphics', expected: 'Design', category: 'Graphics' },
  { text: 'Affinity Designer', expected: 'Design', category: 'Graphics' },
  { text: 'Affinity Photo editing', expected: 'Design', category: 'Graphics' },
  { text: 'Blender 3D modeling', expected: 'Design', category: '3D' },
  { text: 'Maya 3D animation', expected: 'Design', category: '3D' },
  { text: 'Cinema 4D rendering', expected: 'Design', category: '3D' },
  { text: 'AutoCAD drafting', expected: 'Design', category: 'CAD' },
  { text: 'SketchUp 3D design', expected: 'Design', category: '3D' },
  { text: 'Procreate digital art', expected: 'Design', category: 'Graphics' },
  { text: 'Framer prototyping', expected: 'Design', category: 'UI/UX' },
  { text: 'Principle animation', expected: 'Design', category: 'UI/UX' },
  { text: 'Zeplin design handoff', expected: 'Design', category: 'UI/UX' }
];

const categories = [
  { _id: 'dev', name: 'Development', description: 'Programming coding software development IDE tools' },
  { _id: 'comm', name: 'Communication', description: 'Email chat messaging video calls meetings collaboration' },
  { _id: 'ent', name: 'Entertainment', description: 'Games videos music streaming media entertainment' },
  { _id: 'prod', name: 'Productivity', description: 'Documents spreadsheets notes tasks project management' },
  { _id: 'design', name: 'Design', description: 'Graphics design UI UX prototyping creative visual' }
];

const runBertAccuracyTest = async () => {
  console.log('=== BERT ACCURACY TEST (100 CASES) ===\n');
  
  console.log('[Setup] Generating category embeddings...');
  const categoryEmbeddings = [];
  for (const cat of categories) {
    const res = await axios.post(`${ML_SERVICE}/embed`, {
      text: `${cat.name} ${cat.description}`
    });
    categoryEmbeddings.push({ ...cat, embedding: res.data.embedding });
  }
  
  console.log('[Test] Running 100 categorization tests...\n');
  
  const results = [];
  let correct = 0;
  let totalTime = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    const start = Date.now();
    
    const res = await axios.post(`${ML_SERVICE}/find-similar`, {
      text: test.text,
      categories: categoryEmbeddings
    });
    
    const duration = Date.now() - start;
    totalTime += duration;
    
    const predicted = categoryEmbeddings.find(c => c._id === res.data.categoryId)?.name || 'Unknown';
    const isCorrect = predicted === test.expected;
    if (isCorrect) correct++;
    
    results.push({
      test_number: i + 1,
      input: test.text,
      expected: test.expected,
      predicted: predicted,
      similarity: res.data.similarity,
      correct: isCorrect,
      duration_ms: duration,
      subcategory: test.category
    });
    
    if ((i + 1) % 20 === 0) {
      console.log(`[Progress] Completed ${i + 1}/100 tests...`);
    }
  }
  
  console.log('\n=== RESULTS ===\n');
  console.log(`Total Tests: 100`);
  console.log(`Correct: ${correct}`);
  console.log(`Incorrect: ${100 - correct}`);
  console.log(`Accuracy: ${(correct / 100 * 100).toFixed(2)}%`);
  console.log(`Average Time: ${(totalTime / 100).toFixed(2)}ms per test`);
  console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  
  // Category breakdown
  console.log('\n=== ACCURACY BY CATEGORY ===\n');
  const byCategory = {};
  results.forEach(r => {
    if (!byCategory[r.expected]) byCategory[r.expected] = { correct: 0, total: 0 };
    byCategory[r.expected].total++;
    if (r.correct) byCategory[r.expected].correct++;
  });
  
  Object.keys(byCategory).forEach(cat => {
    const acc = (byCategory[cat].correct / byCategory[cat].total * 100).toFixed(1);
    console.log(`${cat}: ${byCategory[cat].correct}/${byCategory[cat].total} (${acc}%)`);
  });
  
  // Save detailed report
  const report = {
    summary: {
      total_tests: 100,
      correct: correct,
      incorrect: 100 - correct,
      accuracy_percent: (correct / 100 * 100).toFixed(2),
      avg_time_ms: (totalTime / 100).toFixed(2),
      total_time_s: (totalTime / 1000).toFixed(2)
    },
    by_category: byCategory,
    detailed_results: results,
    model_info: {
      name: 'all-MiniLM-L6-v2',
      dimensions: 384,
      similarity_threshold: 0.7
    },
    nsfw_filters: {
      domains: ['pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'youporn.com'],
      keywords: ['porn', 'xxx', 'sex', 'nude', 'nsfw', 'adult', 'explicit']
    }
  };
  
  fs.writeFileSync('/home/anuruprkris/Project/focus/FocusBoard-backend/tests/bert-accuracy-report.json', 
    JSON.stringify(report, null, 2));
  
  console.log('\n[Report] Saved to: tests/bert-accuracy-report.json');
  
  process.exit(0);
};

runBertAccuracyTest().catch(console.error);
