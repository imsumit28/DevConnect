import React, { useState } from 'react';
import { X, CheckCircle2, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';

const ConnectionsModal = ({ 
  isOpen, 
  onClose, 
  initialTab = 'followers',
  followers = [], 
  following = [], 
  requests = [],
  isOwnProfile = false,
  onAcceptRequest,
  onRejectRequest,
  onUnfollow
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Connections</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 pt-2 px-4 gap-4">
          <button
            onClick={() => setActiveTab('followers')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'followers' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Followers ({followers.length})
            {activeTab === 'followers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'following' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Following ({following.length})
            {activeTab === 'following' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
          </button>
          {isOwnProfile && requests.length > 0 && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'requests' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Requests ({requests.length})
              <span className="absolute -top-1 -right-3 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                {requests.length}
              </span>
              {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'followers' && (
            followers.length > 0 ? (
              <div className="flex flex-col">
                {followers.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <Link to={`/profile/${user.username}`} onClick={onClose} className="flex items-center gap-3">
                      <img src={user.profilePic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{user.name || user.username}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
               <div className="p-8 text-center text-sm text-gray-500">No followers yet.</div>
            )
          )}

          {activeTab === 'following' && (
            following.length > 0 ? (
              <div className="flex flex-col">
                {following.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <Link to={`/profile/${user.username}`} onClick={onClose} className="flex items-center gap-3">
                      <img src={user.profilePic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 hover:text-primary transition-colors">{user.name || user.username}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </Link>
                    {isOwnProfile && (
                       <button onClick={() => onUnfollow(user._id)} className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
                         Unfollow
                       </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
               <div className="p-8 text-center text-sm text-gray-500">Not following anyone.</div>
            )
          )}

          {activeTab === 'requests' && isOwnProfile && (
            requests.length > 0 ? (
              <div className="flex flex-col">
                {requests.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <Link to={`/profile/${user.username}`} onClick={onClose} className="flex items-center gap-3">
                      <img src={user.profilePic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 hover:text-primary transition-colors">{user.name || user.username}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                       <button onClick={() => onRejectRequest(user._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Reject Request">
                         <UserX className="w-5 h-5" />
                       </button>
                       <button onClick={() => onAcceptRequest(user._id)} className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors" title="Accept Request">
                         <CheckCircle2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="p-8 text-center text-sm text-gray-500">No pending follow requests.</div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsModal;
