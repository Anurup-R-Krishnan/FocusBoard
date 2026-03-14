
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, Download, Check, Printer, Calendar } from 'lucide-react';

const EXPORT_PREVIEW_DATA = [
    { date: 'Oct 24', task: 'Dashboard UI', project: 'FocusBoard', duration: '1:30:00', billable: 'Yes' },
    { date: 'Oct 24', task: 'Design Sync', project: 'FocusBoard', duration: '0:45:00', billable: 'No' },
    { date: 'Oct 24', task: 'API Integration', project: 'CloudSync', duration: '2:15:00', billable: 'Yes' },
    { date: 'Oct 24', task: 'Email Review', project: 'Admin', duration: '0:30:00', billable: 'No' },
    { date: 'Oct 23', task: 'User Testing', project: 'FocusBoard', duration: '1:00:00', billable: 'Yes' },
    { date: 'Oct 23', task: 'Deployment', project: 'CloudSync', duration: '0:45:00', billable: 'Yes' },
];

const ExportScreen = () => {
    const [format, setFormat] = useState<'CSV' | 'PDF'>('PDF');

    return (
        <div className="flex flex-col xl:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls */}
            <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
                <div className="bg-titanium-dark border border-titanium-border rounded-2xl p-1 flex">
                    <button 
                        onClick={() => setFormat('PDF')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${format === 'PDF' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                    >
                        <FileText size={16} /> PDF
                    </button>
                    <button 
                        onClick={() => setFormat('CSV')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${format === 'CSV' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                    >
                        <FileSpreadsheet size={16} /> CSV
                    </button>
                </div>

                <div className="bg-titanium-dark border border-titanium-border rounded-2xl p-6 flex-1 flex flex-col">
                    <h3 className="text-sm font-bold text-white mb-6">Export Settings</h3>
                    
                    <div className="space-y-6 flex-1">
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">Date Range</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <select className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors appearance-none">
                                    <option>Last 30 Days</option>
                                    <option>This Month</option>
                                    <option>Last Month</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>
                        </div>

                        {format === 'PDF' && (
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Include Sections</label>
                                <div className="space-y-3">
                                    {['Summary Stats', 'Charts & Graphs', 'Session Log', 'Notes'].map(opt => (
                                        <label key={opt} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors -mx-2">
                                            <div className="w-5 h-5 rounded border border-white/20 bg-neutral-800 flex items-center justify-center group-hover:border-white/40 transition-colors">
                                                <Check size={12} className="text-white" />
                                            </div>
                                            <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {format === 'CSV' && (
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Columns</label>
                                <div className="space-y-3">
                                    {['Date', 'Time', 'Duration', 'Project', 'Client', 'Tags', 'Billable'].map(opt => (
                                        <label key={opt} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors -mx-2">
                                            <div className="w-5 h-5 rounded border border-white/20 bg-neutral-800 flex items-center justify-center group-hover:border-white/40 transition-colors">
                                                <Check size={12} className="text-white" />
                                            </div>
                                            <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <button className="w-full py-4 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                            <Download size={18} /> Export {format}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 bg-[#121212] border border-white/10 rounded-2xl p-8 overflow-y-auto relative flex flex-col items-center">
                <div className="absolute top-6 right-6 flex gap-2 z-10">
                    <button className="p-2 bg-neutral-800 border border-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors shadow-lg" title="Print"><Printer size={16} /></button>
                </div>

                {/* Paper Representation */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white text-black w-full max-w-3xl min-h-[900px] shadow-2xl p-12 origin-top transform transition-transform"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-neutral-100">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">Focus Report</h1>
                            <p className="text-neutral-500 mt-2 font-medium">October 1, 2023 - October 31, 2023</p>
                        </div>
                        <div className="text-right">
                            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center ml-auto mb-2 text-white font-bold">FB</div>
                            <div className="text-lg font-bold text-neutral-900">FocusBoard</div>
                            <p className="text-sm text-neutral-500">Pro Workspace</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Total Hours</p>
                            <p className="text-3xl font-bold text-neutral-900">124.5</p>
                        </div>
                        <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Deep Work</p>
                            <p className="text-3xl font-bold text-neutral-900">86.2</p>
                        </div>
                        <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Sessions</p>
                            <p className="text-3xl font-bold text-neutral-900">42</p>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-left text-sm mb-12">
                        <thead>
                            <tr className="border-b border-neutral-200">
                                <th className="py-3 font-bold text-neutral-900 uppercase text-xs tracking-wider">Date</th>
                                <th className="py-3 font-bold text-neutral-900 uppercase text-xs tracking-wider">Task</th>
                                <th className="py-3 font-bold text-neutral-900 uppercase text-xs tracking-wider">Project</th>
                                <th className="py-3 font-bold text-neutral-900 uppercase text-xs tracking-wider text-right">Duration</th>
                                <th className="py-3 font-bold text-neutral-900 uppercase text-xs tracking-wider text-right">Billable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {EXPORT_PREVIEW_DATA.map((row, i) => (
                                <tr key={i}>
                                    <td className="py-4 text-neutral-600 font-medium">{row.date}</td>
                                    <td className="py-4 font-bold text-neutral-900">{row.task}</td>
                                    <td className="py-4 text-neutral-600"><span className="bg-neutral-100 px-2 py-1 rounded text-xs font-bold border border-neutral-200">{row.project}</span></td>
                                    <td className="py-4 text-right font-mono text-neutral-600">{row.duration}</td>
                                    <td className="py-4 text-right text-neutral-600">{row.billable}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t border-neutral-200 pt-8 flex justify-between items-center text-xs text-neutral-400">
                        <span>Generated by FocusBoard</span>
                        <span>Page 1 of 1</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ExportScreen;
