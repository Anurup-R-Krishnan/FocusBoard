import Project from '../models/Project.js';
import Task from '../models/Task.js';
import * as mlClient from '../services/mlClient.js';

export const createProject = async (req, res) => {
    try {
        const projectData = { ...req.body, user_id: req.user.id };
        const textToEmbed = `${projectData.title} ${projectData.description || ''}`.trim();
        const embedding = await mlClient.getEmbedding(textToEmbed);
        if (embedding) {
            projectData.embedding = Array.from(embedding);
        }

        const project = await Project.create(projectData);

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

export const getProjects = async (req, res) => {
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

export const calculateProgress = async (req, res) => {
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
                await Project.updateOne({ _id: project._id }, { $set: { progress } });
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

export const updateProject = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.title || updates.description !== undefined) {
            const projectToUpdate = await Project.findOne({ _id: req.params.id, user_id: req.user.id });
            if (projectToUpdate) {
                const newTitle = updates.title || projectToUpdate.title;
                const newDesc = updates.description !== undefined ? updates.description : projectToUpdate.description;
                const textToEmbed = `${newTitle} ${newDesc || ''}`.trim();
                const embedding = await mlClient.getEmbedding(textToEmbed);
                if (embedding) {
                    updates.embedding = Array.from(embedding);
                }
            }
        }

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            updates,
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

export const deleteProject = async (req, res) => {
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
