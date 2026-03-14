const User = require('../models/User');
const Task = require('../models/Task');
const Event = require('../models/Event');

// Fetch all squad members (users with roles and status)
exports.getSquad = async (req, res) => {
    try {
        const squad = await User.find({}, 'name email_id role status avatar last_active_at');
        const memberIds = squad.map(member => member._id);

        const activeTasks = await Task.find({
            user_id: { $in: memberIds },
            archived: false,
            status: { $in: ['IN_PROGRESS', 'TODO'] },
        })
            .sort({ updatedAt: -1 })
            .select('user_id title status updatedAt');

        const tasksByUser = new Map();
        activeTasks.forEach((task) => {
            const existing = tasksByUser.get(task.user_id);
            if (!existing) {
                tasksByUser.set(task.user_id, task);
                return;
            }
            if (existing.status !== 'IN_PROGRESS' && task.status === 'IN_PROGRESS') {
                tasksByUser.set(task.user_id, task);
            }
        });

        const formattedSquad = squad.map(member => ({
            id: member._id,
            name: member.name,
            email: member.email_id,
            role: member.role,
            status: member.status,
            avatarUrl: member.avatar,
            lastActive: member.last_active_at ? new Date(member.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
            currentTask: tasksByUser.get(member._id)?.title || ''
        }));

        res.status(200).json({ success: true, data: formattedSquad });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Nudge a team member
exports.nudgeMember = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const actorUserId = req.user?.id;

        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'Target user id is required.' });
        }

        const [targetUser, actorUser] = await Promise.all([
            User.findById(targetUserId),
            actorUserId ? User.findById(actorUserId) : Promise.resolve(null),
        ]);

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Target user not found.' });
        }

        const actorName = actorUser?.name || 'Teammate';
        const now = new Date();

        const nudgeEvent = await Event.create({
            title: `Nudge from ${actorName}`,
            user_id: targetUserId,
            start_time: now,
            end_time: now,
            event_type: 'PERSONAL',
            priority: 2,
            description: `${actorName} nudged you to refocus.`,
            label_color: '#f97316',
            attendees: [],
            is_recurring: false,
            calendar: 'google',
        });

        const io = req.app.get('io');
        if (io) {
            try {
                io.emit('data_updated', {
                    type: 'team_nudge',
                    action: 'create',
                    data: {
                        id: nudgeEvent._id,
                        targetUserId,
                        actorUserId,
                        actorName,
                        createdAt: nudgeEvent.createdAt,
                    },
                });
            } catch (_e) {
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully nudged user ${targetUserId}`,
            data: {
                nudgeEventId: nudgeEvent._id,
                targetUserId,
                actorUserId,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
