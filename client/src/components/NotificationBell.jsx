import React from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = ({ unreadCount, onClick, isOpen }) => {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center transition-all duration-300 p-1 rounded-lg hover:bg-gray-100 ${isOpen ? 'text-primary bg-gray-100' : 'text-gray-500 hover:text-black'}`}
      aria-label="Notifications"
    >
      <div className="relative">
        <Bell className={`w-6 h-6 ${isOpen ? 'fill-primary' : ''}`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      <span className="text-[10px] hidden md:block mt-1 font-medium">Notifications</span>
    </button>
  );
};

export default NotificationBell;
