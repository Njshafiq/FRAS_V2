import { AppNotification } from '../types';

const STORAGE_KEY = 'fras_notifications';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NOTIF-101',
    category: 'SESSION_COMPLETED',
    title: 'Attendance Session Completed',
    description: 'Java Programming (CS101) finished with 42/45 students marked present (93.3%).',
    timestamp: '10 mins ago',
    is_read: false,
    link: '/attendance/sessions',
  },
  {
    id: 'NOTIF-102',
    category: 'FACE_PENDING',
    title: 'Face Dataset Capture Pending',
    description: 'Student Emma Wilson (S1004) has not completed webcam face image capture.',
    timestamp: '35 mins ago',
    is_read: false,
    link: '/students',
  },
  {
    id: 'NOTIF-103',
    category: 'TIMETABLE_UPCOMING',
    title: 'Upcoming Scheduled Class',
    description: 'Database Management Systems (CS101) is scheduled today at 14:00 PM.',
    timestamp: '1 hour ago',
    is_read: false,
    link: '/timetable',
  },
  {
    id: 'NOTIF-104',
    category: 'STUDENT_REGISTERED',
    title: 'New Student Profile Added',
    description: 'Mia Anderson (S1008) registered under Class B.Tech IT 1st Year.',
    timestamp: '2 hours ago',
    is_read: true,
    link: '/students',
  },
  {
    id: 'NOTIF-105',
    category: 'SYSTEM_STATUS',
    title: 'PostgreSQL Database Health',
    description: 'Database attendance_system integrity check completed cleanly.',
    timestamp: 'Yesterday',
    is_read: true,
    link: '/settings',
  },
];

const getStoredNotifications = (): AppNotification[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }
  return JSON.parse(data);
};

const saveNotifications = (items: AppNotification[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    return getStoredNotifications();
  },

  async markAsRead(id: string): Promise<AppNotification[]> {
    const list = getStoredNotifications();
    const updated = list.map((item) => (item.id === id ? { ...item, is_read: true } : item));
    saveNotifications(updated);
    return updated;
  },

  async markAllAsRead(): Promise<AppNotification[]> {
    const list = getStoredNotifications();
    const updated = list.map((item) => ({ ...item, is_read: true }));
    saveNotifications(updated);
    return updated;
  },

  async getUnreadCount(): Promise<number> {
    const list = getStoredNotifications();
    return list.filter((item) => !item.is_read).length;
  },
};
