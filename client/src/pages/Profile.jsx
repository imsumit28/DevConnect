import React, { useState, useRef, useContext, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import PostInput from '../components/PostInput';
import { Plus, Edit2, Camera, Users, CheckCircle2, Circle, Award, Send, MessageSquare, MoreHorizontal, Clock, X, Pin, FileText, Crop, ZoomIn, MoveHorizontal, MoveVertical, RotateCcw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import { socketUrl } from '../utils/runtimeConfig';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { compressImageFile } from '../utils/imageCompression';

const Profile = () => {
  const { user: currentUser, updateUser } = useContext(AuthContext); 
  const { username } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profileUser, setProfileUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    skills: '',
    githubUsername: '',
  });
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    date: '',
    description: '',
  });
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [activityFilter, setActivityFilter] = useState('Posts');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  const [articlePosts, setArticlePosts] = useState([]);
  const [pinnedPost, setPinnedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [suggestedFollowLoading, setSuggestedFollowLoading] = useState({});
  const [isMediaActionOpen, setIsMediaActionOpen] = useState(false);
  const [mediaActionType, setMediaActionType] = useState('profile');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState('profile');
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropSourceFile, setCropSourceFile] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropImageMeta, setCropImageMeta] = useState({ width: 0, height: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [isCropDragging, setIsCropDragging] = useState(false);
  const cropDragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const chatEndRef = React.useRef(null);
  const getEntityId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value._id || String(value);
    return String(value);
  };

  const isArticlePost = (post) =>
    Boolean(post) &&
    (String(post?.postType || '').toLowerCase() === 'article' || Boolean(post?.articleTitle));
  const isEventPost = (post) =>
    Boolean(post) &&
    (String(post?.postType || '').toLowerCase() === 'event' || Boolean(post?.eventTitle) || Boolean(post?.eventDate));

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isOwnProfile = !username || (currentUser && username === currentUser.username);
  const displayUser = isOwnProfile ? currentUser : profileUser;

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [username]);

  useEffect(() => {
    const mergePostUpdate = (existingPost, incomingPost) => {
      if (!existingPost) return incomingPost;
      if (!incomingPost) return existingPost;
      const incomingId = incomingPost?._id ? String(incomingPost._id) : '';
      const existingOriginalId = existingPost?.originalPost?._id
        ? String(existingPost.originalPost._id)
        : (existingPost?.originalPost ? String(existingPost.originalPost) : '');
      const shouldRefreshOriginal = Boolean(incomingId && existingOriginalId && incomingId === existingOriginalId);

      return {
        ...existingPost,
        ...(shouldRefreshOriginal ? existingPost : incomingPost),
        userId: incomingPost.userId || existingPost.userId,
        originalPost: shouldRefreshOriginal
          ? {
              ...(typeof existingPost.originalPost === 'object' && existingPost.originalPost ? existingPost.originalPost : {}),
              ...incomingPost
            }
          : (incomingPost.originalPost || existingPost.originalPost),
        content: incomingPost.content ?? existingPost.content,
        image: incomingPost.image ?? existingPost.image,
        video: incomingPost.video ?? existingPost.video,
        comments: Array.isArray(incomingPost.comments) ? incomingPost.comments : existingPost.comments,
        likes: Array.isArray(incomingPost.likes) ? incomingPost.likes : existingPost.likes,
      };
    };

    const updatePostInList = (list, updatedPost) =>
      list.map((p) => {
        const postId = p?._id ? String(p._id) : '';
        const postOriginalId = p?.originalPost?._id
          ? String(p.originalPost._id)
          : (p?.originalPost ? String(p.originalPost) : '');
        const updatedId = updatedPost?._id ? String(updatedPost._id) : '';
        if (postId === updatedId || postOriginalId === updatedId) {
          return mergePostUpdate(p, updatedPost);
        }
        return p;
      });

    const socket = io(socketUrl);
    if (currentUser?._id) {
       socket.emit('join', currentUser._id);
    }

    socket.on('new_message', (msg) => {
      const senderId = getEntityId(msg.senderId);
      const receiverId = getEntityId(msg.receiverId);
      const activeUserId = getEntityId(displayUser?._id);
      if (senderId === activeUserId || receiverId === activeUserId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socket.on('postCreated', (newPost) => {
      const newPostUserId = getEntityId(newPost?.userId);
      const activeProfileUserId = getEntityId(displayUser?._id);
      if (newPostUserId && newPostUserId === activeProfileUserId) {
        setPosts(current => {
          if (current.find(p => p._id === newPost._id)) return current;
          return [newPost, ...current];
        });
        if (isArticlePost(newPost)) {
          setArticlePosts(current => {
            if (current.find(p => p._id === newPost._id)) return current;
            return [newPost, ...current];
          });
        }
      }
    });

    socket.on('postDeleted', (postId) => {
      setPosts(current => current.filter(p => p._id !== postId));
      setArticlePosts(current => current.filter(p => p._id !== postId));
      setLikedPosts(current => current.filter(p => p._id !== postId));
      setCommentedPosts(current => current.filter(p => p._id !== postId));
      setPinnedPost((current) => (current?._id === postId ? null : current));
    });

    socket.on('postUpdated', (updatedPost) => {
      setPosts((current) => updatePostInList(current, updatedPost));
      setArticlePosts((current) => updatePostInList(current, updatedPost));
      setLikedPosts((current) => updatePostInList(current, updatedPost));
      setCommentedPosts((current) => updatePostInList(current, updatedPost));
      setPinnedPost((current) => (current?._id === updatedPost?._id ? mergePostUpdate(current, updatedPost) : current));
    });

    return () => socket.disconnect();
  }, [currentUser?._id, displayUser?._id]);

  const formatUsername = (name) => name?.toLowerCase().replace(/\s+/g, '_') || '';
  const displayedUsername = formatUsername(displayUser?.username || username);

  // Profile Strength Calculation
  const getProfileStrength = () => {
    let score = 0;
    const requirements = [
      { label: 'Add bio', completed: !!displayUser?.bio, weight: 25 },
      { label: 'Add skills', completed: displayUser?.skills?.length > 0, weight: 25 },
      { label: 'Add profile pic', completed: !!displayUser?.profilePic && !displayUser?.profilePic?.includes('anonymous-avatar') && !displayUser?.profilePic?.includes('avatar_'), weight: 25 },
      { label: 'Add cover photo', completed: !!displayUser?.coverPic, weight: 25 },
    ];
    
    score = requirements.reduce((acc, req) => acc + (req.completed ? req.weight : 0), 0);
    return { score, requirements };
  };

  const { score: profileScore, requirements: profileReqs } = getProfileStrength();

  // Fetch profile user data & trigger view count
  useEffect(() => {
    if (!isOwnProfile && username) {
      setLoading(true);
      api.get(`/users/${username}`)
        .then(res => {
          setProfileUser(res.data);
          // Only trigger view count increment if it's someone else's profile
          if (currentUser && currentUser.username !== res.data.username) {
            api.put(`/users/${res.data.username}/view`).catch(err => console.error("Could not record view", err));
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else if (isOwnProfile && currentUser?._id) {
      // Fetch fresh data for own profile (with populated followers/following)
      api.get('/users/me/profile')
        .then(res => {
          setProfileUser(res.data);
          // Sync local user data
          updateUser(res.data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [username, isOwnProfile, currentUser?._id]);

  // Use profileUser for display (always populated with fresh data)
  const fullDisplayUser = profileUser || displayUser;
  const fullDisplayUserId = fullDisplayUser?._id ? String(fullDisplayUser._id) : '';
  const resolvedCoverPic = resolveMediaUrl(fullDisplayUser?.coverPic || '');
  const resolvedProfilePic = resolveMediaUrl(fullDisplayUser?.profilePic || '');

  // If user reposts their own post, keep a single card in Profile:
  // hide the repost duplicate and mark the original post as reposted.
  const selfRepostedOriginalIds = new Set(
    (posts || [])
      .filter((post) => {
        if (!post?.isRepost) return false;
        const postOwnerId = post?.userId?._id || post?.userId;
        if (!postOwnerId || String(postOwnerId) !== fullDisplayUserId) return false;
        const originalOwnerId = post?.originalPost?.userId?._id || post?.originalPost?.userId;
        return Boolean(originalOwnerId && String(originalOwnerId) === fullDisplayUserId);
      })
      .map((post) => post?.originalPost?._id || post?.originalPost)
      .filter(Boolean)
      .map((id) => String(id))
  );

  const visiblePosts = (posts || []).filter((post) => {
    if (!isOwnProfile || !post?.isRepost) return true;
    const originalOwnerId = post?.originalPost?.userId?._id || post?.originalPost?.userId;
    return !(originalOwnerId && String(originalOwnerId) === fullDisplayUserId);
  });
  const computedArticlePosts = useMemo(
    () => ((articlePosts && articlePosts.length > 0) ? articlePosts : (posts || []).filter(isArticlePost)),
    [articlePosts, posts]
  );
  const computedEventPosts = useMemo(
    () => (posts || []).filter(isEventPost),
    [posts]
  );

  // Fetch posts for the displayed user
  useEffect(() => {
    if (fullDisplayUser?._id) {
      api.get(`/posts/user/${fullDisplayUser._id}?type=posts`)
        .then(res => setPosts(res.data))
        .catch(err => console.error("Failed to fetch user posts", err));
    }
  }, [fullDisplayUser?._id]);

  // Keep article feed in sync with the live post list
  useEffect(() => {
    setArticlePosts((posts || []).filter(isArticlePost));
  }, [posts]);

  // Fetch liked/commented posts
  useEffect(() => {
    if (fullDisplayUser?._id) {
      api.get(`/users/${fullDisplayUser._id}/activity?type=likes`)
        .then(res => setLikedPosts(res.data))
        .catch(err => console.error("Failed to fetch liked posts", err));

      api.get(`/users/${fullDisplayUser._id}/activity?type=comments`)
        .then(res => setCommentedPosts(res.data))
        .catch(err => console.error("Failed to fetch commented posts", err));

      // Fetch pinned post
      api.get(`/posts/pinned/${fullDisplayUser._id}`)
        .then(res => { if (res.data) setPinnedPost(res.data); })
        .catch(err => console.error("Failed to fetch pinned post", err));
    }
  }, [fullDisplayUser?._id]);

  // GitHub repos
  useEffect(() => {
    const ghUser = fullDisplayUser?.githubUsername;
    if (ghUser) {
      fetch(`https://api.github.com/users/${ghUser}/repos?sort=updated&per_page=3`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setGithubRepos(data);
        })
        .catch(err => console.error("Failed to fetch github repos", err));
    } else {
      setGithubRepos([]);
    }
  }, [fullDisplayUser?.githubUsername]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        const filtered = res.data.filter(u => u._id !== currentUser?._id && u.username !== username);
        setSuggestedUsers(filtered.sort(() => 0.5 - Math.random()).slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch suggested users", err);
      }
    };
    fetchUsers();
  }, [username, currentUser]);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    openCropModal(file, 'profile');
  };

  const handleCoverPicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
    openCropModal(file, 'cover');
  };

  const openCropModal = (file, target) => {
    const previewUrl = URL.createObjectURL(file);
    setCropSourceFile(file);
    setCropImageSrc(previewUrl);
    setCropTarget(target);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setCropImageMeta({ width: 0, height: 0 });
    setIsCropModalOpen(true);
    setIsMediaActionOpen(false);
  };

  const closeCropModal = () => {
    if (cropImageSrc && cropImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setIsCropModalOpen(false);
    setCropImageSrc('');
    setCropSourceFile(null);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setCropImageMeta({ width: 0, height: 0 });
  };

  const uploadImageForTarget = async (file, target) => {
    setUploading(true);
    try {
      const compressedImage = await compressImageFile(file, {
        maxWidth: target === 'cover' ? 1500 : 900,
        maxHeight: target === 'cover' ? 900 : 900,
        quality: 0.84,
      });

      const formData = new FormData();
      formData.append('image', compressedImage);
      
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const payload = target === 'cover'
        ? { coverPic: uploadRes.data.url }
        : { profilePic: uploadRes.data.url };

      const updateRes = await api.put('/users/profile', payload);
      const updatedUser = updateRes.data;
      updateUser(updatedUser);
      setProfileUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
      showToast(target === 'cover' ? 'Cover photo updated!' : 'Profile picture updated!');
    } catch (error) {
      console.error('Failed to update image', error);
      showToast(`Failed to update ${target === 'cover' ? 'cover photo' : 'profile picture'}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const getCroppedImageBlob = async () => {
    if (!cropImageSrc || !cropImageMeta.width || !cropImageMeta.height) return null;

    const aspect = cropTarget === 'cover' ? 3 : 1;
    const outputWidth = cropTarget === 'cover' ? 1500 : 600;
    const outputHeight = cropTarget === 'cover' ? 500 : 600;
    const imgW = cropImageMeta.width;
    const imgH = cropImageMeta.height;

    const safeZoom = Math.max(1, Number(cropZoom) || 1);

    const sourceImage = new Image();
    sourceImage.src = cropImageSrc;
    await new Promise((resolve, reject) => {
      sourceImage.onload = resolve;
      sourceImage.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (cropTarget === 'cover') {
      // Cover editor should show full image by default (no auto-crop). Use contain-fit on canvas.
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const fitScale = Math.min(outputWidth / imgW, outputHeight / imgH);
      const renderW = imgW * fitScale * safeZoom;
      const renderH = imgH * fitScale * safeZoom;

      const overflowX = Math.max(0, (renderW - outputWidth) / 2);
      const overflowY = Math.max(0, (renderH - outputHeight) / 2);
      const drawX = (outputWidth - renderW) / 2 - (cropX / 100) * overflowX;
      const drawY = (outputHeight - renderH) / 2 - (cropY / 100) * overflowY;

      ctx.drawImage(sourceImage, drawX, drawY, renderW, renderH);
    } else {
      const imageRatio = imgW / imgH;
      let baseCropW = imgW;
      let baseCropH = imgH;

      if (imageRatio > aspect) {
        baseCropW = imgH * aspect;
        baseCropH = imgH;
      } else {
        baseCropW = imgW;
        baseCropH = imgW / aspect;
      }

      const cropW = baseCropW / safeZoom;
      const cropH = baseCropH / safeZoom;
      const centerX = (imgW - cropW) / 2;
      const centerY = (imgH - cropH) / 2;
      const maxPanX = (imgW - cropW) / 2;
      const maxPanY = (imgH - cropH) / 2;
      const sourceX = Math.min(Math.max(centerX + (cropX / 100) * maxPanX, 0), imgW - cropW);
      const sourceY = Math.min(Math.max(centerY + (cropY / 100) * maxPanY, 0), imgH - cropH);

      ctx.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        cropW,
        cropH,
        0,
        0,
        outputWidth,
        outputHeight
      );
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.88);
    });
  };

  const handleCropSave = async () => {
    if (!cropSourceFile) return;
    setIsCropping(true);
    try {
      const blob = await getCroppedImageBlob();
      if (!blob) {
        showToast('Failed to crop image', 'error');
        return;
      }

      const croppedFile = new File(
        [blob],
        `${cropTarget}-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );
      await uploadImageForTarget(croppedFile, cropTarget);
      closeCropModal();
    } catch (error) {
      console.error('Crop save failed', error);
      showToast('Failed to save cropped image', 'error');
    } finally {
      setIsCropping(false);
    }
  };

  const handleCropReset = () => {
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
  };

  const clampCropPan = (value) => Math.max(-100, Math.min(100, value));

  const handleCropPointerDown = (e) => {
    cropDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: cropX,
      originY: cropY,
    };
    setIsCropDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleCropPointerMove = (e) => {
    if (!cropDragRef.current.active) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dx = e.clientX - cropDragRef.current.startX;
    const dy = e.clientY - cropDragRef.current.startY;
    const nextX = cropDragRef.current.originX + (dx / rect.width) * 200;
    const nextY = cropDragRef.current.originY + (dy / rect.height) * 200;

    setCropX(clampCropPan(nextX));
    setCropY(clampCropPan(nextY));
  };

  const handleCropPointerUp = (e) => {
    cropDragRef.current.active = false;
    setIsCropDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const openFullImageByType = (type) => {
    const profileFallback = `https://i.pravatar.cc/150?u=${displayedUsername || 'developer'}`;
    const selectedUrl =
      type === 'cover'
        ? resolvedCoverPic || ''
        : resolvedProfilePic || profileFallback;

    if (!selectedUrl) {
      showToast('No image available to preview', 'error');
      return;
    }

    setViewerImageUrl(selectedUrl);
    setViewerTitle(type === 'cover' ? 'Cover Photo' : 'Profile Photo');
    setIsImageViewerOpen(true);
  };

  const openMediaActions = (type) => {
    setMediaActionType(type);
    setIsMediaActionOpen(true);
  };

  const handleShowFullImage = () => {
    openFullImageByType(mediaActionType);
    setIsMediaActionOpen(false);
  };

  const handleUpdateImage = () => {
    if (!isOwnProfile) return;
    setIsMediaActionOpen(false);
    if (mediaActionType === 'cover') {
      coverInputRef.current?.click();
      return;
    }
    fileInputRef.current?.click();
  };

  // Open edit modal with current data
  const openEditModal = () => {
    setEditForm({
      name: fullDisplayUser?.name || '',
      bio: fullDisplayUser?.bio || '',
      skills: (fullDisplayUser?.skills || []).join(', '),
      githubUsername: fullDisplayUser?.githubUsername || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const skillsArray = editForm.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const updateRes = await api.put('/users/profile', {
        name: editForm.name,
        bio: editForm.bio,
        skills: skillsArray,
        githubUsername: editForm.githubUsername,
      });
      const updatedUser = updateRes.data;
      updateUser(updatedUser);
      setProfileUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
      setIsEditModalOpen(false);
      showToast('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      showToast('Failed to update profile. Try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFollow = async () => {
    try {
      await api.put(`/users/${fullDisplayUser._id}/follow`);
      setProfileUser(prev => ({
        ...prev,
        followers: [...(prev.followers || []), currentUser._id]
      }));
      showToast(`You are now following ${fullDisplayUser.username}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfollow = async () => {
    try {
      await api.put(`/users/${fullDisplayUser._id}/unfollow`);
      setProfileUser(prev => ({
        ...prev,
        followers: (prev.followers || []).filter(id => {
          const fId = typeof id === 'string' ? id : id._id;
          return fId !== currentUser._id;
        })
      }));
      showToast(`Unfollowed ${fullDisplayUser.username}`);
    } catch (err) {
      console.error(err);
    }
  };

  const isFollowing = profileUser?.followers?.some(f => 
    (typeof f === 'string' ? f : f._id) === currentUser?._id
  );

  const isSuggestedUserFollowing = (userId) =>
    (currentUser?.following || []).some((f) => (typeof f === 'string' ? f : f?._id) === userId);

  const handleSuggestedFollow = async (e, suggestedUser) => {
    e.preventDefault();
    e.stopPropagation();
    const suggestedId = suggestedUser?._id;
    if (!suggestedId || isSuggestedUserFollowing(suggestedId) || suggestedFollowLoading[suggestedId]) return;

    setSuggestedFollowLoading((prev) => ({ ...prev, [suggestedId]: true }));
    try {
      await api.put(`/users/${suggestedId}/follow`);
      const currentFollowing = currentUser?.following || [];
      const alreadyThere = currentFollowing.some((f) => (typeof f === 'string' ? f : f?._id) === suggestedId);
      if (!alreadyThere) {
        updateUser({ following: [...currentFollowing, suggestedId] });
      }
      showToast(`You are now following ${suggestedUser.name || suggestedUser.username}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to follow user', 'error');
    } finally {
      setSuggestedFollowLoading((prev) => ({ ...prev, [suggestedId]: false }));
    }
  };

  // Real counts (use live auth state for own profile so follow/unfollow updates instantly)
  const countSourceUser = isOwnProfile ? currentUser : fullDisplayUser;
  const followersCount = countSourceUser?.followers?.length || 0;
  const followingCount = countSourceUser?.following?.length || 0;
  const showDevConnectFounderBadge = String(fullDisplayUser?.email || '').toLowerCase() === 'ersumitkumar45@gmail.com';
  const profileProjects = Array.isArray(fullDisplayUser?.projects) ? fullDisplayUser.projects : [];

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    const title = String(projectForm.title || '').trim();
    const date = String(projectForm.date || '').trim();
    const description = String(projectForm.description || '').trim();

    if (!title) {
      showToast('Project title is required', 'error');
      return;
    }

    setIsSavingProject(true);
    try {
      const res = await api.post('/users/projects', { title, date, description });
      const updatedProjects = Array.isArray(res.data?.projects) ? res.data.projects : [];
      const nextData = { ...(fullDisplayUser || {}), projects: updatedProjects };
      setProfileUser(nextData);
      updateUser({ projects: updatedProjects });
      setProjectForm({ title: '', date: '', description: '' });
      setIsProjectModalOpen(false);
      showToast('Project added successfully');
    } catch (error) {
      console.error('Failed to add project', error);
      showToast('Failed to add project', 'error');
    } finally {
      setIsSavingProject(false);
    }
  };

  const toggleChat = async () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      try {
        const res = await api.get(`/messages/${fullDisplayUser._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await api.post('/messages', {
        receiverId: fullDisplayUser._id,
        text: newMessage
      });
      setMessages([...messages, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error("Message send failed", err);
    }
  };

  // Get the cover image style
  const coverStyle = resolvedCoverPic
    ? { backgroundImage: `url(${resolvedCoverPic})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundImage: 'linear-gradient(to right, #0A66C2, #4db8ff)' };

  return (
    <div className="bg-background min-h-screen pt-28 md:pt-20 pb-10">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-3 sm:px-4 mt-4 flex flex-col gap-4 animate-fade-in">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
          {/* Cover */}
          <div
            className="h-32 sm:h-40 md:h-48 w-full relative cursor-pointer group"
            style={coverStyle}
            onClick={() => (isOwnProfile ? openMediaActions('cover') : openFullImageByType('cover'))}
            title="Cover photo options"
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            <div className="absolute inset-x-0 top-0 z-30 p-3 flex justify-end pointer-events-none">
              {isOwnProfile ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openMediaActions('cover');
                  }}
                  className="pointer-events-auto h-10 w-10 bg-white/95 backdrop-blur-sm text-primary rounded-full shadow-lg hover:bg-white transition-all border border-gray-200 flex items-center justify-center"
                  title="Edit cover photo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFullImageByType('cover');
                  }}
                  className="pointer-events-auto bg-white/95 backdrop-blur-sm text-primary rounded-full shadow-lg hover:bg-white transition-all border border-gray-200 px-4 py-2 text-xs font-semibold"
                  title="View cover image"
                >
                  View cover image
                </button>
              )}
            </div>
            {isOwnProfile && (
              <input
                type="file"
                accept="image/*"
                ref={coverInputRef}
                className="hidden"
                onChange={handleCoverPicChange}
              />
            )}
          </div>
          
          <div className="px-4 sm:px-6 pb-6 -mt-14 sm:-mt-20 relative">
            <div
              className="relative inline-block group cursor-pointer"
              onClick={() => openMediaActions('profile')}
              title="Profile photo options"
            >
              <img 
                src={resolvedProfilePic || `https://i.pravatar.cc/150?u=${displayedUsername}`} 
                alt="Profile" 
                className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white object-cover bg-white hover:scale-105 transition-transform duration-300 shadow-lg ${uploading ? 'opacity-50' : ''}`}
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-4 border-transparent">
                <Camera className="w-7 h-7 text-white mb-1" />
                <span className="text-white text-xs font-medium">{isOwnProfile ? 'View / Update' : 'Show full image'}</span>
              </div>
              {isOwnProfile && (
                <>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleProfilePicChange} 
                  />
                </>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mt-4 gap-6">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{fullDisplayUser?.name || fullDisplayUser?.username || "Loading..."}</h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">@{displayedUsername}</p>
                <p className="text-base sm:text-lg text-gray-700 font-medium mt-2 leading-relaxed">{fullDisplayUser?.bio || "Software Developer & Tech Enthusiast"}</p>
                {showDevConnectFounderBadge && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 px-3 py-2 shadow-sm">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Award className="w-4 h-4" />
                    </span>
                    <div className="text-left leading-tight">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">Founder Highlight</p>
                      <p className="text-sm font-semibold text-amber-900">Original builder of DevConnect</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                  <span className="text-sm text-primary font-semibold hover:underline cursor-pointer">Contact info</span>
                  <div className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline cursor-pointer">
                    <Users className="w-4 h-4" /> {followersCount.toLocaleString()} followers • {followingCount.toLocaleString()} following
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                {isOwnProfile ? (
                  <button 
                    onClick={openEditModal}
                    className="bg-primary text-white font-semibold flex items-center justify-center gap-1 px-5 py-2 rounded-full hover:bg-blue-700 transition-colors w-full sm:w-auto whitespace-nowrap"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    {isFollowing ? (
                      <button 
                        onClick={handleUnfollow}
                        className="border-2 border-primary text-primary font-semibold flex items-center justify-center gap-2 px-6 py-2.5 rounded-full hover:bg-blue-50 transition-all w-full sm:w-auto"
                      >
                        Following
                      </button>
                    ) : (
                      <button 
                        onClick={handleFollow}
                        className="bg-primary text-white font-semibold flex items-center justify-center gap-2 px-6 py-2.5 rounded-full hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all w-full sm:w-auto"
                      >
                        <Plus className="w-5 h-5 -ml-1" />
                        Follow
                      </button>
                    )}
                    <button 
                      onClick={toggleChat}
                      className="border-2 border-primary text-primary font-semibold flex items-center justify-center gap-2 px-6 py-2.5 rounded-full hover:bg-blue-50 active:scale-95 transition-all w-full sm:w-auto"
                    >
                      <Send className="w-4 h-4" />
                      Message
                    </button>
                    <button className="border-2 border-gray-200 text-gray-500 font-semibold p-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Skills Tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              {(fullDisplayUser?.skills && fullDisplayUser.skills.length > 0
                ? fullDisplayUser.skills 
                : ['React', 'Node.js', 'MongoDB', 'Express', 'TailwindCSS']
              ).map((skill, index) => (
                <span key={index} className="bg-blue-50 text-[#0A66C2] font-medium border border-blue-200 text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs and Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="md:col-span-2 flex flex-col gap-4">
            
            {/* About Section */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8 hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {fullDisplayUser?.bio || "Aspiring Full Stack Developer skilled in MERN stack.\nCurrently building real-world projects and improving problem-solving skills."}
              </p>
            </div>

            {/* Projects Section */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Project
                  </button>
                )}
              </div>

              {profileProjects.length > 0 ? (
                <div className="space-y-4">
                  {profileProjects.map((project, index) => (
                    <div
                      key={project?._id || `${project?.title || 'project'}-${index}`}
                      className={index !== profileProjects.length - 1 ? 'border-b border-gray-100 pb-4' : ''}
                    >
                      <h3 className="text-lg font-semibold text-gray-800">{project?.title || 'Untitled project'}</h3>
                      {project?.date && <p className="text-sm text-gray-500 mb-2">{project.date}</p>}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {project?.description || 'No project details were added yet.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  No projects yet. Build something awesome and add it here.
                </div>
              )}
            </div>

            {/* GitHub Repositories Section */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8 hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">GitHub Repositories</span>
                {fullDisplayUser?.githubUsername && (
                  <a href={`https://github.com/${fullDisplayUser.githubUsername}`} target="_blank" rel="noreferrer" className="text-sm font-normal text-primary hover:underline">
                    @{fullDisplayUser.githubUsername}
                  </a>
                )}
              </h2>
              {githubRepos.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {githubRepos.map(repo => (
                    <div key={repo.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-primary font-semibold text-lg hover:underline">
                        {repo.name}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">{repo.description || 'No description available'}</p>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> {repo.language || 'Code'}</span>
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🍴 {repo.forks_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {fullDisplayUser?.githubUsername 
                    ? 'Loading repositories...' 
                    : 'No GitHub username set. Edit your profile to link your GitHub account.'}
                </p>
              )}
            </div>

            {/* Activity / Posts */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mt-2">
                <h2 className="text-xl font-bold text-gray-900">Activity</h2>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {['Posts', 'Articles', 'Events', 'Comments', 'Likes'].map(filter => (
                  <button 
                    key={filter}
                    onClick={() => setActivityFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activityFilter === filter ? 'bg-green-700 text-white' : 'border border-gray-400 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {isOwnProfile && <PostInput />}

              {/* Pinned Post */}
              {pinnedPost && (
                <div className="mb-2">
                  <PostCard
                    postId={pinnedPost._id}
                    user={{
                      name: pinnedPost.userId?.name || pinnedPost.userId?.username,
                      username: pinnedPost.userId?.username,
                      profilePic: pinnedPost.userId?.profilePic
                    }}
                    content={pinnedPost.content}
                    image={pinnedPost.image}
                    video={pinnedPost.video}
                    likesList={pinnedPost.likes}
                    commentsList={pinnedPost.comments}
                    time={pinnedPost.createdAt}
                    postType={pinnedPost.postType}
                    articleTitle={pinnedPost.articleTitle}
                    eventTitle={pinnedPost.eventTitle}
                    eventDate={pinnedPost.eventDate}
                    codeSnippet={pinnedPost.codeSnippet}
                    codeLanguage={pinnedPost.codeLanguage}
                    codeTitle={pinnedPost.codeTitle}
                    isPinnedDisplay={true}
                  />
                </div>
              )}
              
              {activityFilter === 'Posts' && (
                loading ? (
                  <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                ) : visiblePosts.length > 0 ? (
                    visiblePosts.map(post => (
                      <div key={post._id} className="relative">
                        <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 bg-gray-50/50 rounded-t-xl border-x border-t border-gray-100 italic">
                          <Clock className="w-3 h-3" />
                          {post.userId?._id === fullDisplayUser?._id ? (
                            <span>{fullDisplayUser?.name || fullDisplayUser?.username} posted an update</span>
                          ) : (
                            <span>{fullDisplayUser?.name || fullDisplayUser?.username} interacting with other posts</span>
                          )}
                        </div>
                        <PostCard
                          postId={post._id}
                          user={{
                            name: post.userId?.name || post.userId?.username,
                            username: post.userId?.username,
                            profilePic: post.userId?.profilePic
                          }}
                          content={post.content}
                          image={post.image}
                          video={post.video}
                          likesList={post.likes}
                          commentsList={post.comments}
                          time={post.createdAt}
                          isActivity={post.isActivity}
                          activityType={post.activityType}
                          postType={post.postType}
                          articleTitle={post.articleTitle}
                          eventTitle={post.eventTitle}
                          eventDate={post.eventDate}
                          codeSnippet={post.codeSnippet}
                          codeLanguage={post.codeLanguage}
                          codeTitle={post.codeTitle}
                          isRepost={post.isRepost}
                          originalPost={post.originalPost}
                          alreadyReposted={
                            (Boolean(post?.isRepost) && String(post?.userId?._id || post?.userId || '') === String(currentUser?._id || currentUser?.id || '')) ||
                            selfRepostedOriginalIds.has(String(post._id))
                          }
                        />
                      </div>
                    ))
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                    No posts to show yet.
                  </div>
                )
              )}
              {activityFilter === 'Comments' && (
                commentedPosts.length > 0 ? (
                  commentedPosts.map(post => (
                    <div key={post._id} className="relative">
                      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 bg-gray-50/50 rounded-t-xl border-x border-t border-gray-100 italic">
                        <MessageSquare className="w-3 h-3" />
                        <span>{fullDisplayUser?.name || fullDisplayUser?.username} commented on this</span>
                      </div>
                      <PostCard
                        postId={post._id}
                        user={{
                          name: post.userId?.name || post.userId?.username,
                          username: post.userId?.username,
                          profilePic: post.userId?.profilePic
                        }}
                        content={post.content}
                        image={post.image}
                        likesList={post.likes}
                        commentsList={post.comments}
                        time={post.createdAt}
                      />
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                    No commented posts yet.
                  </div>
                )
              )}
              {activityFilter === 'Likes' && (
                likedPosts.length > 0 ? (
                  likedPosts.map(post => (
                    <div key={post._id} className="relative">
                      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 bg-gray-50/50 rounded-t-xl border-x border-t border-gray-100 italic">
                        <span>❤️</span>
                        <span>{fullDisplayUser?.name || fullDisplayUser?.username} liked this</span>
                      </div>
                      <PostCard
                        postId={post._id}
                        user={{
                          name: post.userId?.name || post.userId?.username,
                          username: post.userId?.username,
                          profilePic: post.userId?.profilePic
                        }}
                        content={post.content}
                        image={post.image}
                        likesList={post.likes}
                        commentsList={post.comments}
                        time={post.createdAt}
                      />
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                    No liked posts yet.
                  </div>
                )
              )}
              {activityFilter === 'Articles' && (
                computedArticlePosts.length > 0 ? (
                  computedArticlePosts.map(post => (
                    <div key={post._id} className="relative">
                      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 bg-gray-50/50 rounded-t-xl border-x border-t border-gray-100 italic">
                        <FileText className="w-3 h-3" />
                        <span>{fullDisplayUser?.name || fullDisplayUser?.username} published an article</span>
                      </div>
                      <PostCard
                        postId={post._id}
                        user={{
                          name: post.userId?.name || post.userId?.username,
                          username: post.userId?.username,
                          profilePic: post.userId?.profilePic
                        }}
                        content={post.content}
                        image={post.image}
                        video={post.video}
                        likesList={post.likes}
                        commentsList={post.comments}
                        time={post.createdAt}
                        postType={post.postType}
                        articleTitle={post.articleTitle}
                      />
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                    No articles published yet.
                  </div>
                )
              )}
              {activityFilter === 'Events' && (
                computedEventPosts.length > 0 ? (
                  computedEventPosts.map(post => (
                    <div key={post._id} className="relative">
                      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 bg-gray-50/50 rounded-t-xl border-x border-t border-gray-100 italic">
                        <Clock className="w-3 h-3" />
                        <span>{fullDisplayUser?.name || fullDisplayUser?.username} created an event</span>
                      </div>
                      <PostCard
                        postId={post._id}
                        user={{
                          name: post.userId?.name || post.userId?.username,
                          username: post.userId?.username,
                          profilePic: post.userId?.profilePic
                        }}
                        content={post.content}
                        image={post.image}
                        video={post.video}
                        likesList={post.likes}
                        commentsList={post.comments}
                        time={post.createdAt}
                        postType={post.postType}
                        eventTitle={post.eventTitle}
                        eventDate={post.eventDate}
                      />
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                    No events created yet.
                  </div>
                )
              )}
            </div>
          </div>

          <div className="md:col-span-1 flex flex-col gap-4">
            
            {/* Profile Strength Meter */}
            {isOwnProfile && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-gray-800">Profile Strength: {profileScore}%</h3>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-1000" 
                    style={{ width: `${profileScore}%` }}
                  ></div>
                </div>
                
                <div className="space-y-3">
                  {profileReqs.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className={`text-sm ${req.completed ? 'text-gray-500 line-through' : 'text-gray-800 font-medium'}`}>
                        {req.label}
                      </span>
                      {req.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:sticky md:top-20 hover:shadow-xl transition-all duration-300 mt-0 md:mt-4">
              <h3 className="font-semibold text-gray-800 mb-4">People also viewed</h3>
              {suggestedUsers.length > 0 ? suggestedUsers.map((sUser, idx) => (
                <Link
                  to={`/profile/${sUser.username}`} 
                  key={sUser._id} 
                  className="flex items-start gap-2 mb-4 group cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1 transition-all duration-300 transform-gpu hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.985]"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <img src={sUser.profilePic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} alt={sUser.username} className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <div>
                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors truncate w-32">{sUser.name || sUser.username}</h4>
                    <p className="text-[10px] text-gray-500">@{sUser.username}</p>
                    <p className="text-[10px] text-gray-500 truncate w-32">{sUser.bio || 'Software Engineer'}</p>
                    <button
                      onClick={(e) => handleSuggestedFollow(e, sUser)}
                      disabled={isSuggestedUserFollowing(sUser._id) || suggestedFollowLoading[sUser._id]}
                      className={`font-semibold text-xs mt-1.5 border rounded-full px-4 py-1 transition-all flex items-center gap-1 ${
                        isSuggestedUserFollowing(sUser._id)
                          ? 'bg-primary text-white border-primary cursor-default'
                          : 'text-gray-600 border-gray-500 hover:bg-gray-100'
                      } ${suggestedFollowLoading[sUser._id] ? 'opacity-70' : ''}`}
                    >
                      {isSuggestedUserFollowing(sUser._id) ? <CheckCircle2 className="w-3 h-3 -ml-0.5" /> : <Plus className="w-3 h-3 -ml-0.5" />}
                      {isSuggestedUserFollowing(sUser._id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </Link>
              )) : (
                <p className="text-sm text-gray-500">No suggestions yet.</p>
              )}
            </div>
          </div>
          
        </div>

      </main>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsEditModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Your full name"
                />
              </div>

              {/* Bio / About */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio / About</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  rows={4}
                  placeholder="Tell people about yourself..."
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Skills</label>
                <input
                  type="text"
                  value={editForm.skills}
                  onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="React, Node.js, MongoDB (comma separated)"
                />
                <p className="text-xs text-gray-400 mt-1">Separate skills with commas</p>
              </div>

              {/* GitHub Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">GitHub Username</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                  <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-500 border-r border-gray-300">github.com/</span>
                  <input
                    type="text"
                    value={editForm.githubUsername}
                    onChange={(e) => setEditForm(prev => ({ ...prev, githubUsername: e.target.value }))}
                    className="flex-1 px-3 py-2.5 text-sm outline-none"
                    placeholder="your-username"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="border border-gray-400 text-gray-600 font-semibold px-5 py-2 rounded-full hover:bg-gray-100 transition-colors"
               >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="bg-primary text-white font-semibold px-6 py-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[205] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsProjectModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Project</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProjectSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project title</label>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="e.g. DevConnect Realtime Chat"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                <input
                  type="text"
                  value={projectForm.date}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Jan 2026 - Present"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  rows={4}
                  placeholder="What did you build, and what impact did it create?"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="border border-gray-400 text-gray-600 font-semibold px-5 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="bg-primary text-white font-semibold px-6 py-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {isSavingProject ? 'Adding...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMediaActionOpen && (
        <div className="fixed inset-0 z-[220] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4" onClick={() => setIsMediaActionOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {mediaActionType === 'cover' ? 'Cover Photo' : 'Profile Photo'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Choose an action</p>
              </div>
              <button
                onClick={() => setIsMediaActionOpen(false)}
                className="h-8 w-8 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <button
                onClick={handleShowFullImage}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                Show full image
              </button>
              {isOwnProfile && (
                <button
                  onClick={handleUpdateImage}
                  className="w-full rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors text-left"
                >
                  Update photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isCropModalOpen && (
        <div className="fixed inset-0 z-[240] bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden" onClick={closeCropModal}>
          <div className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl border border-blue-100 shadow-[0_24px_60px_rgba(13,42,83,0.35)] overflow-y-auto overflow-x-hidden max-h-[96vh] sm:max-h-[92vh] animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-blue-100/70 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <span className="h-9 w-9 rounded-xl bg-white border border-blue-100 text-primary inline-flex items-center justify-center shadow-sm">
                  <Crop className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Edit {cropTarget === 'cover' ? 'Cover Photo' : 'Profile Photo'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Drag image, adjust sliders, then save crop</p>
                </div>
              </div>
              <button
                onClick={closeCropModal}
                className="h-8 w-8 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 sm:p-5">
              <div className="bg-gradient-to-b from-slate-100 to-slate-200/70 rounded-2xl p-2.5 sm:p-4 border border-slate-300">
                <div
                  onPointerDown={handleCropPointerDown}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerUp}
                  onPointerLeave={handleCropPointerUp}
                  onPointerCancel={handleCropPointerUp}
                  className={`relative mx-auto overflow-hidden bg-gray-200 border border-slate-400/70 select-none touch-none shadow-inner ${isCropDragging ? 'cursor-grabbing' : 'cursor-grab'} ${cropTarget === 'cover' ? 'w-full max-w-[680px] aspect-[3/1] rounded-2xl' : 'w-[min(72vw,18rem)] h-[min(72vw,18rem)] rounded-full'}`}
                >
                  {cropImageSrc && (
                    <img
                      src={cropImageSrc}
                      alt="Crop preview"
                      onLoad={(e) => {
                        setCropImageMeta({
                          width: e.currentTarget.naturalWidth,
                          height: e.currentTarget.naturalHeight,
                        });
                      }}
                      className={`absolute inset-0 w-full h-full select-none pointer-events-none ${cropTarget === 'cover' ? 'object-contain' : 'object-cover'}`}
                      draggable={false}
                      style={{
                        transform: `translate(${cropX}%, ${cropY}%) scale(${cropZoom})`,
                        transformOrigin: 'center center',
                      }}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 border border-white/40 rounded-inherit"></div>
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:33.33%_33.33%]"></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    {cropTarget === 'cover' ? 'Cover ratio 3:1' : 'Profile ratio 1:1'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCropReset}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-sm font-medium text-gray-700 rounded-xl border border-gray-200 bg-white p-3">
                  <span className="inline-flex items-center gap-1.5">
                    <ZoomIn className="w-4 h-4 text-primary" />
                    Zoom ({cropZoom.toFixed(1)}x)
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(Number(e.target.value))}
                    className="w-full mt-2 accent-primary"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 rounded-xl border border-gray-200 bg-white p-3">
                  <span className="inline-flex items-center gap-1.5">
                    <MoveHorizontal className="w-4 h-4 text-primary" />
                    Horizontal
                  </span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={cropX}
                    onChange={(e) => setCropX(Number(e.target.value))}
                    className="w-full mt-2 accent-primary"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 rounded-xl border border-gray-200 bg-white p-3">
                  <span className="inline-flex items-center gap-1.5">
                    <MoveVertical className="w-4 h-4 text-primary" />
                    Vertical
                  </span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={cropY}
                    onChange={(e) => setCropY(Number(e.target.value))}
                    className="w-full mt-2 accent-primary"
                  />
                </label>
              </div>
            </div>

            <div className="px-3 sm:px-5 pb-4 sm:pb-5 pt-1 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCropReset}
                disabled={isCropping || uploading}
                className="border border-gray-300 text-gray-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={closeCropModal}
                disabled={isCropping}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60 flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                disabled={isCropping || uploading}
                className="bg-primary text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                {(isCropping || uploading) && <span className="h-4 w-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />}
                Save crop
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isImageViewerOpen && (
        <div className="fixed inset-0 z-[230] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsImageViewerOpen(false)}>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-sm font-semibold">{viewerTitle}</h3>
              <button
                onClick={() => setIsImageViewerOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
              <img src={viewerImageUrl} alt={viewerTitle} className="w-full max-h-[80vh] object-contain select-none" draggable={false} />
              <div className="absolute bottom-3 right-3 bg-black/55 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/20 tracking-wide">
                © DevConnect
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Chat Modal */}
      {isChatOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-[148] md:hidden"
            onClick={() => setIsChatOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 md:inset-x-auto md:bottom-4 md:right-4 w-full md:w-80 bg-white shadow-2xl rounded-t-3xl md:rounded-2xl border border-gray-200 z-[150] flex flex-col overflow-hidden h-[75vh] md:h-96"
            style={{ animation: "slideUpChat 0.3s cubic-bezier(0.32,0.72,0,1)" }}
          >
            <div className="flex items-center justify-center py-2 md:hidden bg-white">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="bg-primary p-3 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <img src={fullDisplayUser?.profilePic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} className="w-6 h-6 rounded-full" />
                <span className="text-sm font-bold">{fullDisplayUser?.username}</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-blue-700 rounded p-1">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${getEntityId(msg.senderId) === currentUser?._id ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    getEntityId(msg.senderId) === currentUser?._id
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.messageType === 'post' ? (
                      <div className="flex flex-col gap-2 p-1 min-w-[120px]">
                        <p className="italic opacity-80 text-[10px] mb-1">Shared a post</p>
                        <div className="bg-white/10 rounded-lg p-2 border border-white/20">
                           <p className="text-xs line-clamp-2">{msg.text}</p>
                           <Link to={`/post/${msg.postId}`} className="mt-2 text-[10px] font-bold underline block">View Post →</Link>
                        </div>
                      </div>
                    ) : msg.text}
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1 flex items-center gap-0.5">
                    <Clock className="w-2 h-2" />
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2 bg-white">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="text-primary hover:bg-blue-50 p-2 rounded-full transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
