import React, { useState, useEffect, useMemo, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import PostInput from '../components/PostInput';
import PostCard from '../components/PostCard';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Link, useLocation } from 'react-router-dom';
import { FilterX } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { socketUrl } from '../utils/runtimeConfig';
import { normalizeHashtag } from '../utils/hashtags';

const HOME_WELCOME_EVENT_KEY = 'dc_home_welcome_event';

const Home = () => {
  const { user: currentUser } = useContext(AuthContext);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeTag = normalizeHashtag(params.get('tag'));

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState('Recent'); // 'Top' or 'Recent'
  const [topOrderIds, setTopOrderIds] = useState([]);
  const [welcomeVariant, setWelcomeVariant] = useState('');
  const [isWelcomeClosing, setIsWelcomeClosing] = useState(false);
  const currentUserId = currentUser?._id || currentUser?.id || '';

  const closeWelcome = () => setIsWelcomeClosing(true);

  useEffect(() => {
    const eventType = sessionStorage.getItem(HOME_WELCOME_EVENT_KEY);
    if (eventType !== 'login' && eventType !== 'register') return;

    sessionStorage.removeItem(HOME_WELCOME_EVENT_KEY);
    setWelcomeVariant(eventType);
    setIsWelcomeClosing(false);

    const hideTimer = setTimeout(() => {
      setIsWelcomeClosing(true);
    }, 2500);

    return () => clearTimeout(hideTimer);
  }, []);

  useEffect(() => {
    if (!isWelcomeClosing) return;
    const exitTimer = setTimeout(() => {
      setWelcomeVariant('');
      setIsWelcomeClosing(false);
    }, 220);
    return () => clearTimeout(exitTimer);
  }, [isWelcomeClosing]);

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

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/posts', {
          params: activeTag ? { tag: activeTag } : {},
        });
        setPosts(res.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    const socket = io(socketUrl);
    
    socket.on('postCreated', (newPost) => {
      setPosts((current) => {
        // Avoid duplicates if the UI already added it optimistically
        if (current.find((p) => p._id === newPost._id)) return current;

        const authorId = newPost?.userId?._id || newPost?.userId || '';
        const isOwnRepost = Boolean(newPost?.isRepost) && String(authorId) === String(currentUserId);
        if (isOwnRepost) {
          const originalId = newPost?.originalPost?._id || newPost?.originalPost || '';
          if (!originalId) return current;
          return current.map((post) => {
            const postId = post?._id ? String(post._id) : '';
            const postOriginalId = post?.originalPost?._id
              ? String(post.originalPost._id)
              : (post?.originalPost ? String(post.originalPost) : '');
            if (postId === String(originalId) || postOriginalId === String(originalId)) {
              return { ...post, viewerHasReposted: true };
            }
            return post;
          });
        }

        return [newPost, ...current];
      });
    });

    socket.on('postUpdated', (updatedPost) => {
      setPosts((current) =>
        current.map((p) => {
          const postId = p?._id ? String(p._id) : '';
          const postOriginalId = p?.originalPost?._id
            ? String(p.originalPost._id)
            : (p?.originalPost ? String(p.originalPost) : '');
          const updatedId = updatedPost?._id ? String(updatedPost._id) : '';
          if (postId === updatedId || postOriginalId === updatedId) {
            return mergePostUpdate(p, updatedPost);
          }
          return p;
        })
      );
    });

    socket.on('postDeleted', (postId) => {
      setPosts(current => current.filter(p => p._id !== postId));
    });

    return () => socket.disconnect();
  }, [activeTag, currentUserId]);

  // Socket handles incoming posts now, so this callback is purely optional for immediate UI feedback.
  const handlePostCreated = () => {
    // Left empty since socket.on('postCreated') will inject it, avoiding duplicates
  };

  useEffect(() => {
    if (sortMode !== 'Top') return;
    const rankedIds = [...posts]
      .sort((a, b) => {
        const aScore = (a.likes?.length || 0) + (a.comments?.length || 0) * 2;
        const bScore = (b.likes?.length || 0) + (b.comments?.length || 0) * 2;
        if (bScore !== aScore) return bScore - aScore;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .map((p) => p._id);
    setTopOrderIds(rankedIds);
  }, [posts, sortMode]);

  const sortedPosts = useMemo(() => {
    if (sortMode === 'Top') {
      const byId = new Map(posts.map((p) => [p._id, p]));
      const ordered = topOrderIds.map((id) => byId.get(id)).filter(Boolean);
      const unseen = posts.filter((p) => !topOrderIds.includes(p._id));
      return [...ordered, ...unseen];
    }
    return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts, sortMode, topOrderIds]);

  const repostedOriginalIds = useMemo(() => {
    const currentUserId = currentUser?._id || currentUser?.id || '';
    const ids = new Set();
    posts.forEach((post) => {
      const postUserId = post?.userId?._id || post?.userId || '';
      if (!post?.isRepost || String(postUserId) !== String(currentUserId)) return;

      const original = post?.originalPost;
      const originalId = original?._id || original;
      if (originalId) ids.add(String(originalId));
    });
    return ids;
  }, [posts, currentUser?._id, currentUser?.id]);

  const filteredPosts = sortedPosts;

  const handleRepostStateChange = (targetPostId, isReposted) => {
    const targetId = String(targetPostId || '');
    if (!targetId) return;

    setPosts((current) =>
      current.map((post) => {
        const postId = post?._id ? String(post._id) : '';
        const postOriginalId = post?.originalPost?._id
          ? String(post.originalPost._id)
          : (post?.originalPost ? String(post.originalPost) : '');
        if (postId === targetId || postOriginalId === targetId) {
          return { ...post, viewerHasReposted: Boolean(isReposted) };
        }
        return post;
      })
    );
  };

  const visiblePosts = useMemo(
    () =>
      filteredPosts.filter((post) => {
        if (!post?.isRepost || !currentUserId) return true;
        const repostOwnerId = post?.userId?._id || post?.userId;
        const originalOwnerId = post?.originalPost?.userId?._id || post?.originalPost?.userId;
        const isSelfRepostDuplicate =
          String(repostOwnerId) === String(currentUserId) &&
          Boolean(originalOwnerId) &&
          String(originalOwnerId) === String(currentUserId);
        return !isSelfRepostDuplicate;
      }),
    [filteredPosts, currentUserId]
  );

  return (
    <div className="bg-background min-h-screen pt-28 md:pt-20 pb-10">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-3 sm:px-4 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* Left Sidebar (Stacked below on mobile, 3 cols on desktop) */}
        <div className="order-2 lg:order-1 lg:col-span-3 pb-4 md:pb-8">
          <Sidebar />
        </div>

        {/* Center Feed (Spans remaining cols) */}
        <div className="order-1 lg:order-2 col-span-1 lg:col-span-6 flex flex-col gap-4">
          {welcomeVariant && (
            <div
              className={`flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 ${isWelcomeClosing ? 'dc-welcome-pop-exit' : 'dc-welcome-pop-enter'}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {welcomeVariant === 'login'
                    ? 'Welcome back'
                    : 'Welcome to DevConnect - The Developer Network'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeWelcome}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                aria-label="Close welcome message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <PostInput onPostCreated={handlePostCreated} />

          {/* Mobile Discover Section */}
          <div className="lg:hidden">
            <RightSidebar activeTag={activeTag} />
          </div>

          {activeTag && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm">
              <p className="font-medium text-blue-900">Showing posts for #{activeTag}</p>
              <Link to="/" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                <FilterX className="w-4 h-4" />
                Clear
              </Link>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 relative group">
            <hr className="flex-1 border-gray-300" />
            <div className="flex items-center gap-1 cursor-pointer">
              <span>Sort by:</span>
              <select 
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="font-bold text-gray-800 bg-transparent outline-none cursor-pointer hover:text-primary transition-colors"
              >
                <option value="Top">Top</option>
                <option value="Recent">Recent</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : visiblePosts.length > 0 ? (
            visiblePosts.map(post => (
              <PostCard 
                key={post._id} 
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
                codeFileName={post.codeFileName}
                codeDifficulty={post.codeDifficulty}
                codeReadTime={post.codeReadTime}
                hashtags={post.hashtags}
                isSaved={Boolean(post.isSaved)}
                isRepost={post.isRepost}
                originalPost={post.originalPost}
                alreadyReposted={Boolean(post.viewerHasReposted) || repostedOriginalIds.has(String(post._id))}
                onRepostStateChange={handleRepostStateChange}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-8 bg-white rounded-2xl shadow-sm border border-gray-200">
              {activeTag ? `No posts found for #${activeTag}.` : 'No posts yet. Be the first to post!'}
            </div>
          )}
        </div>

        {/* Right Sidebar (Hidden on small screens, shown on lg) */}
        <div className="hidden lg:block lg:order-3 lg:col-span-3">
          <RightSidebar activeTag={activeTag} />
        </div>

      </main>
    </div>
  );
};

export default Home;
