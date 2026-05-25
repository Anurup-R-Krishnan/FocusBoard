const { createModel } = require('../db/nedb');

module.exports = createModel('ticketresolutions', {
  _id: { type: String, default: () => require('crypto').randomUUID() },
  ticketId: { type: String, ref: 'SupportTicket', required: true },
  agentName: { type: String, required: true },
  resolutionNotes: { type: String, default: '' },
  escalateToDevTeam: { type: Boolean, default: false },
  statusUpdate: { type: String, default: 'Resolved' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true, modelName: 'TicketResolution', indices: ['ticketId'] });
