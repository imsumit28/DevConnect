import React from 'react';
import { X } from 'lucide-react';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ notifications, onMarkAsRead, onMarkOneAsRead, onClose }) => {
  return (
    <div className="fixed left-2 right-2 top-24 w-auto max-w-none bg-white shadow-2xl rounded-2xl border border-gray-100 z-[260] overflow-hidden animate-scale-in md:absolute md:top-full md:right-0 md:left-auto md:mt-3 md:w-[350px] md:max-w-[350px]">
      {/* Header */}
      <div className="px-5 py-4 border-b flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h3 className="font-bold text-lg text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={onMarkAsRead}
              className="text-xs text-primary font-bold hover:text-blue-800 transition-colors py-1 px-2 hover:bg-blue-50 rounded-md"
            >
              Mark all as read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* List Container */}
      <div className="max-h-[60vh] md:max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <NotificationItem 
              key={notif._id}
              notification={notif}
              onMarkAsRead={onMarkOneAsRead}
              onClose={onClose}
            />
          ))
        ) : (
          <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔔</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
            <p className="text-xs text-gray-400">When you get notifications, they'll show up here.</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 bg-gray-50/50 text-center border-t border-gray-100">
        <button className="text-xs text-gray-600 font-bold hover:text-primary transition-colors">
          View all activity
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
