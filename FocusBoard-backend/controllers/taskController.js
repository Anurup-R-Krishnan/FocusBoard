import Task from '../models/Task.js';

export const createTask = async (req, res) => {
    try {
        const task = await Task.create({ ...req.body, user_id: req.user.id });

        const io = req.app.get('io');
        if (io) {
            try { io.emit('data_updated', { type: 'tasks', action: 'create', data: task }); }
            catch (e) { console.error('Socket emit error:', e.message); }
        }

        res.status(201).json({ success: true, data: task });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getTasks = async (req, res) => {
    try {
        const { status, archived, page = 1, limit = 50 } = req.query;
        const filter = { user_id: req.user.id };
        
        if (status) filter.status = status;
        if (archived !== undefined) filter.archived = archived === 'true';

        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), 100);
        const skip = (safePage - 1) * safeLimit;
        
        const total = await Task.countDocuments(filter);
        const tasks = await Task.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit);

        res.status(200).json({ success: true, total, page: safePage, limit: safeLimit, data: tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { timeToAdd, ...updateData } = req.body;
        
        let task = await Task.findOne({ _id: req.params.id, user_id: req.user.id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (timeToAdd && typeof timeToAdd === 'number' && timeToAdd > 0) {
            updateData.timeSpent = (task.timeSpent || 0) + timeToAdd;
            delete updateData.timeToAdd;
        }

        await Task.updateOne({ _id: task._id }, { $set: updateData });
        Object.assign(task, updateData);

        const io = req.app.get('io');
        if (io) {
            try { io.emit('data_updated', { type: 'tasks', action: 'update', data: task }); }
            catch (e) { console.error('Socket emit error:', e.message); }
        }

        res.status(200).json({ success: true, data: task });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const logTime = async (req, res) => {
    try {
        const { minutes } = req.body;
        
        if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
            return res.status(400).json({ success: false, message: 'Valid minutes required' });
        }

        const task = await Task.findOne({ _id: req.params.id, user_id: req.user.id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        const newTime = (task.timeSpent || 0) + (minutes * 60);
        await Task.updateOne({ _id: task._id }, { $set: { timeSpent: newTime } });
        task.timeSpent = newTime;

        const io = req.app.get('io');
        if (io) {
            try { io.emit('data_updated', { type: 'tasks', action: 'time_logged', data: task }); }
            catch (e) { console.error('Socket emit error:', e.message); }
        }

        res.status(200).json({ success: true, data: task, message: `Added ${minutes} minutes` });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        const io = req.app.get('io');
        if (io) {
            try { io.emit('data_updated', { type: 'tasks', action: 'delete', data: task }); }
            catch (e) { console.error('Socket emit error:', e.message); }
        }

        res.status(200).json({ success: true, data: task });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
