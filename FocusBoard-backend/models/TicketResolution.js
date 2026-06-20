import crypto from 'crypto';
import { createModel } from '../db/nedb.js';

export default createModel('ticketresolutions', {
  _id: { type: String, default: () => crypto.randomUUID() },
  ticketId: { type: String, ref: 'SupportTicket', required: true },
  agentName: { type: String, required: true },
  resolutionNotes: { type: String, default: '' },
  escalateToDevTeam: { type: Boolean, default: false },
  statusUpdate: { type: String, default: 'Resolved' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true, modelName: 'TicketResolution', indices: ['ticketId'] });
