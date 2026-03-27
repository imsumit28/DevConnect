import React, { useState, useContext, useEffect } from 'react';
import { Plus, Check, ChevronDown, Sparkles, TrendingUp, UserPlus2, Hash } from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ALL_HASHTAGS = [
  { tag: '#ReactJS', posts: '25,402' },
  { tag: '#WebDevelopment', posts: '14,923' },
  { tag: '#MERNStack', posts: '8,210' },
  { tag: '#JavaScript', posts: '42,891' },
  { tag: '#TypeScript', posts: '19,305' },
  { tag: '#NodeJS', posts: '31,742' },
  { tag: '#Python', posts: '55,120' },
  { tag: '#DevOps', posts: '12,654' },
  { tag: '#Docker', posts: '9,811' },
  { tag: '#Kubernetes', posts: '7,432' },
  { tag: '#AWS', posts: '18,903' },
  { tag: '#MachineLearning', posts: '22,154' },
  { tag: '#AI', posts: '38,772' },
  { tag: '#CyberSecurity', posts: '11,203' },
  { tag: '#Git', posts: '15,890' },
  { tag: '#NextJS', posts: '13,456' },
  { tag: '#TailwindCSS', posts: '10,287' },
  { tag: '#Flutter', posts: '8,934' },
  { tag: '#Rust', posts: '6,721' },
  { tag: '#GoLang', posts: '7,102' },
  { tag: '#GraphQL', posts: '5,891' },
  { tag: '#MongoDB', posts: '9,234' },
  { tag: '#PostgreSQL', posts: '8,456' },
  { tag: '#SystemDesign', posts: '14,312' },
  { tag: '#OpenSource', posts: '11,876' },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getMutualConnections(user) {
  const seed = String(user?.username || user?._id || 'devconnect')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return (seed % 7) + 1;
}

const SuggestedUser = ({ user, onFollowed, index = 0, animateReady = false }) => {
  const { user: currentUser, updateUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const normalizeId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value._id || value.id || '';
    return String(value);
  };
  const followingIds = (currentUser?.following || []).map(normalizeId);
  const targetUserId = normalizeId(user?._id);
  const isFollowing = followingIds.includes(targetUserId);
  const [loading, setLoading] = useState(false);
  const mutualConnections = getMutualConnections(user);

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFollowing || loading) return;
    setLoading(true);
    try {
      await api.put(`/users/${user._id}/follow`);
      // Optimistically update global following state
      const alreadyFollowing = followingIds.includes(targetUserId);
      if (!alreadyFollowing) {
        updateUser({ following: [...(currentUser?.following || []), user._id] });
      }
      showToast(`You are now following ${user.name || user.username}`);
      if (onFollowed) onFollowed(user._id);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || '';
      if (status === 403 && message.toLowerCase().includes('already follow')) {
        const alreadyFollowing = followingIds.includes(targetUserId);
        if (!alreadyFollowing) {
          updateUser({ following: [...(currentUser?.following || []), user._id] });
        }
        showToast(`You are already following ${user.name || user.username}`);
      } else {
        console.error(err);
        showToast('Failed to follow', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link 
      to={`/profile/${user.username}`}
      className={`flex items-start gap-3 group cursor-pointer rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-slate-50/50 p-3 transition-all duration-500 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/60 ${
        animateReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } dc-interact`}
      style={{ transitionDelay: `${index * 70}ms` }}
    >
      <img 
        src={user.profilePic || `https://i.pravatar.cc/150?u=${user.username}`} 
        alt={user.name} 
        className="w-11 h-11 rounded-full object-cover shadow-sm ring-2 ring-white group-hover:scale-105 group-hover:ring-blue-100 transition-all duration-300"
      />
      <div className="flex-1 overflow-hidden">
        <h4 className="text-sm font-semibold group-hover:text-primary transition-colors duration-200 truncate">{user.name || user.username}</h4>
        <p className="text-xs text-gray-500 line-clamp-1">@{user.username}</p>
        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{user.bio || 'Builds and ships products.'}</p>
        <p className="text-[11px] text-gray-600 mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/90 border border-gray-200 px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/80"></span>
          {mutualConnections} mutual {mutualConnections === 1 ? 'connection' : 'connections'}
        </p>
        <button 
          onClick={handleFollow}
          disabled={isFollowing || loading}
          className={`flex items-center justify-center gap-1.5 font-semibold text-[11px] mt-2 border rounded-full px-3 py-1.5 transition-all duration-300 active:scale-95 min-w-[92px] ${
            isFollowing 
              ? 'bg-primary text-white border-primary cursor-default shadow-sm'
              : 'text-gray-700 border-gray-300 hover:text-primary hover:border-blue-200 hover:shadow-sm bg-gradient-to-r from-white to-blue-50/70'
          } dc-interact`}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></span>
              Following
            </>
          ) : isFollowing ? (
            <><Check className="w-3 h-3" /> Following</>
          ) : (
            <><Plus className="w-3 h-3" /> Follow</>
          )}
        </button>
      </div>
    </Link>
  );
};

