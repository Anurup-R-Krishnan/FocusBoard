
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, Plus, RefreshCw, Check, Video, Search, Settings, MapPin, Users, X, MoreVertical, Trash2, Edit2, Copy, Filter, AlignLeft, PanelLeft, Menu, Zap, Coffee, AlertCircle } from 'lucide-react';
import { CalendarEvent } from '../../types';
import * as eventApi from '../../services/eventApi';

// --- Types & Constants ---

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CALENDAR_COLORS = {
    apple: { bg: 'bg-blue-500', text: 'text-blue-50', border: 'border-blue-400', soft: 'bg-blue-500/15', hover: 'hover:bg-blue-500/25', ring: 'ring-blue-500/30' },
    google: { bg: 'bg-purple-500', text: 'text-purple-50', border: 'border-purple-400', soft: 'bg-purple-500/15', hover: 'hover:bg-purple-500/25', ring: 'ring-purple-500/30' },
    outlook: { bg: 'bg-emerald-500', text: 'text-emerald-50', border: 'border-emerald-400', soft: 'bg-emerald-500/15', hover: 'hover:bg-emerald-500/25', ring: 'ring-emerald-500/30' },
    default: { bg: 'bg-neutral-500', text: 'text-neutral-50', border: 'border-neutral-400', soft: 'bg-neutral-500/15', hover: 'hover:bg-neutral-500/25', ring: 'ring-neutral-500/30' },
};

const EVENT_TYPES = [
    { id: 'FOCUS', label: 'Focus', icon: Zap, color: 'text-blue-400' },
    { id: 'MEETING', label: 'Meeting', icon: Video, color: 'text-purple-400' },
    { id: 'PERSONAL', label: 'Personal', icon: Coffee, color: 'text-orange-400' },
    { id: 'DEADLINE', label: 'Deadline', icon: AlertCircle, color: 'text-red-400' },
];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; soft: string; hover: string; label: string }> = {
    FOCUS: { bg: 'bg-blue-500', text: 'text-blue-50', border: 'border-blue-400', soft: 'bg-blue-500/15', hover: 'hover:bg-blue-500/25', label: '#3b82f6' },
    MEETING: { bg: 'bg-purple-500', text: 'text-purple-50', border: 'border-purple-400', soft: 'bg-purple-500/15', hover: 'hover:bg-purple-500/25', label: '#a855f7' },
    PERSONAL: { bg: 'bg-orange-500', text: 'text-orange-50', border: 'border-orange-400', soft: 'bg-orange-500/15', hover: 'hover:bg-orange-500/25', label: '#f97316' },
    DEADLINE: { bg: 'bg-red-500', text: 'text-red-50', border: 'border-red-400', soft: 'bg-red-500/15', hover: 'hover:bg-red-500/25', label: '#ef4444' },
};

const getEventTheme = (evt: CalendarEvent) => {
    const evtType = evt.event_type || evt.type || 'FOCUS';
    return EVENT_TYPE_COLORS[evtType] || EVENT_TYPE_COLORS['FOCUS'];
};

interface ProcessedEvent extends CalendarEvent {
    visual: {
        left: number; // percentage
        width: number; // percentage
    };
}

// --- Layout Engine ---

const processOverlaps = (events: CalendarEvent[]): ProcessedEvent[] => {
    if (events.length === 0) return [];

    // 1. Sort by start time, then duration (desc)
    const sorted = [...events].sort((a, b) => {
        if (a.start.getTime() === b.start.getTime()) {
            return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime());
        }
        return a.start.getTime() - b.start.getTime();
    });

    const clusters: ProcessedEvent[][] = [];
    let currentCluster: ProcessedEvent[] = [];
    let clusterEnd = 0;

    sorted.forEach((evt) => {
        const evtStart = evt.start.getTime();
        const evtEnd = evt.end.getTime();
        const pEvt = { ...evt, visual: { left: 0, width: 100 } };

        if (currentCluster.length === 0) {
            currentCluster.push(pEvt);
            clusterEnd = evtEnd;
        } else {
            if (evtStart < clusterEnd) {
                currentCluster.push(pEvt);
                clusterEnd = Math.max(clusterEnd, evtEnd);
            } else {
                clusters.push(currentCluster);
                currentCluster = [pEvt];
                clusterEnd = evtEnd;
            }
        }
    });
    if (currentCluster.length > 0) clusters.push(currentCluster);

    const result: ProcessedEvent[] = [];

    clusters.forEach(cluster => {
        const columns: ProcessedEvent[][] = [];
        cluster.forEach(evt => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                const lastInCol = col[col.length - 1];
                if (lastInCol.end.getTime() <= evt.start.getTime()) {
                    col.push(evt);
                    placed = true;
                    break;
                }
            }
            if (!placed) columns.push([evt]);
        });

        const width = 100 / columns.length;
        columns.forEach((col, colIndex) => {
            col.forEach(evt => {
                evt.visual.left = colIndex * width;
                evt.visual.width = width;
                result.push(evt);
            });
        });
    });

    return result;
};

