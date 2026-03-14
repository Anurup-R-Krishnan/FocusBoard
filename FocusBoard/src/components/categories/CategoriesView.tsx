
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Code, PenTool, MessageCircle, BookOpen, Coffee, Plus, Edit2,
    X, Briefcase, Tag, PieChart, Grid, Trash2,
    TrendingUp, Clock, Layers, Target,
    Flame, Zap, Loader2, AlertCircle
} from 'lucide-react';

import {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    type Category,
} from '../../services/categoryApi';
import {
    createActivity,
    fetchActivities,
    updateActivity,
    deleteActivity,
    type BackendActivity,
} from '../../services/activityApi';
import {
    createMapping,
    getAllMappings,
    updateMapping,
    deleteMapping,
    type ActivityMapping,
} from '../../services/activityMappingApi';

// Map string icon names to components
const ICON_MAP: Record<string, any> = {
    'Code': Code,
    'PenTool': PenTool,
    'MessageCircle': MessageCircle,
    'BookOpen': BookOpen,
    'Coffee': Coffee,
    'Briefcase': Briefcase,
    'Tag': Tag,
    'Layers': Layers,
};

const COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
    'bg-rose-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-neutral-500'
];

const toLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value: string) => {
    if (!value) return '';
    return new Date(value).toISOString();
};

// --- Confirmation Dialog ---
const ConfirmDialog = ({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) => (
    <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onCancel} />
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        >
            <div className="bg-titanium-surface border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full">
                <div className="flex items-start gap-3 mb-6">
                    <AlertCircle size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-white font-medium">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold border border-white/10 hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-colors">OK</button>
                </div>
            </div>
        </motion.div>
    </>
);

