import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Home, Bell, MessageSquare, User, Search, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import NotificationBell from './NotificationBell';
import { io } from 'socket.io-client';
import { useToast } from '../context/ToastContext';
import { socketUrl } from '../utils/runtimeConfig';
import { resolveMediaUrl } from '../utils/mediaUrl';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef(null);
  
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    if (user?._id) {
      // Socket Join
      const socket = io(socketUrl);
      socket.emit('join', user._id);

      socket.on('new_notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
        const toastText = notif.type === 'like' ? `${notif.senderName} liked your post`
          : notif.type === 'follow' ? `${notif.senderName} followed you`
          : notif.type === 'comment' ? `${notif.senderName} commented on your post`
          : `${notif.senderName} sent you a message`;
        showToast(toastText);
      });

      // Fetch Notifications
      api.get('/notifications').then(res => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.isRead).length);
      });

      return () => socket.disconnect();
    }
  }, [user?._id]);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const markOneAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        try {
          const res = await api.get(`/users/search?q=${searchTerm}`);
          setSearchResults(res.data);
        } catch (error) {
          console.error("Search failed", error);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectUser = (username) => {
    navigate(`/profile/${encodeURIComponent(username)}`);
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-md z-50 border-b border-blue-100/70">
      <div className="max-w-6xl mx-auto px-4">
        <div className="py-2 md:py-0 md:h-16 flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
          
          {/* Logo & Search */}
          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            <Logo size="medium" />
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full brand-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)] brand-pulse-dot"></span>
              Build. Share. Grow.
            </span>
          
            {/* Navigation Icons */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
              <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-black transition-colors dc-interact px-2 py-1 rounded-lg">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-[10px] hidden md:block">Home</span>
              </Link>
              <div className="relative">
                <NotificationBell 
                  unreadCount={unreadCount} 
                  onClick={() => setIsNotifOpen(!isNotifOpen)} 
                  isOpen={isNotifOpen} 
                />
                {isNotifOpen && (
                  <NotificationDropdown 
                    notifications={notifications} 
                    onMarkAsRead={markAllAsRead}
                    onMarkOneAsRead={markOneAsRead}
                    onClose={() => setIsNotifOpen(false)}
                  />
                )}
              </div>
              <Link to="/messages" className="flex flex-col items-center text-gray-500 hover:text-black transition-colors dc-interact px-2 py-1 rounded-lg">
                <MessageSquare className="w-5 h-5 mb-1" />
                <span className="text-[10px] hidden md:block">Messages</span>
              </Link>
              <Link 
                to="/profile" 
                className="relative group cursor-pointer flex flex-col items-center text-gray-500 hover:text-primary transition-colors hover:scale-110 active:scale-95 duration-200"
              >
                <img 
                  src={resolveMediaUrl(user?.profilePic) || `https://i.pravatar.cc/150?u=${user?.username || 'me'}`} 
                  alt="Me" 
                  className="w-6 h-6 rounded-full object-cover border border-white shadow-sm transition-all" 
                />
                <span className="text-[10px] hidden md:block mt-0.5">Me</span>
              </Link>
              <button onClick={handleLogout} className="flex flex-col items-center text-gray-500 hover:text-red-500 transition-colors md:ml-4 md:border-l md:pl-4 md:border-gray-200">
                <LogOut className="w-5 h-5 mb-1" />
                <span className="text-[10px] hidden md:block">Sign Out</span>
              </button>
            </div>
          </div>

          <div ref={searchContainerRef} className="flex flex-col relative w-full md:w-auto">
            <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition-all duration-300 dc-interact">
              <Search className="w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="bg-transparent border-none outline-none ml-2 text-sm w-full md:w-48 lg:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearching(true)}
              />
            </div>

            {/* Search Dropdown */}
            {isSearching && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white shadow-lg rounded-md border border-gray-100 max-h-64 overflow-y-auto z-50">
                {searchResults.map((result) => (
                  <button
                    type="button"
                    key={result._id} 
                    className="w-full text-left flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectUser(result.username);
                    }}
                  >
                    <img src={resolveMediaUrl(result.profilePic) || `https://i.pravatar.cc/150?u=${result.username}`} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{result.name || result.username}</p>
                      <p className="text-xs text-gray-500 truncate font-medium">@{result.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
