const Invite = require('../models/Invite');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

exports.createInvite = async (req, res) => {
  try {
    const { workspace_id, invitee_email, role } = req.body;

    if (!workspace_id || !invitee_email) {
      return res.status(400).json({ success: false, message: 'Workspace ID and invitee email are required.' });
    }

    const workspace = await Workspace.findOne({
      _id: workspace_id,
      $or: [{ owner_id: req.user.id }, { member_ids: req.user.id }],
    });
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    if (workspace.member_ids && workspace.seat_limit && workspace.member_ids.length >= workspace.seat_limit) {
      return res.status(400).json({ success: false, message: 'Workspace seat limit reached.' });
    }

    const existing = await Invite.findOne({
      workspace_id,
      invitee_email,
      status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An active invite already exists for this email.' });
    }

    const invite = await Invite.create({
      workspace_id,
      inviter_id: req.user.id,
      invitee_email,
      role: role || 'Member',
    });

    return res.status(201).json({ success: true, data: invite });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWorkspaceInvites = async (req, res) => {
  try {
    const invites = await Invite.find({ workspace_id: req.params.workspaceId });
    return res.status(200).json({ success: true, data: invites });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingInvites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const invites = await Invite.find({
      invitee_email: user.email_id,
      status: 'pending',
    });

    const workspaceIds = [...new Set(invites.map(i => i.workspace_id))];
    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });
    const workspaceMap = {};
    workspaces.forEach(w => { workspaceMap[w._id] = w; });

    const enriched = invites.map(i => ({
      ...i,
      workspace: workspaceMap[i.workspace_id] || null,
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const invite = await Invite.findOne({ _id: req.params.id, status: 'pending' });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found or already handled.' });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.email_id !== invite.invitee_email) {
      return res.status(403).json({ success: false, message: 'This invite is not for your account.' });
    }

    const workspace = await Workspace.findById(invite.workspace_id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace no longer exists.' });
    }

    const updatedMembers = workspace.member_ids || [];
    if (!updatedMembers.includes(req.user.id)) {
      updatedMembers.push(req.user.id);
    }

    await Workspace.findOneAndUpdate(
      { _id: workspace._id },
      { $set: { member_ids: updatedMembers } },
    );

    await Invite.findOneAndUpdate(
      { _id: invite._id },
      { $set: { status: 'accepted' } },
    );

    return res.status(200).json({ success: true, message: 'Invite accepted. You are now a member of the workspace.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.declineInvite = async (req, res) => {
  try {
    const invite = await Invite.findOne({ _id: req.params.id, status: 'pending' });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found or already handled.' });
    }

    await Invite.findOneAndUpdate(
      { _id: invite._id },
      { $set: { status: 'declined' } },
    );

    return res.status(200).json({ success: true, message: 'Invite declined.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteInvite = async (req, res) => {
  try {
    const invite = await Invite.findOne({ _id: req.params.id });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found.' });
    }

    const workspace = await Workspace.findById(invite.workspace_id);
    if (!workspace || workspace.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the workspace owner can revoke invites.' });
    }

    await Invite.findOneAndDelete({ _id: invite._id });
    return res.status(200).json({ success: true, message: 'Invite revoked.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
