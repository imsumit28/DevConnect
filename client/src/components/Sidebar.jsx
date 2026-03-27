import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { BadgeCheck, Users, Link2, Eye, MessageCircle, Sparkles } from 'lucide-react';
import { socketUrl } from '../utils/runtimeConfig';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (user?._id) {
      api.get('/users/me/profile')
        .then(res => setProfileData(res.data))
        .catch(err => console.error('Failed to load profile data', err));
        
      const socket = io(socketUrl);
      socket.on('profile_viewed', (newViewCount) => {
        setProfileData(prev => prev ? { ...prev, profileViews: newViewCount } : prev);
      });
      return () => socket.disconnect();
    }
  }, [user?._id]);

  const displayUser = {
    ...(profileData || user || {}),
    following: Array.isArray(user?.following) ? user.following : (profileData?.following || []),
    followers: Array.isArray(user?.followers) ? user.followers : (profileData?.followers || []),
  };
  const followersCount = Array.isArray(displayUser?.followers) ? displayUser.followers.length : 0;
  const followingCount = Array.isArray(displayUser?.following) ? displayUser.following.length : 0;
  const normalizedSkills = Array.isArray(displayUser?.skills)
    ? displayUser.skills
    : typeof displayUser?.skills === 'string'
      ? displayUser.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  const skillTags = normalizedSkills.length > 0
    ? normalizedSkills.slice(0, 4)
    : ['React', 'Node.js', 'MongoDB', 'Docker'];
  const roleLine = skillTags.length > 0
    ? `Full Stack Developer • ${skillTags.slice(0, 3).join(' • ')}`
    : 'Full Stack Developer • MERN • System Design';
  const valueStatement = displayUser?.bio || 'Building scalable web apps & real-time systems';
  const showOwnerHighlight = String(displayUser?.email || '').toLowerCase() === 'ersumitkumar45@gmail.com';

  return (
    <div className="relative w-full rounded-3xl border border-blue-100/80 overflow-hidden shadow-[0_18px_40px_rgba(7,49,101,0.14)] bg-white/90 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_rgba(7,49,101,0.18)] mb-6">
      <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-12 w-40 h-40 rounded-full bg-teal-200/25 blur-3xl" />

      <div className="relative h-24 sm:h-28 w-full bg-gradient-to-r from-slate-100 to-blue-100">
        {displayUser?.coverPic ? (
          <img
            src={displayUser.coverPic}
            alt="Cover"
            className="w-full h-full object-contain bg-gradient-to-r from-slate-100 to-blue-100"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a3b72] via-[#0b6bcb] to-[#16a085]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/30" />
      </div>
      
      <div className="relative px-4 sm:px-5 pb-5 sm:pb-6 -mt-11">
        <div className="relative w-max mx-auto">
          <img
            src={displayUser?.profilePic || `https://i.pravatar.cc/150?u=${displayUser?.username || 'guest'}`}
            alt="Profile"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white object-cover shadow-[0_10px_25px_rgba(8,65,126,0.28)] ring-2 ring-blue-100 transition-transform duration-300 hover:scale-105"
          />
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="Online" />
        </div>

        <div className="mt-3 text-center">
          <Link to="/profile" className="font-extrabold text-[1.05rem] sm:text-[1.2rem] tracking-tight text-gray-900 hover:text-primary transition-colors">
            {displayUser?.name || displayUser?.username || 'Sumit Kumar'}
          </Link>
          <p className="text-xs text-gray-600 mt-1 font-medium">{roleLine}</p>
          <p className="text-sm text-gray-600 mt-2 line-clamp-1">{valueStatement}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {skillTags.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-blue-100 text-blue-700 bg-blue-50/80"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="w-full mt-4 p-3.5 rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-primary mb-1">
                <Users className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Followers</p>
              <p className="text-sm font-extrabold text-gray-900">{followersCount.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 text-teal-600 mb-1">
                <Link2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Following</p>
              <p className="text-sm font-extrabold text-gray-900">{followingCount.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-50 text-orange-600 mb-1">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Views</p>
              <p className="text-sm font-extrabold text-gray-900">{(displayUser?.profileViews || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {showOwnerHighlight && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-800 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Built DevConnect platform
            </p>
          </div>
        )}

        <div className="mt-4">
          <Link
            to="/messages"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 bg-white hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Messages
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-center">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-primary text-[10px] font-semibold border border-blue-100">
            <BadgeCheck className="w-3 h-3" />
            Active on DevConnect
          </span>
        </div>

        <div className="mt-3">
          <Link
            to="/profile"
            className="block w-full text-center text-primary font-semibold hover:bg-blue-50 rounded-xl py-2 transition-colors border border-blue-200 bg-white text-sm"
          >
            View Full Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
