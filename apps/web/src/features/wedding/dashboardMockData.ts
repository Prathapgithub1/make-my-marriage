export interface FocusTask {
  id: string;
  title: string;
  category?: 'Ceremony' | 'Guests' | 'Catering' | 'Photography' | 'Attire' | 'Decor';
  dueDate: string;
  isCompleted: boolean;
  priority: 'HIGH' | 'MED' | 'Normal';
  assignee: {
    name: string;
    initials: string;
  };
}

export interface DemoEvent {
  id: string;
  name: string;
  month: string;
  day: string;
  timeRange: string;
  venue: string;
  guestCount: string;
  statusBadge: 'Confirmed' | 'MAIN CEREMONY' | 'Planned';
  isMainCeremony?: boolean;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  iconType: 'wedding' | 'event' | 'team' | 'task' | 'rsvp';
}

export interface PlanningMilestone {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  description: string;
  percentage: number;
}

export const DEMO_FOCUS_TASKS: FocusTask[] = [
  {
    id: 'task-1',
    title: 'Finalize floral palette & Mandap structure',
    dueDate: 'Due Nov 5',
    isCompleted: false,
    priority: 'HIGH',
    assignee: {
      name: 'Akshitha',
      initials: 'AR',
    },
  },
  {
    id: 'task-2',
    title: 'Confirm guest dietary requirements with catering',
    dueDate: 'Due Nov 7',
    isCompleted: false,
    priority: 'MED',
    assignee: {
      name: 'Prathap',
      initials: 'PK',
    },
  },
  {
    id: 'task-3',
    title: 'Review bespoke stationery & welcome card proofs',
    dueDate: 'Due Nov 10',
    isCompleted: false,
    priority: 'Normal',
    assignee: {
      name: 'Akshitha',
      initials: 'AR',
    },
  },
  {
    id: 'task-4',
    title: 'Coordinate arrival timing with live musicians',
    dueDate: 'Due Nov 12',
    isCompleted: false,
    priority: 'Normal',
    assignee: {
      name: 'Admin',
      initials: 'AD',
    },
  },
];

export const DEMO_EVENTS: DemoEvent[] = [
  {
    id: 'demo-evt-1',
    name: 'Mehendi & Henna Soiree',
    month: 'NOV',
    day: '23',
    timeRange: '3:00 PM – 7:30 PM',
    venue: 'Courtyard Pavilions, Bangalore',
    guestCount: '120 Guests',
    statusBadge: 'Confirmed',
  },
  {
    id: 'demo-evt-2',
    name: 'Sangeet & Musical Evening',
    month: 'NOV',
    day: '23',
    timeRange: '8:00 PM – 1:00 AM',
    venue: 'Grand Royal Ballroom, Palace Grounds',
    guestCount: '184 Guests',
    statusBadge: 'Confirmed',
  },
  {
    id: 'demo-evt-3',
    name: 'Varmala & Sacred Pheras',
    month: 'NOV',
    day: '24',
    timeRange: '9:30 AM Muhurtham',
    venue: 'Central Palace Heritage Lawns',
    guestCount: 'All 184 Invites',
    statusBadge: 'MAIN CEREMONY',
    isMainCeremony: true,
  },
];

export const DEMO_ACTIVITY_FEED: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Wedding Workspace Created',
    description: 'Shared sanctuary established with primary celebration parameters.',
    timestamp: 'Recently',
    iconType: 'wedding',
  },
  {
    id: 'act-2',
    title: 'Co-Organizers & Family Invited',
    description: 'Workspace member invitations dispatched via secure tokens.',
    timestamp: '2 days ago',
    iconType: 'team',
  },
  {
    id: 'act-3',
    title: 'Ceremony Schedule Initialized',
    description: 'Itinerary and multi-event timeline ready for detailed planning.',
    timestamp: '3 days ago',
    iconType: 'event',
  },
  {
    id: 'act-4',
    title: 'Planning Checklist Calibrated',
    description: 'Curated Indian wedding milestone roadmap initialized.',
    timestamp: '5 days ago',
    iconType: 'task',
  },
];

export const DEMO_PLANNING_MILESTONES: PlanningMilestone[] = [
  {
    id: 'phase-1',
    name: 'Foundation & Venue',
    status: 'completed',
    description: 'Dates, locations, and couple workspace established',
    percentage: 100,
  },
  {
    id: 'phase-2',
    name: 'Ceremonies & Itinerary',
    status: 'in_progress',
    description: 'Scheduling Mehendi, Sangeet, Haldi, & Reception',
    percentage: 50,
  },
  {
    id: 'phase-3',
    name: 'Guest Registry & RSVPs',
    status: 'upcoming',
    description: 'Address collection and invitation dispatch',
    percentage: 0,
  },
  {
    id: 'phase-4',
    name: 'Vendors & Final Touches',
    status: 'upcoming',
    description: 'Decorators, caterers, artists, and logistics',
    percentage: 0,
  },
];
