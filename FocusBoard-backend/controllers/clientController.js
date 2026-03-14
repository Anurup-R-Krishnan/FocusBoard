const Client = require('../models/Client');
const Task = require('../models/Task');

exports.createClient = async (req, res) => {
    try {
        const client = new Client({ ...req.body, user_id: req.user.id });
        await client.save();
        res.status(201).json({ success: true, data: client });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getClients = async (req, res) => {
    try {
        const { includeHours, search, sortBy, sortOrder, minHours, maxHours } = req.query;
        const query = { user_id: req.user.id };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        let clients = await Client.find(query);

        if (includeHours === 'true') {
            const results = await Promise.all(clients.map(async (client) => {
                const tasks = await Task.find({ client: client.name, user_id: req.user.id, billable: true });
                const totalSeconds = tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
                const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
                const billableAmount = totalHours * (client.hourlyRate || 0);
                
                return {
                    ...client.toObject(),
                    trackedHours: totalHours,
                    trackedSeconds: totalSeconds,
                    estimatedBillable: billableAmount,
                    taskCount: tasks.length
                };
            }));

            let filteredResults = results;
            if (minHours !== undefined) {
                filteredResults = filteredResults.filter(c => c.trackedHours >= parseFloat(minHours));
            }
            if (maxHours !== undefined) {
                filteredResults = filteredResults.filter(c => c.trackedHours <= parseFloat(maxHours));
            }

            if (sortBy) {
                const sortField = sortBy === 'hours' ? 'trackedHours' : sortBy === 'billable' ? 'estimatedBillable' : sortBy;
                const sortDir = sortOrder === 'desc' ? -1 : 1;
                filteredResults.sort((a, b) => {
                    if (a[sortField] < b[sortField]) return -sortDir;
                    if (a[sortField] > b[sortField]) return sortDir;
                    return 0;
                });
            }

            return res.status(200).json({ success: true, data: filteredResults });
        }

        if (sortBy) {
            const sortDir = sortOrder === 'desc' ? -1 : 1;
            clients.sort((a, b) => {
                if (a[sortBy] < b[sortBy]) return -sortDir;
                if (a[sortBy] > b[sortBy]) return sortDir;
                return 0;
            });
        }

        res.status(200).json({ success: true, data: clients });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getClientHours = async (req, res) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, user_id: req.user.id });
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
        
        const { startDate, endDate } = req.query;
        const filter = { client: client.name, user_id: req.user.id, billable: true };
        
        if (startDate && endDate) {
            filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        
        const tasks = await Task.find(filter);
        const totalSeconds = tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
        const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
        
        res.status(200).json({ 
            success: true, 
            data: {
                client: client.name,
                totalHours,
                totalSeconds,
                billableAmount: totalHours * (client.hourlyRate || 0),
                hourlyRate: client.hourlyRate || 0,
                taskCount: tasks.length,
                tasks: tasks.map(t => ({ 
                    title: t.title, 
                    timeSpent: t.timeSpent, 
                    status: t.status 
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
        res.status(200).json({ success: true, data: client });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
        res.status(200).json({ success: true, data: client });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportClients = async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const clients = await Client.find({ user_id: req.user.id });

        if (format === 'csv') {
            const headers = ['name', 'company', 'email', 'phone', 'hourlyRate', 'total_hours', 'billable_amount', 'color', 'notes'];
            const csvRows = [headers.join(',')];
            
            for (const client of clients) {
                const row = [
                    `"${(client.name || '').replace(/"/g, '""')}"`,
                    `"${(client.company || '').replace(/"/g, '""')}"`,
                    `"${(client.email || '').replace(/"/g, '""')}"`,
                    `"${(client.phone || '').replace(/"/g, '""')}"`,
                    client.hourlyRate || 0,
                    client.total_hours || 0,
                    client.billable_amount || 0,
                    `"${client.color || ''}"`,
                    `"${(client.notes || '').replace(/"/g, '""')}"`
                ];
                csvRows.push(row.join(','));
            }

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
            return res.send(csvRows.join('\n'));
        }

        res.status(200).json({ success: true, data: clients });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.bulkDeleteClients = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Client IDs array is required' });
        }

        const result = await Client.deleteMany({ 
            _id: { $in: ids }, 
            user_id: req.user.id 
        });

        res.status(200).json({ 
            success: true, 
            data: { deletedCount: result.deletedCount }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.bulkUpdateClients = async (req, res) => {
    try {
        const { ids, updates } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Client IDs array is required' });
        }
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ success: false, message: 'Updates object is required' });
        }

        const result = await Client.updateMany(
            { _id: { $in: ids }, user_id: req.user.id },
            { $set: updates }
        );

        res.status(200).json({ 
            success: true, 
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