const RightSidebar = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [hoveredTag, setHoveredTag] = useState('');
  const [displayedTopics, setDisplayedTopics] = useState(() => shuffleArray(ALL_HASHTAGS).slice(0, 3));
  const [animateUsers, setAnimateUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        const filtered = res.data.filter(u => u._id !== currentUser?._id);
        setUsers(filtered.sort(() => 0.5 - Math.random()).slice(0, 3));
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [currentUser?._id]);

  useEffect(() => {
    setAnimateUsers(false);
    const timer = setTimeout(() => setAnimateUsers(true), 40);
    return () => clearTimeout(timer);
  }, [users.length]);

  const loadMoreTopics = () => {
    setDisplayedTopics(shuffleArray(ALL_HASHTAGS).slice(0, 3));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-6 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-highlight)]/20 to-[var(--color-secondary)]/10 blur-xl"></div>
        <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <UserPlus2 className="w-4 h-4 text-primary" />
          Who to follow
        </h3>
        <p className="text-xs text-gray-500 mb-2">People you may know in DevConnect.</p>
        <p className="text-[11px] text-teal-700/80 font-medium mb-4">Handpicked builders this week</p>
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.map((u, index) => (
              <SuggestedUser key={u._id} user={u} onFollowed={() => {}} index={index} animateReady={animateUsers} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">Loading suggestions...</p>
        )}
      </div>

      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 p-4 overflow-hidden [clip-path:inset(0_round_1rem)] isolate mb-1">
        <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Trending Topics
        </h3>
        <p className="text-xs text-gray-500 mb-3">Tap a tag to filter your feed.</p>
        <ul className="space-y-2">
          {displayedTopics.map((topic, idx) => (
            <li
              key={topic.tag} 
              className="text-sm transition-all duration-200"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <Link
                to={`/?tag=${encodeURIComponent(topic.tag.replace('#', ''))}`}
                onMouseEnter={() => setHoveredTag(topic.tag)}
                onMouseLeave={() => setHoveredTag('')}
                className="block rounded-xl border border-gray-100 bg-gray-50/70 p-2.5 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
              >
                <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <Hash className={`w-3.5 h-3.5 ${hoveredTag === topic.tag ? 'text-primary' : 'text-gray-500'} transition-colors`} />
                  {topic.tag.replace('#', '')}
                </span>
                <span className="text-xs text-gray-500">{topic.posts} posts</span>
              </Link>
            </li>
          ))}
        </ul>

        <button
          onClick={loadMoreTopics}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:bg-blue-50 rounded-xl py-2 transition-all duration-300 active:scale-95 border border-blue-100"
        >
          <Sparkles className="w-4 h-4" />
          <ChevronDown className="w-4 h-4" />
          Load more
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;
