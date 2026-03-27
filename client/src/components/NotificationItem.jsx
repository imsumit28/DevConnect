import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../utils/timeUtils';

const NotificationItem = ({ notification, onMarkAsRead, onClose }) => {
  const navigate = useNavigate();
  const { _id, sender, type, post, isRead, createdAt } = notification;

  const handleClick = () => {
    onMarkAsRead(_id);
    onClose();

    if (type === 'like' || type === 'comment') {
      navigate(`/post/${post?._id || ''}`);
    } else if (type === 'follow') {
      navigate(`/profile/${sender?.username}`);
    } else if (type === 'message') {
      navigate('/messages');
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-0 ${!isRead ? 'bg-blue-50/40 relative' : ''}`}
    >
      {/* User Avatar */}
      <div className="relative flex-shrink-0">
        <img 
          src={sender?.profilePic || `https://i.pravatar.cc/150?u=${sender?.username || 'user'}`} 
          alt={sender?.name || sender?.username} 
          className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200 hover:scale-110 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${sender?.username}`);
          }}
        />
        {!isRead && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
        )}
      </div>

      {/* Notification Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-gray-800 leading-snug ${!isRead ? 'font-semibold text-black' : 'font-normal'}`}>
          <span 
            className="font-bold hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${sender?.username}`);
            }}
          >
            {sender?.name || sender?.username}
          </span>
          {' '}
          {type === 'like' && 'liked your post'}
          {type === 'follow' && 'started following you'}
          {type === 'message' && 'sent you a message'}
          {type === 'comment' && 'commented on your post'}
        </p>
        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
          {formatRelativeTime(createdAt)}
        </p>
      </div>

      {/* Unread Indicator dot for right side (optional/double visual) */}
      {!isRead && (
        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
      )}
    </div>
  );
};

export default NotificationItem;
