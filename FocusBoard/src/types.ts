
export type SessionState = 'IDLE' | 'FOCUS' | 'BREAK' | 'DISTRACTED' | 'MEETING' | 'RECOVERY';

export interface TimeSegment {
  id: string;
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
  type: SessionState;
  tags?: string[];
  taskId?: string; // Link to specific task
  userTitle?: string;
  notes?: string;
}

export interface SquadMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string; // Color string or image url
  status: SessionState;
  lastActive: string;
  currentTask?: string;
}

export interface ActivityEvent {
  id: string;
  memberId: string;
  memberName: string;
  type: 'STATUS_CHANGE' | 'ACHIEVEMENT' | 'NUDGE';
  message: string;
  timestamp: Date;
}

export interface TauriActivity {
  app_name: string;
  window_title: string;
  idle_time: number;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  client?: string; // New client field
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timeSpent?: number; // accumulated minutes
  billable?: boolean;
  archived?: boolean;
  notes?: string;
  dueDate?: Date;
}

export interface Category {
  id: string;
  label: string;
  color: string;
  icon?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  priority: 1 | 2 | 3;
  event_type: 'FOCUS' | 'MEETING' | 'PERSONAL' | 'DEADLINE';
  is_recurring: boolean;
  label_color: string;
  category_id?: string | null;
  description?: string | null;
  location?: string | null;
  attendees?: string[];
  calendar?: 'google' | 'icloud' | 'outlook';
  user_id: string;
  // Legacy display fields (computed from label_color / priority)
  type?: 'FOCUS' | 'MEETING' | 'DEADLINE' | 'PERSONAL';
  platform?: 'google' | 'outlook' | 'apple';
}

export interface FocusMetrics {
  focusScore: number;
  deepWorkMinutes: number;
  contextSwitches: number;
  meetingsCount: number;
  weeklyTrend: number[]; // 7 days of scores
  lastWeekTrend: number[]; // 7 days of scores (comparison)
  // Granular trends for drill-down
  deepWorkTrend: number[];
  contextSwitchesTrend: number[];
}

export interface SimulationState {
  currentTime: Date;
  isPlaying: boolean;
  speedMultiplier: number; // 1x or 60x
  sessionState: SessionState;
  timeline: TimeSegment[];
  squad: SquadMember[];
  activityFeed: ActivityEvent[];
  tasks: Task[];
  categories: Category[];
  activeTaskId: string | null;
  metrics: FocusMetrics;
  recoveryProgress: number; // 0-100, used during RECOVERY state
  currentActivity?: TauriActivity;
}

export interface SimulationControls {
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  startFocus: () => void;
  resumeFocus: () => void;
  takeBreak: () => void;
  addDistraction: () => void;
  triggerNudge: (memberId: string) => void;
  tagSegment: (id: string, tag: string) => void;
  updateSegment: (id: string, updates: Partial<TimeSegment>) => void;
  assignTaskToSegment: (segmentId: string, taskId: string) => void;
  setActiveTask: (id: string) => void;
  moveTask: (id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  createTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskBillable: (id: string) => void;
  toggleTaskArchived: (id: string) => void;
  // Category Controls
  createCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  // Batch Controls
  renameProject: (oldName: string, newName: string) => void;
  renameClient: (oldName: string, newName: string) => void;
}
