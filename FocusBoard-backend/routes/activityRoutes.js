const express = require('express');
const router = express.Router();

const {
    createActivity,
    createActivitiesBatch,
    getAllActivities,
    getActivityById,
    updateActivity,
    deleteActivity,
    bulkDeleteActivities,
    getRecentActivities,
    exportActivities,
    importActivities,
} = require('../controllers/activityController');

// --------------------------------------------------
// Activity Routes  →  mounted at /api/activities
// --------------------------------------------------

// Create a new activity log entry
router.post('/', createActivity);

// Batch create activities (max 50)
router.post('/batch', createActivitiesBatch);

// Import activities (max 1000)
router.post('/import', importActivities);

// Get all activities (supports ?startDate, ?endDate, ?app_name, ?page, ?limit)
router.get('/', getAllActivities);

// Export activities (?startDate, ?endDate, ?format=json|csv)
router.get('/export', exportActivities);

// Bulk delete by date range (?startDate=...&endDate=...)
router.delete('/', bulkDeleteActivities);

// Get the N most recent activities for the authenticated user
router.get('/recent', getRecentActivities);

// Get a single activity by its ID
router.get('/:id', getActivityById);

// Update an activity (partial update supported)
router.put('/:id', updateActivity);

// Delete a single activity by ID
router.delete('/:id', deleteActivity);

module.exports = router;
