import Workspace from '../models/Workspace.js';

const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({ $or: [
            { owner_id: req.user.id },
            { member_ids: req.user.id },
        ]});
        return res.status(200).json({ success: true, data: workspaces });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createWorkspace = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Workspace name is required.' });
        }
        const workspace = await Workspace.create({
            name: name.trim(),
            owner_id: req.user.id,
            member_ids: [req.user.id],
        });
        return res.status(201).json({ success: true, data: workspace });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateWorkspace = async (req, res) => {
    try {
        const { name, member_ids, seat_limit } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (member_ids !== undefined) updates.member_ids = member_ids;
        if (seat_limit !== undefined) updates.seat_limit = seat_limit;

        const workspace = await Workspace.findOneAndUpdate(
            { _id: req.params.id, owner_id: req.user.id },
            { $set: updates }
        );
        if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });
        return res.status(200).json({ success: true, data: workspace });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findOneAndDelete({ _id: req.params.id, owner_id: req.user.id });
        if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found.' });
        return res.status(200).json({ success: true, message: 'Workspace deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace };
