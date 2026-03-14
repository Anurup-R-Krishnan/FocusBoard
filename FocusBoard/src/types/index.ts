
export type SessionState = 'IDLE' | 'FOCUS' | 'BREAK' | 'DISTRACTED' | 'MEETING' | 'RECOVERY';

export interface TimeSegment {
  id: string;
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
  type: SessionState;
  tags?: string[];
  taskId?: string; // Link to specific task
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

export interface Task {
  id: string;
  title: string;
  project: string;
  client?: string; // New client field
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timeSpent?: number; // accumulated minutes
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'FOCUS' | 'MEETING' | 'DEADLINE' | 'PERSONAL';
  attendees?: string[];
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
  activeTaskId: string | null;
  metrics: FocusMetrics;
  recoveryProgress: number; // 0-100, used during RECOVERY state
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
  assignTaskToSegment: (segmentId: string, taskId: string) => void;
  setActiveTask: (id: string) => void;
  moveTask: (id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  createTask: (task: Omit<Task, 'id' | 'status'>) => void;
  deleteTask: (id: string) => void;
}