// --- Category Detail Drawer ---
const CategoryDrawer = ({ category, stats, onClose, onUpdate, onDelete }: {
    category: Category;
    stats?: { totalActivities: number; totalMinutes: number };
    onClose: () => void;
    onUpdate: (id: string, data: Partial<Category>) => void;
    onDelete: (id: string) => void;
}) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SETTINGS'>('OVERVIEW');
    const [name, setName] = useState(category.name);
    const [description, setDescription] = useState(category.description || '');
    const [color, setColor] = useState(category.color || 'bg-blue-500');
    const [icon, setIcon] = useState(category.icon || 'Tag');
    const [productivityScore, setProductivityScore] = useState(category.productivityScore ?? 0);
    const [isDefault, setIsDefault] = useState(Boolean(category.isDefault));
    const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);

    const Icon = ICON_MAP[icon] || Tag;

    const handleSave = () => {
        setConfirmAction({
            message: 'Are you sure you want to save these changes?',
            action: () => {
                onUpdate(category._id, { name, description, color, icon, productivityScore, isDefault } as any);
                onClose();
            }
        });
    };

    const handleDelete = () => {
        setConfirmAction({
            message: 'Are you sure you want to permanently delete this category?',
            action: () => {
                onDelete(category._id);
                onClose();
            }
        });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-2 right-2 w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl shadow-2xl z-[90] overflow-hidden flex flex-col"
            >
                {/* Drawer Header */}
                <div className="relative h-48 shrink-0">
                    <div className={`absolute inset-0 ${color} opacity-20`} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121212]" />

                    <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => setActiveTab(activeTab === 'OVERVIEW' ? 'SETTINGS' : 'OVERVIEW')} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors">
                            {activeTab === 'OVERVIEW' ? <Edit2 size={16} /> : <PieChart size={16} />}
                        </button>
                        <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="absolute bottom-6 left-6 flex items-end gap-4">
                        <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white shadow-xl shadow-black/50`}>
                            <Icon size={32} />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Category Drawer</div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">{category.name}</h2>
                            <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium mt-1">
                                <span className="bg-white/10 px-2 py-0.5 rounded text-white">Score: {category.productivityScore}</span>
                                {category.isDefault && <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-400">Default</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {activeTab === 'OVERVIEW' ? (
                        <>
                            {/* Info Card */}
                            <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target size={16} className="text-accent-blue" />
                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Productivity Score</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-white">{category.productivityScore}</span>
                                            <span className="text-sm text-neutral-500 font-medium">/ 5</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden relative z-10">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(0, ((category.productivityScore + 5) / 10) * 100)}%` }}
                                        className={`h-full ${color}`}
                                    />
                                </div>
                                <div className={`absolute -right-10 -top-10 w-40 h-40 ${color} blur-[60px] opacity-10 pointer-events-none`} />
                            </div>

                            {/* Insights Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2 text-orange-400">
                                        <Flame size={16} />
                                        <span className="text-[10px] font-bold uppercase">Icon</span>
                                    </div>
                                    <div className="text-lg font-bold text-white">{category.icon}</div>
                                </div>
                                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2 text-yellow-400">
                                        <Zap size={16} />
                                        <span className="text-[10px] font-bold uppercase">Status</span>
                                    </div>
                                    <div className="text-lg font-bold text-white">{category.isDefault ? 'Default' : 'Custom'}</div>
                                </div>
                                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2 text-accent-blue">
                                        <Layers size={16} />
                                        <span className="text-[10px] font-bold uppercase">Activities</span>
                                    </div>
                                    <div className="text-lg font-bold text-white">{stats?.totalActivities ?? 0}</div>
                                </div>
                                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                        <Clock size={16} />
                                        <span className="text-[10px] font-bold uppercase">Time Logged</span>
                                    </div>
                                    <div className="text-lg font-bold text-white">{Math.round((stats?.totalMinutes ?? 0) / 60 * 10) / 10}h</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-white mb-2">Description</h3>
                                <p className="text-sm text-neutral-400">{category.description || 'No description yet.'}</p>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors text-sm font-medium" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Description</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                                    className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors text-sm font-medium resize-none" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Productivity Score ({productivityScore})</label>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-neutral-500">-5</span>
                                    <input type="range" min="-5" max="5" step="1" value={productivityScore}
                                        onChange={(e) => setProductivityScore(Number(e.target.value))}
                                        className="flex-1 accent-accent-blue h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer" />
                                    <span className="text-xs text-neutral-500">+5</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map(c => (
                                        <button key={c} onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full ${c} transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1C1C1E] scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Icon</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {Object.keys(ICON_MAP).map(iconKey => {
                                        const I = ICON_MAP[iconKey];
                                        const isSelected = icon === iconKey;
                                        return (
                                            <button key={iconKey} onClick={() => setIcon(iconKey)}
                                                className={`aspect-square rounded-xl flex items-center justify-center transition-all
                                                    ${isSelected ? 'bg-white text-black shadow-lg scale-105' : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'}`}>
                                                <I size={18} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-3">Default Category</label>
                                <button onClick={() => setIsDefault(!isDefault)}
                                    className={`w-full py-3 rounded-xl font-bold transition-colors ${isDefault ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400 border border-white/10 hover:bg-neutral-700'}`}>
                                    {isDefault ? 'Yes — System Default' : 'No — Custom Category'}
                                </button>
                            </div>

                            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
                                <button onClick={handleSave}
                                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors">
                                    Save Changes
                                </button>
                                <button onClick={handleDelete}
                                    className="w-full py-3 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                                    <Trash2 size={16} /> Delete Category
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {confirmAction && (
                    <ConfirmDialog
                        message={confirmAction.message}
                        onConfirm={() => { confirmAction.action(); setConfirmAction(null); }}
                        onCancel={() => setConfirmAction(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// --- Main View ---
const CategoriesView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'ACTIVITIES' | 'MAPPINGS'>('CATEGORIES');
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'GRID' | 'ANALYTICS'>('GRID');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newCatForm, setNewCatForm] = useState({ name: '', color: 'bg-blue-500', description: '', icon: 'Tag', productivityScore: 0, isDefault: false });
    const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);
    const [searchId, setSearchId] = useState('');

    // Activities
    const [activities, setActivities] = useState<BackendActivity[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);
    const [activitySearch, setActivitySearch] = useState('');
    const [activityForm, setActivityForm] = useState({
        app_name: '',
        window_title: '',
        url: '',
        start_time: '',
        end_time: '',
        category_id: '',
        user_id: '',
        idle: false,
    });
    const [activityEditingId, setActivityEditingId] = useState<string | null>(null);
    const [activityCreating, setActivityCreating] = useState(false);

    // Mappings
    const [mappings, setMappings] = useState<ActivityMapping[]>([]);
    const [mappingsLoading, setMappingsLoading] = useState(false);
    const [mappingsError, setMappingsError] = useState<string | null>(null);
    const [mappingSearch, setMappingSearch] = useState('');
    const [mappingForm, setMappingForm] = useState({
        activityId: '',
        categoryId: '',
        isManualOverride: false,
        overrideReason: '',
        confidenceScore: 100,
    });
    const [mappingEditingId, setMappingEditingId] = useState<string | null>(null);
    const [mappingCreating, setMappingCreating] = useState(false);

    // Fetch categories from backend
    const fetchCategories = useCallback(async () => {
        try {
            setCategoriesLoading(true);
            const result = await getAllCategories(1, 200);
            setCategories(result.data);
            setCategoriesError(null);
        } catch (err: any) {
            setCategoriesError(err.message || 'Failed to fetch categories.');
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    const fetchAllActivities = useCallback(async () => {
        try {
            setActivitiesLoading(true);
            const result = await fetchActivities(undefined, undefined, 1, 200);
            setActivities(result.data);
            setActivitiesError(null);
        } catch (err: any) {
            setActivitiesError(err.message || 'Failed to fetch activities.');
        } finally {
            setActivitiesLoading(false);
        }
    }, []);

    const fetchAllMappings = useCallback(async () => {
        try {
            setMappingsLoading(true);
            const result = await getAllMappings(1, 200);
            setMappings(result.data);
            setMappingsError(null);
        } catch (err: any) {
            setMappingsError(err.message || 'Failed to fetch mappings.');
        } finally {
            setMappingsLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    useEffect(() => {
        if (activeTab === 'ACTIVITIES' && activities.length === 0 && !activitiesLoading) {
            fetchAllActivities();
        }
        if (activeTab === 'MAPPINGS' && mappings.length === 0 && !mappingsLoading) {
            fetchAllMappings();
        }
        if (activeTab === 'CATEGORIES' && selectedCategory && activities.length === 0 && !activitiesLoading) {
            fetchAllActivities();
        }
    }, [activeTab, selectedCategory, activities.length, activitiesLoading, mappings.length, mappingsLoading, fetchAllActivities, fetchAllMappings]);

    // CRUD operations
    const handleCreate = async () => {
        if (!newCatForm.name) return;
        setConfirmAction({
            message: 'Are you sure you want to create this category?',
            action: async () => {
                try {
                    const created = await createCategory(newCatForm);
                    setCategories(prev => [created, ...prev]);
                    setIsCreating(false);
                    setNewCatForm({ name: '', color: 'bg-blue-500', description: '', icon: 'Tag', productivityScore: 0, isDefault: false });
                } catch (err: any) {
                    setCategoriesError(err.message);
                }
            }
        });
    };

    const handleUpdate = async (id: string, data: Partial<Category>) => {
        try {
            const updated = await updateCategory(id, data);
            setCategories(prev => prev.map(c => c._id === id ? updated : c));
        } catch (err: any) {
            setCategoriesError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            setCategories(prev => prev.filter(c => c._id !== id));
        } catch (err: any) {
            setCategoriesError(err.message);
        }
    };

    const resetActivityForm = () => setActivityForm({
        app_name: '',
        window_title: '',
        url: '',
        start_time: '',
        end_time: '',
        category_id: '',
        user_id: '',
        idle: false,
    });

    const handleCreateActivity = async () => {
        if (!activityForm.app_name || !activityForm.start_time) return;
        setConfirmAction({
            message: 'Are you sure you want to create this activity?',
            action: async () => {
                try {
                    const created = await createActivity({
                        app_name: activityForm.app_name,
                        window_title: activityForm.window_title || undefined,
                        url: activityForm.url || undefined,
                        start_time: fromLocalInput(activityForm.start_time),
                        end_time: activityForm.end_time ? fromLocalInput(activityForm.end_time) : undefined,
                        category_id: activityForm.category_id || null,
                        user_id: activityForm.user_id || undefined,
                        idle: activityForm.idle ? 1 : 0,
                    });
                    setActivities(prev => [created, ...prev]);
                    setActivityCreating(false);
                    resetActivityForm();
                } catch (err: any) {
                    setActivitiesError(err.message);
                }
            }
        });
    };

    const handleUpdateActivity = async (id: string) => {
        setConfirmAction({
            message: 'Save changes to this activity?',
            action: async () => {
                try {
                    const updated = await updateActivity(id, {
                        app_name: activityForm.app_name,
                        window_title: activityForm.window_title || undefined,
                        url: activityForm.url || undefined,
                        start_time: activityForm.start_time ? fromLocalInput(activityForm.start_time) : undefined,
                        end_time: activityForm.end_time ? fromLocalInput(activityForm.end_time) : undefined,
                        category_id: activityForm.category_id || null,
                        idle: activityForm.idle ? 1 : 0,
                    });
                    setActivities(prev => prev.map(a => a._id === id ? updated : a));
                    setActivityEditingId(null);
                    setActivityCreating(false);
                    resetActivityForm();
                } catch (err: any) {
                    setActivitiesError(err.message);
                }
            }
        });
    };

    const handleDeleteActivity = async (id: string) => {
        setConfirmAction({
            message: 'Delete this activity?',
            action: async () => {
                try {
                    await deleteActivity(id);
                    setActivities(prev => prev.filter(a => a._id !== id));
                } catch (err: any) {
                    setActivitiesError(err.message);
                }
            }
        });
    };

    const startEditActivity = (activity: BackendActivity) => {
        setActivityEditingId(activity._id || null);
        setActivityCreating(true);
        setActivityForm({
            app_name: activity.app_name || '',
            window_title: activity.window_title || '',
            url: activity.url || '',
            start_time: toLocalInput(activity.start_time),
            end_time: toLocalInput(activity.end_time || undefined),
            category_id: typeof activity.category_id === 'string' ? activity.category_id : (activity.category_id as any)?._id || '',
            user_id: (activity as any).user_id || '',
            idle: typeof activity.idle === 'number' ? activity.idle > 0 : Boolean(activity.idle),
        });
    };

    const resetMappingForm = () => setMappingForm({
        activityId: '',
        categoryId: '',
        isManualOverride: false,
        overrideReason: '',
        confidenceScore: 100,
    });

    const handleCreateMapping = async () => {
        if (!mappingForm.activityId || !mappingForm.categoryId) return;
        setConfirmAction({
            message: 'Create this activity mapping?',
            action: async () => {
                try {
                    const created = await createMapping({
                        activityId: mappingForm.activityId,
                        categoryId: mappingForm.categoryId,
                        isManualOverride: mappingForm.isManualOverride,
                        overrideReason: mappingForm.overrideReason || undefined,
                        confidenceScore: mappingForm.confidenceScore,
                    });
                    setMappings(prev => [created, ...prev]);
                    setMappingCreating(false);
                    resetMappingForm();
                } catch (err: any) {
                    setMappingsError(err.message);
                }
            }
        });
    };

    const handleUpdateMapping = async (id: string) => {
        setConfirmAction({
            message: 'Save changes to this mapping?',
            action: async () => {
                try {
                    const updated = await updateMapping(id, {
                        activityId: mappingForm.activityId,
                        categoryId: mappingForm.categoryId,
                        isManualOverride: mappingForm.isManualOverride,
                        overrideReason: mappingForm.overrideReason || undefined,
                        confidenceScore: mappingForm.confidenceScore,
                    });
                    setMappings(prev => prev.map(m => m._id === id ? updated : m));
                    setMappingEditingId(null);
                    setMappingCreating(false);
                    resetMappingForm();
                } catch (err: any) {
                    setMappingsError(err.message);
                }
            }
        });
    };

    const handleDeleteMapping = async (id: string) => {
        setConfirmAction({
            message: 'Delete this mapping?',
            action: async () => {
                try {
                    await deleteMapping(id);
                    setMappings(prev => prev.filter(m => m._id !== id));
                } catch (err: any) {
                    setMappingsError(err.message);
                }
            }
        });
    };

    const startEditMapping = (mapping: ActivityMapping) => {
        setMappingEditingId(mapping._id);
        setMappingCreating(true);
        setMappingForm({
            activityId: typeof mapping.activityId === 'string' ? mapping.activityId : mapping.activityId?._id || '',
            categoryId: typeof mapping.categoryId === 'string' ? mapping.categoryId : mapping.categoryId?._id || '',
            isManualOverride: Boolean(mapping.isManualOverride),
            overrideReason: mapping.overrideReason || '',
            confidenceScore: mapping.confidenceScore ?? 100,
        });
    };

    // Search / filter
    const filteredCategories = searchId
        ? categories.filter(c => c._id.toLowerCase().includes(searchId.toLowerCase()) || c.name.toLowerCase().includes(searchId.toLowerCase()))
        : categories;

    // Stats
    const topCategory = categories.reduce((top, c) => c.productivityScore > (top?.productivityScore ?? -6) ? c : top, categories[0]);

    const filteredActivities = activitySearch
        ? activities.filter(a =>
            (a._id || '').toLowerCase().includes(activitySearch.toLowerCase()) ||
            a.app_name.toLowerCase().includes(activitySearch.toLowerCase()) ||
            (a.window_title || '').toLowerCase().includes(activitySearch.toLowerCase())
        )
        : activities;

    const filteredMappings = mappingSearch
        ? mappings.filter(m =>
            m._id.toLowerCase().includes(mappingSearch.toLowerCase()) ||
            (typeof m.activityId === 'string' ? m.activityId : m.activityId?.app_name || '').toLowerCase().includes(mappingSearch.toLowerCase()) ||
            (typeof m.categoryId === 'string' ? m.categoryId : m.categoryId?.name || '').toLowerCase().includes(mappingSearch.toLowerCase())
        )
        : mappings;

    const getCategoryStats = (cat: Category) => {
        const totalActivities = activities.filter(a => {
            if (!a.category_id) return false;
            if (typeof a.category_id === 'string') return a.category_id === cat._id;
            return (a.category_id as any)?._id === cat._id;
        });
        const totalMinutes = totalActivities.reduce((sum, a) => {
            if (!a.start_time || !a.end_time) return sum;
            const start = new Date(a.start_time).getTime();
            const end = new Date(a.end_time).getTime();
            if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return sum;
            return sum + (end - start) / 60000;
        }, 0);
        return { totalActivities: totalActivities.length, totalMinutes };
    };

    const tabs = [
        { key: 'CATEGORIES' as const, label: 'Categories', count: categories.length },
        { key: 'ACTIVITIES' as const, label: 'Activities', count: activities.length },
        { key: 'MAPPINGS' as const, label: 'Mappings', count: mappings.length },
    ];

    if (categoriesLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 size={32} className="text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-24">

            {/* Header */}
            <header className="flex flex-col gap-6 mb-10">
                <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Focus Categories</h1>
                        <p className="text-neutral-500">Structure your time and analyze where your attention goes.</p>
                    </div>

                    {activeTab === 'CATEGORIES' && (
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Search by ID or name..."
                                value={searchId}
                                onChange={e => setSearchId(e.target.value)}
                                className="bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue w-48"
                            />

                            <div className="bg-neutral-900 p-1 rounded-xl border border-white/10 flex">
                                <button onClick={() => setViewMode('GRID')}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'GRID' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
                                    <Grid size={14} /> Cards
                                </button>
                                <button onClick={() => setViewMode('ANALYTICS')}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'ANALYTICS' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
                                    <PieChart size={14} /> Analytics
                                </button>
                            </div>

                            <button onClick={() => setIsCreating(true)}
                                className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20">
                                <Plus size={16} /> <span className="hidden sm:inline">New Category</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'ACTIVITIES' && (
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Search by app or title..."
                                value={activitySearch}
                                onChange={e => setActivitySearch(e.target.value)}
                                className="bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue w-56"
                            />
                            <button onClick={() => { setActivityCreating(true); setActivityEditingId(null); resetActivityForm(); }}
                                className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20">
                                <Plus size={16} /> <span className="hidden sm:inline">New Activity</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'MAPPINGS' && (
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Search by activity or category..."
                                value={mappingSearch}
                                onChange={e => setMappingSearch(e.target.value)}
                                className="bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue w-64"
                            />
                            <button onClick={() => { setMappingCreating(true); setMappingEditingId(null); resetMappingForm(); }}
                                className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20">
                                <Plus size={16} /> <span className="hidden sm:inline">New Mapping</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-titanium-dark p-1.5 rounded-2xl border border-white/10 inline-flex gap-1">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`relative px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all duration-200 ${activeTab === tab.key ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}>
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${activeTab === tab.key ? 'bg-black/10' : 'bg-white/10'}`}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'CATEGORIES' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-titanium-dark border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-xl text-white"><Layers size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Categories</p>
                                <p className="text-xl font-bold text-white">{categories.length}</p>
                            </div>
                        </div>
                        <div className="bg-titanium-dark border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-xl text-accent-blue"><TrendingUp size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Top Productive</p>
                                <p className="text-xl font-bold text-white">{topCategory?.name || 'None'}</p>
                            </div>
                        </div>
                        <div className="bg-titanium-dark border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-xl text-green-400"><Clock size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Default Categories</p>
                                <p className="text-xl font-bold text-white font-mono">{categories.filter(c => c.isDefault).length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {categoriesError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {categoriesError}
                    </div>
                )}
                {activitiesError && activeTab === 'ACTIVITIES' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {activitiesError}
                    </div>
                )}
                {mappingsError && activeTab === 'MAPPINGS' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {mappingsError}
                    </div>
                )}
            </header>

            {activeTab === 'CATEGORIES' && (
                <>
                    {/* Create Modal */}
                    <AnimatePresence>
                        {isCreating && (
                            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                    className="relative w-full max-w-sm bg-titanium-surface border border-white/10 rounded-2xl p-6 shadow-2xl z-[80]">
                                    <h3 className="text-lg font-bold text-white mb-4">New Category</h3>
                                    <div className="space-y-4">
                                        <input autoFocus placeholder="Category Name" value={newCatForm.name}
                                            onChange={e => setNewCatForm({ ...newCatForm, name: e.target.value })}
                                            className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue outline-none" />
                                        <textarea placeholder="Description (optional)" value={newCatForm.description}
                                            onChange={e => setNewCatForm({ ...newCatForm, description: e.target.value })} rows={2}
                                            className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent-blue outline-none resize-none" />
                                        <div>
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">Score ({newCatForm.productivityScore})</label>
                                            <input type="range" min="-5" max="5" step="1" value={newCatForm.productivityScore}
                                                onChange={e => setNewCatForm({ ...newCatForm, productivityScore: Number(e.target.value) })}
                                                className="w-full accent-accent-blue" />
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {COLORS.map(c => (
                                                <button key={c} onClick={() => setNewCatForm({ ...newCatForm, color: c })}
                                                    className={`w-8 h-8 rounded-full ${c} transition-all ${newCatForm.color === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`} />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-6 gap-2">
                                            {Object.keys(ICON_MAP).map(iconKey => {
                                                const I = ICON_MAP[iconKey];
                                                return (
                                                    <button key={iconKey} onClick={() => setNewCatForm({ ...newCatForm, icon: iconKey })}
                                                        className={`aspect-square rounded-xl flex items-center justify-center transition-all
                                                            ${newCatForm.icon === iconKey ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'}`}>
                                                        <I size={16} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setIsCreating(false)} className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold">Cancel</button>
                                            <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200">Create</button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Grid View */}
                    <AnimatePresence mode="wait">
                        {viewMode === 'GRID' && (
                            <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filteredCategories.map((cat) => {
                                    const Icon = ICON_MAP[cat.icon || 'Tag'] || Tag;
                                    const scorePercent = Math.max(0, ((cat.productivityScore + 5) / 10) * 100);

                                    return (
                                        <motion.div key={cat._id} layout onClick={() => setSelectedCategory(cat)}
                                            className="bg-[#151515] border border-white/5 hover:border-white/20 rounded-[24px] p-6 relative group transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden cursor-pointer">
                                            <div className={`absolute -top-10 -right-10 w-40 h-40 ${cat.color} blur-[80px] opacity-[0.1] group-hover:opacity-[0.2] transition-opacity pointer-events-none`} />

                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <div className="relative">
                                                    <div className={`w-14 h-14 rounded-2xl ${cat.color} bg-opacity-20 flex items-center justify-center text-white shadow-lg border border-white/10 group-hover:scale-105 transition-transform`}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <svg className="absolute -inset-1 w-16 h-16 rotate-[-90deg] pointer-events-none" viewBox="0 0 36 36">
                                                        <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                                                        <motion.path className={cat.color.replace('bg-', 'text-')} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2"
                                                            strokeDasharray={`${scorePercent}, 100`} initial={{ strokeDasharray: "0, 100" }} animate={{ strokeDasharray: `${scorePercent}, 100` }}
                                                            transition={{ duration: 1, ease: "easeOut" }} />
                                                    </svg>
                                                </div>
                                                {cat.isDefault && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">Default</span>
                                                )}
                                            </div>

                                            <div className="relative z-10 mb-4">
                                                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{cat.name}</h3>
                                                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                                                    <span>Score: {cat.productivityScore}</span>
                                                </div>
                                            </div>

                                            {cat.description && (
                                                <p className="relative z-10 text-xs text-neutral-500 line-clamp-2">{cat.description}</p>
                                            )}
                                        </motion.div>
                                    );
                                })}

                                {/* Add New Placeholder */}
                                <motion.button layout onClick={() => setIsCreating(true)}
                                    className="border border-dashed border-white/10 rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 group hover:border-white/20 hover:bg-white/[0.02] transition-all min-h-[220px]">
                                    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500 group-hover:text-white group-hover:bg-neutral-800 transition-colors shadow-inner">
                                        <Plus size={32} />
                                    </div>
                                    <span className="text-sm font-bold text-neutral-500 group-hover:text-white transition-colors">Create Category</span>
                                </motion.button>
                            </motion.div>
                        )}

                        {viewMode === 'ANALYTICS' && (
                            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="bg-titanium-dark border border-titanium-border rounded-[22px] p-8">
                                <h3 className="text-lg font-bold text-white mb-6">Productivity Ranking</h3>
                                <div className="space-y-4">
                                    {[...categories]
                                        .sort((a, b) => b.productivityScore - a.productivityScore)
                                        .map((cat, i) => {
                                            const pct = Math.max(0, ((cat.productivityScore + 5) / 10) * 100);
                                            return (
                                                <div key={cat._id} className="group">
                                                    <div className="flex justify-between items-center text-sm mb-2">
                                                        <span className="font-bold text-white flex items-center gap-3">
                                                            <span className="text-neutral-600 font-mono text-xs w-4">#{i + 1}</span>
                                                            {cat.name}
                                                        </span>
                                                        <span className="font-mono text-neutral-400">{cat.productivityScore}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                            transition={{ delay: i * 0.05 }} className={`h-full ${cat.color}`} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Detail Drawer */}
                    <AnimatePresence>
                        {selectedCategory && (
                    <CategoryDrawer
                        category={selectedCategory}
                        stats={getCategoryStats(selectedCategory)}
                        onClose={() => setSelectedCategory(null)}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                        )}
                    </AnimatePresence>
                </>
            )}

            {activeTab === 'ACTIVITIES' && (
                <div className="space-y-6">
                    <AnimatePresence>
                        {activityCreating && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-sm font-bold text-white">{activityEditingId ? 'Edit Activity' : 'New Activity'}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input placeholder="App Name" value={activityForm.app_name} onChange={e => setActivityForm({ ...activityForm, app_name: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                        <input placeholder="Window Title" value={activityForm.window_title} onChange={e => setActivityForm({ ...activityForm, window_title: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                        <input placeholder="User ID (optional)" value={activityForm.user_id} onChange={e => setActivityForm({ ...activityForm, user_id: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none sm:col-span-2" />
                                        <input placeholder="URL (optional)" value={activityForm.url} onChange={e => setActivityForm({ ...activityForm, url: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none sm:col-span-2" />
                                        <input type="datetime-local" value={activityForm.start_time} onChange={e => setActivityForm({ ...activityForm, start_time: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                        <input type="datetime-local" value={activityForm.end_time} onChange={e => setActivityForm({ ...activityForm, end_time: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                        <select value={activityForm.category_id} onChange={e => setActivityForm({ ...activityForm, category_id: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none">
                                            <option value="">Uncategorized</option>
                                            {categories.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => setActivityForm({ ...activityForm, idle: !activityForm.idle })}
                                            className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activityForm.idle ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-neutral-800 text-neutral-400 border border-white/10'}`}>
                                            {activityForm.idle ? 'Marked Idle' : 'Mark Idle'}
                                        </button>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => { setActivityCreating(false); setActivityEditingId(null); resetActivityForm(); }}
                                            className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold">Cancel</button>
                                        <button onClick={() => activityEditingId ? handleUpdateActivity(activityEditingId) : handleCreateActivity()}
                                            className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200">
                                            {activityEditingId ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activitiesLoading ? (
                        <div className="flex justify-center py-20"><Loader2 size={24} className="text-white animate-spin" /></div>
                    ) : (
                        <div className="space-y-3">
                            {filteredActivities.length === 0 ? (
                                <div className="bg-titanium-dark border border-white/10 rounded-2xl px-6 py-16 text-center">
                                    <Layers size={32} className="text-neutral-700 mx-auto mb-3" />
                                    <p className="text-neutral-500 text-sm">No activities found.</p>
                                    <p className="text-neutral-600 text-xs mt-1">Create or sync activities to get started.</p>
                                </div>
                            ) : filteredActivities.map((a, i) => (
                                (() => {
                                    const start = a.start_time ? new Date(a.start_time).getTime() : null;
                                    const end = a.end_time ? new Date(a.end_time).getTime() : null;
                                    const minutes = start && end && end > start ? Math.round((end - start) / 60000) : null;
                                    return (
                                <motion.div key={a._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                    className="bg-titanium-dark border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-all group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/10 text-neutral-300">{a.app_name}</span>
                                                {a.category_id && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                        {typeof a.category_id === 'string' ? a.category_id : (a.category_id as any)?.name || 'Category'}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-bold text-white truncate">{a.window_title || a.app_name}</h4>
                                            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{a.url || '—'}</p>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600">
                                                <span className="font-mono">{(a._id || '').slice(0, 8)}...</span>
                                                <span>{a.start_time ? new Date(a.start_time).toLocaleString() : 'Unknown'}</span>
                                                {minutes !== null && <span>{minutes}m</span>}
                                                {a.idle ? <span className="text-orange-400">Idle</span> : <span className="text-emerald-400">Active</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button onClick={() => startEditActivity(a)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                            {a._id && (
                                                <button onClick={() => handleDeleteActivity(a._id!)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                                    );
                                })()
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'MAPPINGS' && (
                <div className="space-y-6">
                    <AnimatePresence>
                        {mappingCreating && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-sm font-bold text-white">{mappingEditingId ? 'Edit Mapping' : 'New Mapping'}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <select value={mappingForm.activityId} onChange={e => setMappingForm({ ...mappingForm, activityId: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none">
                                            <option value="">Select Activity (optional)</option>
                                            {activities.map(a => (
                                                <option key={a._id} value={a._id}>{a.app_name} • {a.window_title || 'Untitled'}</option>
                                            ))}
                                        </select>
                                        <select value={mappingForm.categoryId} onChange={e => setMappingForm({ ...mappingForm, categoryId: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none">
                                            <option value="">Select Category (optional)</option>
                                            {categories.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <input placeholder="Activity ID (paste if not in list)" value={mappingForm.activityId} onChange={e => setMappingForm({ ...mappingForm, activityId: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                        <input placeholder="Category ID (paste if not in list)" value={mappingForm.categoryId} onChange={e => setMappingForm({ ...mappingForm, categoryId: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                        <input placeholder="Override Reason" value={mappingForm.overrideReason} onChange={e => setMappingForm({ ...mappingForm, overrideReason: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none sm:col-span-2" />
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Confidence ({mappingForm.confidenceScore})</label>
                                            <input type="range" min="0" max="100" value={mappingForm.confidenceScore} onChange={e => setMappingForm({ ...mappingForm, confidenceScore: Number(e.target.value) })}
                                                className="w-full accent-accent-blue" />
                                        </div>
                                        <button onClick={() => setMappingForm({ ...mappingForm, isManualOverride: !mappingForm.isManualOverride })}
                                            className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${mappingForm.isManualOverride ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400 border border-white/10'}`}>
                                            {mappingForm.isManualOverride ? 'Manual Override' : 'Mark Manual Override'}
                                        </button>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => { setMappingCreating(false); setMappingEditingId(null); resetMappingForm(); }}
                                            className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold">Cancel</button>
                                        <button onClick={() => mappingEditingId ? handleUpdateMapping(mappingEditingId) : handleCreateMapping()}
                                            className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200">
                                            {mappingEditingId ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {mappingsLoading ? (
                        <div className="flex justify-center py-20"><Loader2 size={24} className="text-white animate-spin" /></div>
                    ) : (
                        <div className="space-y-3">
                            {filteredMappings.length === 0 ? (
                                <div className="bg-titanium-dark border border-white/10 rounded-2xl px-6 py-16 text-center">
                                    <Target size={32} className="text-neutral-700 mx-auto mb-3" />
                                    <p className="text-neutral-500 text-sm">No mappings found.</p>
                                    <p className="text-neutral-600 text-xs mt-1">Create a mapping to categorize activities.</p>
                                </div>
                            ) : filteredMappings.map((m, i) => (
                                <motion.div key={m._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                    className="bg-titanium-dark border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-all group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/10 text-neutral-300">
                                                    {typeof m.activityId === 'string' ? m.activityId.slice(0, 8) : m.activityId?.app_name}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                    {typeof m.categoryId === 'string' ? m.categoryId.slice(0, 8) : m.categoryId?.name}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-white truncate">{typeof m.activityId === 'string' ? m.activityId : m.activityId?.app_name}</h4>
                                            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                                                {typeof m.categoryId === 'string' ? '' : (m.categoryId?.name || '')}
                                                {m.overrideReason ? ` • ${m.overrideReason}` : ''}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600">
                                                <span className="font-mono">{m._id.slice(0, 8)}...</span>
                                                <span>Confidence: {m.confidenceScore ?? 0}</span>
                                                {m.isManualOverride && <span className="text-emerald-400">Manual</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button onClick={() => startEditMapping(m)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteMapping(m._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Confirm Dialog */}
            <AnimatePresence>
                {confirmAction && (
                    <ConfirmDialog
                        message={confirmAction.message}
                        onConfirm={() => { confirmAction.action(); setConfirmAction(null); }}
                        onCancel={() => setConfirmAction(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CategoriesView;
