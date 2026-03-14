const Project = require('../models/Project');
const Task = require('../models/Task');

exports.createProject = async (req, res) => {
    try {
        const project = new Project({ ...req.body, user_id: req.user.id });
        await project.save();

        const io = req.app.get('io');
        if (io) {
            try { io.emit('data_updated', { type: 'projects', action: 'create', data: project }); }
            catch (e) { console.error('Socket emit error:', e.message); }
        }

        res.status(201).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const { includeProgress } = req.query;
        const projects = await Project.find({ user_id: req.user.id });
        
        if (includeProgress === 'true') {
            const results = await Promise.all(projects.map(async (project) => {
                const tasks = await Task.find({ project: project.title, user_id: req.user.id });
                const total = tasks.length;
                const done = tasks.filter(t => t.status === 'DONE').length;
                const progress = total > 0 ? Math.round((done / total) * 100) : 0;
                
                return {
                    ...project.toObject(),
                    calculatedProgress: progress,
                    taskStats: { total, done, inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length, todo: tasks.filter(t => t.status === 'TODO').length }
                };
            }));
            return res.status(200).json({ success: true, data: results });
        }
        
        res.status(200).json({ success: true, data: projects });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.calculateProgress = async (req, res) => {
    try {
        const projects = await Project.find({ user_id: req.user.id });
        const results = [];
        
        for (const project of projects) {
            const tasks = await Task.find({ project: project.title, user_id: req.user.id });
            const total = tasks.length;
            const done = tasks.filter(t => t.status === 'DONE').length;
            const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;
            
            if (progress !== project.progress) {
                project.progress = progress;
                await project.save();
            }
            
            results.push({
                projectId: project._id,
                title: project.title,
                progress,
                tasks: { total, done, inProgress, todo: total - done - inProgress }
            });
        }
        
        res.status(200).json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const io = req.app.get('io');
        if (io) {
            try { io.emit('data_updated', { type: 'projects', action: 'update', data: project }); }
            catch (e) { console.error('Socket emit error:', e.message); }
        }

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const io = req.app.get('io');
        if (io) {
            try { io.emit('data_updated', { type: 'projects', action: 'delete', data: project }); }
            catch (e) { console.error('Socket emit error:', e.message); }
        }

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