// --- Sub Components ---

const MiniCalendar = ({ currentDate, onSelectDate, calendars, events }: any) => {
    const [viewDate, setViewDate] = useState(new Date(currentDate));

    useEffect(() => { setViewDate(new Date(currentDate)); }, [currentDate]);

    const changeMonth = (delta: number) => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + delta);
        setViewDate(d);
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    const prevMonthLast = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) days.push({ d: prevMonthLast - i, type: 'prev' });
    for (let i = 1; i <= daysInMonth; i++) days.push({ d: i, type: 'curr' });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ d: i, type: 'next' });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-white tracking-wide">
                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 mb-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                        <div key={d} className="text-[10px] text-center text-neutral-500 font-bold">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                    {days.map((day, i) => {
                        const isSelected = day.type === 'curr' && day.d === currentDate.getDate() && viewDate.getMonth() === currentDate.getMonth();
                        const isToday = day.type === 'curr' && day.d === new Date().getDate() && viewDate.getMonth() === new Date().getMonth();

                        // Check if an actual event exists on this day
                        const hasEvent = day.type === 'curr' && events?.some((e: any) => e.start.getDate() === day.d && e.start.getMonth() === viewDate.getMonth() && e.start.getFullYear() === viewDate.getFullYear());

                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    if (day.type === 'curr') {
                                        const newDate = new Date(viewDate);
                                        newDate.setDate(day.d);
                                        onSelectDate(newDate);
                                    }
                                }}
                                className={`
                                    h-8 w-8 rounded-full flex flex-col items-center justify-center text-xs transition-all relative
                                    ${day.type !== 'curr' ? 'text-neutral-700' :
                                        isSelected ? 'bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-110 z-10' :
                                            isToday ? 'text-accent-blue font-bold bg-accent-blue/10 ring-1 ring-accent-blue/50' :
                                                'text-neutral-300 hover:bg-white/10'}
                                `}
                            >
                                <span>{day.d}</span>
                                {hasEvent && !isSelected && (
                                    <div className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? 'bg-accent-blue' : 'bg-neutral-500'}`} />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                <div>
                    <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 px-2">Calendars</h3>
                    <div className="space-y-1">
                        {calendars.map((cal: any) => (
                            <div key={cal.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all duration-300 ${cal.active ? cal.color : 'bg-transparent border border-neutral-600'} shadow-sm`}>
                                    {cal.active && <Check size={10} className="text-white stroke-[4]" />}
                                </div>
                                <span className={`text-sm font-medium ${cal.active ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`}>{cal.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/5 text-[10px] text-neutral-500 flex justify-between items-center bg-neutral-900/30">
                <span>Updated just now</span>
                <RefreshCw size={12} className="hover:animate-spin cursor-pointer text-neutral-400 hover:text-white" />
            </div>
        </div>
    );
};

// --- Create Event Modal ---

