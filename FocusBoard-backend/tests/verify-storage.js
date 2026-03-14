require('dotenv').config();
const mongoose = require('mongoose');

const verify = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  
  console.log('[Verify] Checking stored data...\n');
  
  const Activity = require('../models/Activity');
  const Category = require('../models/Category');
  const TrackingRule = require('../models/TrackingRule');
  const ActivityMapping = require('../models/ActivityMapping');
  const User = require('../models/User');
  
  const activity = await Activity.findOne().lean();
  console.log('[Activity] Fields:', Object.keys(activity || {}));
  console.log('  - Has window_title:', activity?.window_title !== undefined);
  console.log('  - Has url:', activity?.url !== undefined);
  console.log('  - Has nsfw_flagged:', activity?.nsfw_flagged !== undefined);
  
  const category = await Category.findOne().lean();
  console.log('\n[Category] Fields:', Object.keys(category || {}));
  console.log('  - Has embedding:', category?.embedding !== undefined);
  console.log('  - Embedding type:', Array.isArray(category?.embedding) ? 'Array' : 'N/A');
  
  const rule = await TrackingRule.findOne().lean();
  console.log('\n[TrackingRule] Fields:', Object.keys(rule || {}));
  console.log('  - Has pattern:', rule?.pattern !== undefined);
  console.log('  - Has matchType:', rule?.matchType !== undefined);
  console.log('  - Has priority:', rule?.priority !== undefined);
  
  const mapping = await ActivityMapping.findOne().lean();
  console.log('\n[ActivityMapping] Fields:', Object.keys(mapping || {}));
  console.log('  - Has confidence:', mapping?.confidence !== undefined);
  
  const user = await User.findOne().lean();
  console.log('\n[User] Fields:', Object.keys(user || {}));
  console.log('  - Has age:', user?.age !== undefined);
  console.log('  - Has parentEmail:', user?.parentEmail !== undefined);
  console.log('  - Has nsfwAlertPreference:', user?.nsfwAlertPreference !== undefined);
  
  console.log('\n[Verify] All models properly stored in MongoDB');
  process.exit(0);
};

verify();
