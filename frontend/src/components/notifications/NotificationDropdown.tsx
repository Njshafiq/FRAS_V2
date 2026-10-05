import React from 'react';
import { AppNotification } from '../../types';
import { 
  CheckCheck, 
  Clock, 
  UserCheck, 
  Scan, 
  Calendar, 
  Database, 
  ExternalLink,
  BellOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const categoryIcons: Record<string, React.ReactNode> = {
    SESSION_COMPLETED: <UserCheck className="w-4 h-4 text-emerald-500" />,
    FACE_PENDING: <Scan className="w-4 h-4 text-amber-500" />,
    TIMETABLE_UPCOMING: <Clock className="w-4 h-4 text-sky-500" />,
    STUDENT_REGISTERED: <Calendar className="w-4 h-4 text-purple-500" />,
    SYSTEM_STATUS: <Database className="w-4 h-4 text-indigo-500" />,
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.is_read) {
      onMarkAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
      {/* Popover Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 rounded-full border border-primary-200 dark:border-primary-800">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">No notifications right now.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                !notif.is_read
                  ? 'bg-primary-50/40 dark:bg-primary-950/20'
                  : 'bg-transparent'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                {categoryIcons[notif.category] || <Clock className="w-4 h-4 text-slate-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </h4>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.description}
                </p>

                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                  <span>{notif.timestamp}</span>
                  {notif.link && (
                    <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                      View details <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Popover Footer */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/50">
        <button
          onClick={() => {
            navigate('/attendance/sessions');
            onClose();
          }}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          View All System Activity
        </button>
      </div>
    </div>
  );
};