const EventFormModal = ({ isOpen, onClose, initialData, onSave }: any) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [eventType, setEventType] = useState<'FOCUS' | 'MEETING' | 'PERSONAL' | 'DEADLINE'>(initialData?.event_type || initialData?.type || 'FOCUS');
    const [startTime, setStartTime] = useState(initialData?.start || new Date());
    const [endTime, setEndTime] = useState(initialData?.end || new Date(new Date().setHours(new Date().getHours() + 1)));
    const [description, setDescription] = useState(initialData?.description || '');
    const [location, setLocation] = useState(initialData?.location || '');
    const [attendees, setAttendees] = useState<string[]>(initialData?.attendees || []);
    const [attendeeInput, setAttendeeInput] = useState('');
    const [calendar, setCalendar] = useState<'google' | 'icloud' | 'outlook'>(initialData?.calendar || 'google');
    const [category_id, setCategoryId] = useState(initialData?.category_id || null);

    if (!isOpen) return null;

    const handleAddAttendee = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && attendeeInput.trim()) {
            e.preventDefault();
            if (!attendees.includes(attendeeInput.trim())) {
                setAttendees([...attendees, attendeeInput.trim()]);
            }
            setAttendeeInput('');
        }
    };

    const handleRemoveAttendee = (name: string) => {
        setAttendees(attendees.filter(a => a !== name));
    };

    const formatDateDisplay = (d: Date) => {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    const formatTimeDisplay = (d: Date) => {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val) {
            const [y, m, d] = val.split('-').map(Number);
            const newStart = new Date(startTime);
            newStart.setFullYear(y, m - 1, d);
            const newEnd = new Date(endTime);
            newEnd.setFullYear(y, m - 1, d);
            setStartTime(newStart);
            setEndTime(newEnd);
        }
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [h, m] = e.target.value.split(':').map(Number);
        const newStart = new Date(startTime);
        newStart.setHours(h, m, 0, 0);
        setStartTime(newStart);
        // Auto-adjust end time if it's before start
        if (newStart >= endTime) {
            const newEnd = new Date(newStart);
            newEnd.setHours(newStart.getHours() + 1);
            setEndTime(newEnd);
        }
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [h, m] = e.target.value.split(':').map(Number);
        const newEnd = new Date(endTime);
        newEnd.setHours(h, m, 0, 0);
        setEndTime(newEnd);
    };

    const toDateInputValue = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const toTimeInputValue = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const handleSubmit = () => {
        onSave({
            id: initialData?.id,
            title,
            event_type: eventType,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_recurring: false,
            label_color: EVENT_TYPE_COLORS[eventType]?.label || '#3b82f6',
            category_id,
            description,
            location,
            attendees,
            calendar,
        });
    };

    const calendarOptions = [
        { id: 'google' as const, label: 'Google', color: 'bg-purple-500' },
        { id: 'icloud' as const, label: 'iCloud', color: 'bg-blue-500' },
        { id: 'outlook' as const, label: 'Outlook', color: 'bg-emerald-500' },
    ];

    const dateDisplayStr = `${startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-[#1e1e22] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 z-[80] flex flex-col max-h-[90vh]"
            >
                {/* Top accent gradient */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="p-6 pb-2">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Plus size={14} className="text-indigo-400" />
                                </div>
                                <h3 className="text-base font-bold text-white">{initialData?.id ? 'Update Event' : 'Create Event'}</h3>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                                <X size={18} className="text-neutral-400" />
                            </button>
                        </div>

                        {/* Title */}
                        <input
                            type="text"
                            placeholder="Event title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent text-xl font-semibold text-white placeholder:text-neutral-600 focus:outline-none border-b border-white/10 pb-3 mb-5 transition-colors focus:border-indigo-500/50"
                            autoFocus
                        />

                        <div className="space-y-4">
                            {/* Date */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Date</label>
                                    <div className="relative">
                                        <div className="bg-neutral-900/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:border-white/15 transition-colors">
                                            {formatDateDisplay(startTime)}
                                        </div>
                                        <input
                                            type="date"
                                            value={toDateInputValue(startTime)}
                                            onChange={handleDateChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Start / End Time */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 shrink-0" /> {/* spacer for icon alignment */}
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Start</label>
                                        <div className="relative">
                                            <div className="bg-neutral-900/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:border-white/15 transition-colors">
                                                {formatTimeDisplay(startTime)}
                                            </div>
                                            <input
                                                type="time"
                                                value={toTimeInputValue(startTime)}
                                                onChange={handleStartTimeChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-neutral-600 mt-5 px-1">→</div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">End</label>
                                        <div className="relative">
                                            <div className="bg-neutral-900/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:border-white/15 transition-colors">
                                                {formatTimeDisplay(endTime)}
                                            </div>
                                            <input
                                                type="time"
                                                value={toTimeInputValue(endTime)}
                                                onChange={handleEndTimeChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Type */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <CalIcon size={14} className="text-neutral-500" />
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Event Type</label>
                                </div>
                                <div className="flex gap-2">
                                    {EVENT_TYPES.map(et => {
                                        const isActive = eventType === et.id;
                                        const Icon = et.icon;
                                        return (
                                            <button
                                                key={et.id}
                                                onClick={() => setEventType(et.id as any)}
                                                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all duration-200 text-xs font-medium ${isActive
                                                    ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                                    : 'bg-white/[0.03] border-white/5 text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300'
                                                    }`}
                                            >
                                                <Icon size={16} className={isActive ? et.color : 'text-neutral-500'} />
                                                <span>{et.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 shrink-0 mt-0.5">
                                    <AlignLeft size={18} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Description</label>
                                    <textarea
                                        placeholder="Add event details..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-neutral-900/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/30 resize-none h-16 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Location</label>
                                    <input
                                        type="text"
                                        placeholder="Add location or link..."
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full bg-neutral-900/60 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/30 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Attendees */}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 shrink-0 mt-0.5">
                                    <Users size={18} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Attendees</label>
                                    <div className="bg-neutral-900/60 border border-white/5 rounded-lg px-3 py-2 transition-colors focus-within:border-indigo-500/30">
                                        {attendees.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {attendees.map((name, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-300 text-xs px-2 py-0.5 rounded-full border border-indigo-500/20"
                                                    >
                                                        {name}
                                                        <button
                                                            onClick={() => handleRemoveAttendee(name)}
                                                            className="hover:text-white transition-colors"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="Type a name and press Enter..."
                                            value={attendeeInput}
                                            onChange={(e) => setAttendeeInput(e.target.value)}
                                            onKeyDown={handleAddAttendee}
                                            className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Calendar */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 shrink-0">
                                    <Settings size={18} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Calendar</label>
                                    <div className="flex gap-2">
                                        {calendarOptions.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setCalendar(opt.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 ${calendar === opt.id
                                                    ? 'bg-white/10 border-white/20 text-white'
                                                    : 'bg-transparent border-white/5 text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 flex justify-between items-center bg-[#1a1a1e] shrink-0">
                    <span className="text-[10px] text-neutral-600">{dateDisplayStr}</span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!title.trim()}
                            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/30 hover:bg-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <Plus size={14} />
                            {initialData?.id ? 'Update Event' : 'Save Event'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// --- Main Component ---

interface CalendarViewProps {
    actualTimeline?: any[];
    simulatedNow?: Date;
}

const CalendarView: React.FC<CalendarViewProps> = ({ actualTimeline = [], simulatedNow }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week'>('week');
    const [slideDirection, setSlideDirection] = useState(0);
    const [now, setNow] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, event: CalendarEvent } | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // Creation Modal State
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [createDraft, setCreateDraft] = useState<{ start: Date, end: Date } | null>(null);
    const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

    // API Data State
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Responsive sidebar handling
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch Events
    const getDaysInRange = (viewType: 'month' | 'week', date: Date) => {
        if (viewType === 'week') {
            const start = new Date(date);
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            const days = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                days.push(d);
            }
            return { start: days[0], end: days[6] };
        } else {
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            return { start, end };
        }
    };

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const { start, end } = getDaysInRange(view, currentDate);
            // Fetch for a slightly wider range to be safe
            const rangeStart = new Date(start);
            rangeStart.setDate(rangeStart.getDate() - 7);
            const rangeEnd = new Date(end);
            rangeEnd.setDate(rangeEnd.getDate() + 7);

            const fetched = await eventApi.fetchEvents(rangeStart, rangeEnd);
            setEvents(fetched);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [currentDate, view]);

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ day: Date, min: number } | null>(null);
    const [dragCurrent, setDragCurrent] = useState<number | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    const [calendars, setCalendars] = useState([
        { id: 'apple', name: 'iCloud', color: 'bg-blue-500', active: true },
        { id: 'google', name: 'Google (Work)', color: 'bg-purple-500', active: true },
        { id: 'outlook', name: 'Outlook (Family)', color: 'bg-emerald-500', active: true },
    ]);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        // Initial scroll
        if (view === 'week' && scrollRef.current) scrollRef.current.scrollTop = 540; // 9 AM
        return () => clearInterval(interval);
    }, [view]);

    // Helper to ensure mutual exclusivity of popups
    const closeAllPopups = () => {
        setSelectedEvent(null);
        setContextMenu(null);
        setCreateModalOpen(false);
        setEditEvent(null);
    };

    // Use simulatedNow if provided, otherwise real now
    const effectiveNow = simulatedNow || now;

    const navigate = (dir: number) => {
        setSlideDirection(dir);
        const d = new Date(currentDate);
        if (view === 'month') d.setMonth(d.getMonth() + dir);
        else d.setDate(d.getDate() + (dir * 7));
        setCurrentDate(d);
    };

    const today = () => {
        setSlideDirection(new Date() > currentDate ? 1 : -1);
        setCurrentDate(new Date());
    };

    const openCreateModal = (start?: Date, end?: Date) => {
        closeAllPopups(); // Clean slate

        let s = start || new Date();
        let e = end || new Date();

        if (!start) {
            // Default to next hour top of hour
            s.setMinutes(0, 0, 0);
            s.setHours(s.getHours() + 1);
            e = new Date(s);
            e.setHours(s.getHours() + 1);
        }

        setCreateDraft({ start: s, end: e });
        setCreateModalOpen(true);
    };

    const handleEventClick = (evt: CalendarEvent) => {
        closeAllPopups();
        setSelectedEvent(evt);
    };

    const handleContextMenu = (e: React.MouseEvent, evt: CalendarEvent) => {
        e.preventDefault();
        e.stopPropagation();
        closeAllPopups();
        setContextMenu({ x: e.clientX, y: e.clientY, event: evt });
    };

    // --- Data Provider ---
    const getEventsForRange = (days: Date[]): CalendarEvent[] => {
        const dayStrings = days.map(d => d.toDateString());
        return events.filter(evt => dayStrings.includes(evt.start.toDateString()));
    };

    const handleDeleteEvent = async (id: string) => {
        try {
            await eventApi.deleteEvent(id);
            setEvents(prev => prev.filter(e => e.id !== id));
            closeAllPopups();
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    const handleCreateOrUpdate = async (data: any) => {
        try {
            if (data.id) {
                const updated = await eventApi.updateEvent(data.id, data);
                setEvents(prev => prev.map(e => e.id === data.id ? updated : e));
            } else {
                const created = await eventApi.createEvent(data);
                setEvents(prev => [...prev, created]);
            }
            closeAllPopups();
        } catch (error) {
            console.error('Failed to save event:', error);
        }
    };

    // --- Handlers ---
    const handleGridMouseDown = (e: React.MouseEvent, day: Date) => {
        if (e.button !== 0) return;
        closeAllPopups(); // Close existing menus when starting a drag
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = (e.clientY - rect.top);
        const minutes = Math.floor(relativeY);
        const snappedMin = Math.floor(minutes / 15) * 15;
        setIsDragging(true);
        setDragStart({ day, min: snappedMin });
        setDragCurrent(snappedMin + 60);
    };

    const handleGridMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = (e.clientY - rect.top);
        const minutes = Math.floor(relativeY);
        const snappedMin = Math.floor(minutes / 15) * 15;
        if (snappedMin > dragStart.min) setDragCurrent(snappedMin);
    };

    const handleGridMouseUp = () => {
        if (isDragging && dragStart && dragCurrent) {
            const start = new Date(dragStart.day);
            start.setHours(Math.floor(dragStart.min / 60), dragStart.min % 60);
            const end = new Date(dragStart.day);
            end.setHours(Math.floor(dragCurrent / 60), dragCurrent % 60);

            openCreateModal(start, end);
        }
        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
    };

    return (
        <div className="flex h-full relative overflow-hidden bg-black text-white" onMouseUp={handleGridMouseUp}>

            {/* Desktop Sidebar (Collapsible) */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 288, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="hidden lg:flex flex-col border-r border-titanium-border bg-titanium-dark z-20 h-full shrink-0 overflow-hidden"
                    >
                        <div className="w-72 h-full flex flex-col">
                            <div className="p-6 pb-2">
                                <button
                                    onClick={() => openCreateModal()}
                                    className="w-full py-3 bg-white hover:bg-neutral-200 text-black rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 transform active:scale-95"
                                >
                                    <Plus size={18} /> <span>Create Event</span>
                                </button>
                            </div>
                            <MiniCalendar
                                currentDate={currentDate}
                                onSelectDate={setCurrentDate}
                                calendars={calendars}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/60 z-[40] backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="lg:hidden fixed inset-y-0 left-0 w-80 bg-titanium-surface border-r border-white/10 z-[50] flex flex-col shadow-2xl"
                        >
                            <div className="flex justify-end p-4">
                                <button onClick={() => setSidebarOpen(false)} className="p-2 text-neutral-400 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="px-4 pb-4">
                                <button
                                    onClick={() => { setSidebarOpen(false); openCreateModal(); }}
                                    className="w-full py-3 bg-white text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Create Event
                                </button>
                            </div>
                            <MiniCalendar
                                currentDate={currentDate}
                                onSelectDate={(d: Date) => { setCurrentDate(d); setSidebarOpen(false); setView('week'); }}
                                calendars={calendars}
                                events={events}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main View */}
            <div className="flex-1 flex flex-col h-full bg-[#1C1C1E] relative overflow-hidden min-w-0">
                {/* Toolbar */}
                <header className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 border-b border-black/20 bg-titanium-surface/80 backdrop-blur-xl z-30 gap-3 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                        >
                            <PanelLeft size={18} />
                        </button>

                        <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 truncate">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={currentDate.toDateString()}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="truncate"
                                    >
                                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </motion.span>
                                </AnimatePresence>
                            </h2>
                        </div>

                        <div className="flex items-center bg-neutral-800/50 rounded-lg p-0.5 border border-white/5 shadow-sm ml-auto sm:ml-0">
                            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                            <button onClick={today} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors border-x border-white/5 mx-0.5">Today</button>
                            <button onClick={() => navigate(1)} className="p-1.5 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <div className="flex items-center bg-neutral-800/50 rounded-lg p-0.5 border border-white/5">
                            <button onClick={() => setView('week')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'week' ? 'bg-neutral-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}>Week</button>
                            <button onClick={() => setView('month')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'month' ? 'bg-neutral-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}>Month</button>
                        </div>
                        <button className="hidden sm:block p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"><Search size={18} /></button>
                        <button className="hidden sm:block p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"><Filter size={18} /></button>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-hidden relative" onContextMenu={(e) => e.preventDefault()}>
                    <AnimatePresence mode="popLayout" custom={slideDirection}>
                        <motion.div
                            key={`${view}-${currentDate.toDateString()}`}
                            custom={slideDirection}
                            variants={{
                                enter: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
                                center: { x: 0, opacity: 1 },
                                exit: (dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0 })
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full h-full flex flex-col"
                        >
                            {view === 'week' ? (
                                <WeekView
                                    date={currentDate}
                                    now={effectiveNow}
                                    scrollRef={scrollRef}
                                    getEvents={getEventsForRange}
                                    actualTimeline={actualTimeline}
                                    onGridMouseDown={handleGridMouseDown}
                                    onGridMouseMove={handleGridMouseMove}
                                    onEventClick={handleEventClick}
                                    onEventContextMenu={handleContextMenu}
                                    dragDraft={isDragging && dragStart && dragCurrent ? { day: dragStart.day, start: dragStart.min, end: dragCurrent } : null}
                                />
                            ) : (
                                <MonthView
                                    date={currentDate}
                                    getEvents={getEventsForRange}
                                    onEventClick={handleEventClick}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Mobile FAB */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openCreateModal()}
                    className="lg:hidden absolute bottom-6 right-6 w-14 h-14 bg-white rounded-full text-black shadow-xl flex items-center justify-center z-[40]"
                >
                    <Plus size={28} />
                </motion.button>

                {/* Overlays */}
                <AnimatePresence>
                    {selectedEvent && (
                        <EventDetailsModal
                            event={selectedEvent}
                            onClose={() => setSelectedEvent(null)}
                            onEdit={(evt: CalendarEvent) => {
                                setSelectedEvent(null);
                                setEditEvent(evt);
                            }}
                            onDelete={handleDeleteEvent}
                        />
                    )}
                    {contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            event={contextMenu.event}
                            onClose={() => setContextMenu(null)}
                            onEdit={(evt: CalendarEvent) => {
                                setContextMenu(null);
                                setEditEvent(evt);
                            }}
                            onDelete={handleDeleteEvent}
                        />
                    )}
                    {isCreateModalOpen && (
                        <EventFormModal
                            isOpen={isCreateModalOpen}
                            onClose={() => setCreateModalOpen(false)}
                            initialData={createDraft}
                            onSave={handleCreateOrUpdate}
                        />
                    )}
                    {editEvent && (
                        <EventFormModal
                            isOpen={!!editEvent}
                            onClose={() => setEditEvent(null)}
                            initialData={editEvent}
                            onSave={handleCreateOrUpdate}
                        />
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

// --- Week View ---

const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const WeekView = ({ date, now, scrollRef, getEvents, actualTimeline, onGridMouseDown, onGridMouseMove, onEventClick, onEventContextMenu, dragDraft }: any) => {
    // ... [WeekView implementation remains unchanged]
    const getWeekDays = (d: Date) => {
        const start = new Date(d);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        return Array.from({ length: 7 }, (_, i) => {
            const dt = new Date(start);
            dt.setDate(start.getDate() + i);
            return dt;
        });
    };
    const days = useMemo(() => getWeekDays(date), [date]);

    return (
        <div className="flex flex-col h-full bg-[#1C1C1E]">
            {/* Header */}
            {/* Scrollable Container for Header to match grid below on Mobile */}
            <div className="overflow-x-auto no-scrollbar border-b border-white/5 bg-titanium-surface z-20 shadow-sm sticky top-0">
                <div className="flex min-w-[700px] lg:min-w-full pl-12 sm:pl-16">
                    {days.map((day: Date, i: number) => {
                        const isToday = day.toDateString() === now.toDateString();
                        return (
                            <div key={i} className={`flex-1 py-3 text-center border-l border-white/5 ${isToday ? 'bg-white/[0.02]' : ''} min-w-[80px]`}>
                                <div className={`text-[9px] sm:text-[10px] uppercase font-bold mb-1 ${isToday ? 'text-accent-blue' : 'text-neutral-500'}`}>
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className={`
                                    w-6 h-6 sm:w-8 sm:h-8 mx-auto flex items-center justify-center rounded-full text-sm sm:text-lg font-medium transition-colors
                                    ${isToday ? 'bg-accent-blue text-white shadow-[0_0_15px_rgba(47,88,205,0.4)]' : 'text-white'}
                                `}>
                                    {day.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scroll Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto relative no-scrollbar bg-[#1C1C1E] select-none">
                <div className="flex relative h-[1440px] min-w-[700px] lg:min-w-full">
                    {/* Time Gutter */}
                    <div className="w-12 sm:w-16 flex-shrink-0 border-r border-white/5 bg-titanium-surface text-right pr-2 sm:pr-3 pt-2 select-none sticky left-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
                        {HOURS.map(h => (
                            <div key={h} className="h-[60px] text-[9px] sm:text-[10px] text-neutral-500 relative -top-2.5 font-medium">
                                {h === 0 ? '' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 flex relative">
                        {/* Grid Lines */}
                        {HOURS.map(h => (
                            <div key={h} className="absolute w-full border-t border-white/5 pointer-events-none" style={{ top: h * 60 }} />
                        ))}

                        {/* Current Time Indicator */}
                        {days.some((d: Date) => d.toDateString() === now.toDateString()) && (
                            <div
                                className="absolute w-full border-t border-red-500 z-20 pointer-events-none opacity-80"
                                style={{ top: now.getHours() * 60 + now.getMinutes() }}
                            >
                                <div className="absolute -left-[5px] -top-[4px] w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                <div className="absolute -left-14 sm:-left-[58px] -top-2.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        )}

                        {/* Day Columns */}
                        {days.map((day: Date, dayIndex: number) => {
                            const dayEvents = getEvents([day]);
                            const processedEvents = processOverlaps(dayEvents);
                            const isDraftDay = dragDraft && dragDraft.day.toDateString() === day.toDateString();

                            return (
                                <div
                                    key={dayIndex}
                                    className="flex-1 relative border-l border-white/5 h-full group/col min-w-[80px]"
                                    onMouseDown={(e) => onGridMouseDown(e, day)}
                                    onMouseMove={onGridMouseMove}
                                >
                                    <div className="absolute inset-0 hover:bg-white/[0.015] pointer-events-none transition-colors duration-200" />

                                    {processedEvents.map((evt: ProcessedEvent) => {
                                        const startMin = evt.start.getHours() * 60 + evt.start.getMinutes();
                                        const duration = (evt.end.getTime() - evt.start.getTime()) / 60000;
                                        const theme = getEventTheme(evt);
                                        const evtType = evt.event_type || evt.type || 'FOCUS';
                                        const TypeIcon = evtType === 'MEETING' ? Video : evtType === 'FOCUS' ? Zap : evtType === 'PERSONAL' ? Coffee : evtType === 'DEADLINE' ? AlertCircle : CalIcon;

                                        return (
                                            <motion.div
                                                key={evt.id}
                                                layoutId={evt.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`absolute rounded-lg px-1 sm:px-2 py-1 border-l-[3px] overflow-hidden cursor-pointer transition-all z-10 hover:z-30 shadow-sm backdrop-blur-sm ${theme.soft} ${theme.border} ${theme.text} ${theme.hover} group/event`}
                                                style={{
                                                    top: startMin + 1,
                                                    height: duration - 2,
                                                    left: `${evt.visual.left}%`,
                                                    width: `${evt.visual.width}%`,
                                                }}
                                                onMouseDown={(e) => { e.stopPropagation(); }} // Prevent grid drag trigger
                                                onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                                                onContextMenu={(e) => onEventContextMenu(e, evt)}
                                            >
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    {duration > 40 && <TypeIcon size={12} className="opacity-70 shrink-0" />}
                                                    <div className="font-semibold text-[10px] sm:text-[11px] leading-tight truncate">{evt.title}</div>
                                                </div>
                                                {duration > 30 && (
                                                    <div className="opacity-75 text-[9px] sm:text-[10px] mt-0.5 truncate flex items-center gap-1">
                                                        {evt.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}

                                    {isDraftDay && (
                                        <div
                                            className="absolute bg-blue-500/20 border-2 border-dashed border-blue-500/60 rounded-lg z-30 pointer-events-none backdrop-blur-sm"
                                            style={{
                                                top: Math.min(dragDraft.start, dragDraft.end),
                                                height: Math.abs(dragDraft.end - dragDraft.start),
                                                left: 4, right: 4
                                            }}
                                        >
                                            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                                                <span>{Math.floor(Math.abs(dragDraft.end - dragDraft.start))} min</span>
                                                <span className="opacity-70">| New Event</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actual Activity Indicator (on the very left of the column) */}
                                    {day.toDateString() === now.toDateString() && actualTimeline?.map((seg: any) => (
                                        <div
                                            key={seg.id}
                                            className={`absolute left-0 w-1.5 z-40 rounded-r-md transition-all duration-500 ${seg.type === 'FOCUS' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                                                seg.type === 'BREAK' ? 'bg-emerald-500' :
                                                    seg.type === 'MEETING' ? 'bg-purple-500' :
                                                        seg.type === 'DISTRACTED' ? 'bg-orange-500' : 'bg-neutral-600'
                                                }`}
                                            style={{
                                                top: seg.start,
                                                height: Math.max(2, seg.end - seg.start),
                                                opacity: 0.8
                                            }}
                                            title={`${seg.type.charAt(0) + seg.type.slice(1).toLowerCase()}: ${formatTime(seg.start)} - ${formatTime(seg.end)}`}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Month View ---

const MonthView = ({ date, getEvents, onEventClick }: any) => {
    // ... [MonthView implementation remains unchanged]
    const days = useMemo(() => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const result = [];

        const prevMonthLast = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            result.push({ date: prevMonthLast - i, type: 'prev', fullDate: new Date(year, month - 1, prevMonthLast - i) });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            result.push({ date: i, type: 'curr', fullDate: new Date(year, month, i) });
        }
        const remaining = 42 - result.length;
        for (let i = 1; i <= remaining; i++) {
            result.push({ date: i, type: 'next', fullDate: new Date(year, month + 1, i) });
        }
        return result;
    }, [date]);

    return (
        <div className="flex flex-col h-full bg-[#1C1C1E]">
            <div className="grid grid-cols-7 border-b border-white/5 bg-titanium-surface">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="py-2 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500">{d}</div>
                ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {days.map((d: any, i: number) => {
                    const events = getEvents([d.fullDate]);
                    const isToday = d.fullDate.toDateString() === new Date().toDateString();

                    return (
                        <div key={i} className={`border-b border-r border-white/5 p-1 min-h-[60px] flex flex-col gap-1 hover:bg-white/[0.02] transition-colors ${d.type !== 'curr' ? 'bg-neutral-900/20' : ''}`}>
                            <div className="flex justify-center mb-1">
                                <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-medium ${isToday ? 'bg-red-500 text-white shadow-md' : d.type === 'curr' ? 'text-white' : 'text-neutral-600'}`}>
                                    {d.date}
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                {events.slice(0, 4).map((evt: CalendarEvent) => {
                                    const theme = getEventTheme(evt);
                                    return (
                                        <div
                                            key={evt.id}
                                            onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                                            className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded truncate border-l-2 cursor-pointer ${theme.soft} ${theme.text} ${theme.border} hover:brightness-110`}
                                        >
                                            {evt.title}
                                        </div>
                                    );
                                })}
                                {events.length > 4 && (
                                    <span className="text-[9px] text-neutral-500 pl-1 font-medium">+{events.length - 4} more</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Modals ---

const EventDetailsModal = ({ event, onClose, onEdit, onDelete }: any) => {
    const eventTypeInfo = EVENT_TYPES.find(et => et.id === (event.event_type || event.type)) || EVENT_TYPES[0];
    const EventTypeIcon = eventTypeInfo.icon;

    const calendarLabel: Record<string, string> = { google: 'Google Calendar', icloud: 'iCloud Calendar', outlook: 'Outlook Calendar' };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm bg-titanium-surface/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-[80] overflow-hidden ring-1 ring-white/10"
            >
                <div className={`h-2 w-full bg-gradient-to-r ${event.platform === 'google' ? 'from-purple-500 to-purple-400' : event.platform === 'apple' ? 'from-blue-500 to-blue-400' : 'from-emerald-500 to-emerald-400'}`} />
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{event.title}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${eventTypeInfo.color}`}>
                                    <EventTypeIcon size={10} />
                                    {eventTypeInfo.label}
                                </span>
                                {event.calendar && (
                                    <span className="text-[10px] text-neutral-500">{calendarLabel[event.calendar] || 'Calendar'}</span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                        {/* Date & Time */}
                        <div className="flex items-center gap-4 text-sm text-neutral-300">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400"><Clock size={16} /></div>
                            <div>
                                <span className="block font-medium text-white">
                                    {event.start.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-neutral-500">
                                    {event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="flex items-start gap-4 text-sm text-neutral-300">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 shrink-0 mt-0.5"><AlignLeft size={16} /></div>
                                <p className="text-sm text-neutral-300 leading-relaxed">{event.description}</p>
                            </div>
                        )}

                        {/* Location */}
                        {event.location && (
                            <div className="flex items-center gap-4 text-sm text-neutral-300">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400"><MapPin size={16} /></div>
                                <span className="font-medium text-white">{event.location}</span>
                            </div>
                        )}

                        {/* Attendees */}
                        {event.attendees && event.attendees.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Users size={14} className="text-neutral-500" />
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Attendees ({event.attendees.length})</span>
                                </div>
                                <div className="flex -space-x-2 pl-2">
                                    {event.attendees.map((a: string, i: number) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-neutral-700 border-2 border-titanium-surface flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-transparent hover:ring-white/20 hover:z-10 transition-all relative" title={a}>
                                            {a[0]?.toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex gap-3 pt-6 border-t border-white/5">
                        <button
                            onClick={() => onEdit(event)}
                            className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5"
                        >
                            Edit Event
                        </button>
                        <button
                            onClick={() => onDelete(event.id)}
                            className="p-2.5 rounded-xl bg-neutral-800 border border-white/5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const ContextMenu = ({ x, y, event, onClose, onEdit, onDelete }: any) => (
    <>
        <div className="fixed inset-0 z-[80]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed z-[90] w-52 bg-titanium-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5 flex flex-col ring-1 ring-black/50"
            style={{ top: Math.min(y, window.innerHeight - 200), left: Math.min(x, window.innerWidth - 200) }}
        >
            <div className="px-3 py-2 border-b border-white/5 mb-1">
                <span className="text-xs font-bold text-white block truncate">{event.title}</span>
            </div>
            <button
                onClick={() => onEdit(event)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
            >
                <Edit2 size={14} /> Edit Event
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left">
                <Copy size={14} /> Duplicate
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button
                onClick={() => onDelete(event.id)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
            >
                <Trash2 size={14} /> Delete
            </button>
        </motion.div>
    </>
);

export default CalendarView;
