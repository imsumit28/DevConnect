import React, { useState, useContext } from 'react';
import { ThumbsUp, MessageSquare, Share2, Send, Pin, FileText, MoreHorizontal, Repeat2, Clock, CornerDownRight, Smile, Sparkles, Code2, Copy } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ShareModal from './ShareModal';
import SendModal from './SendModal';
import { useToast } from '../context/ToastContext';
import { formatRelativeTime } from '../utils/timeUtils';
import { resolveMediaUrl } from '../utils/mediaUrl';

const PostCard = ({ postId, user, time, content, image, video, likesList = [], commentsList = [], isActivity = false, activityType = 'none', postType = 'post', articleTitle, eventTitle, eventDate, codeSnippet, codeLanguage, codeTitle, isPinnedDisplay = false, onPin, isRepost = false, originalPost = null, alreadyReposted = false, onRepostStateChange = null }) => {
  const { user: currentUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentInputExpanded, setCommentInputExpanded] = useState(false);
  const commentTextareaRef = React.useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = React.useRef(null);
  const emojiButtonRef = React.useRef(null);
  const replyEmojiButtonRefs = React.useRef({});
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [emojiTarget, setEmojiTarget] = useState({ type: 'comment', commentId: '' });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasReposted, setHasReposted] = useState(alreadyReposted);
  const [repostLoading, setRepostLoading] = useState(false);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState('');
  const [replyDraftByComment, setReplyDraftByComment] = useState({});
  const [commentActionLoadingId, setCommentActionLoadingId] = useState('');
  const displayActionPostId = isRepost && originalPost?._id ? originalPost._id : postId;
  const displayLikesList = isRepost && Array.isArray(originalPost?.likes) ? originalPost.likes : likesList;
  const displayCommentsList = isRepost && Array.isArray(originalPost?.comments) ? originalPost.comments : commentsList;
  const isOwnRepostCard = Boolean(isRepost) && String(user?.username || '') === String(currentUser?.username || '');
  const founderEmail = 'ersumitkumar45@gmail.com';
  const isFounderAccount = (person) => {
    const email = String(person?.email || '').toLowerCase().trim();
    return email === founderEmail;
  };

  const [isLiked, setIsLiked] = useState(displayLikesList?.includes(currentUser?._id) || false);
  const [likesCount, setLikesCount] = useState(displayLikesList?.length || 0);

  React.useEffect(() => {
    setLikesCount(displayLikesList?.length || 0);
    setIsLiked(displayLikesList?.includes(currentUser?._id) || false);
  }, [displayLikesList, currentUser?._id]);

  React.useEffect(() => {
    setHasReposted(Boolean(alreadyReposted || isOwnRepostCard));
  }, [alreadyReposted, isOwnRepostCard]);

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (emojiPickerRef.current && emojiPickerRef.current.contains(event.target)) return;
      if (emojiButtonRef.current && emojiButtonRef.current.contains(event.target)) return;
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showEmojiPicker]);

  const toggleEmojiPicker = (targetType = 'comment', targetCommentId = '') => {
    const isSameTargetOpen =
      showEmojiPicker &&
      emojiTarget.type === targetType &&
      String(emojiTarget.commentId || '') === String(targetCommentId || '');

    if (isSameTargetOpen) {
      setShowEmojiPicker(false);
      return;
    }

    const anchorEl =
      targetType === 'reply'
        ? replyEmojiButtonRefs.current[String(targetCommentId)] || null
        : emojiButtonRef.current;

    const rect = anchorEl?.getBoundingClientRect();
    if (!rect) {
      setEmojiTarget({ type: targetType, commentId: String(targetCommentId || '') });
      setShowEmojiPicker(true);
      return;
    }

    const pickerWidth = 320;
    const pickerHeight = 380;
    const safePadding = 8;
    const gap = 8;

    const hasBottomSpace = window.innerHeight - rect.bottom - gap >= pickerHeight;
    const hasTopSpace = rect.top - gap >= pickerHeight;
    const hasRightSpace = window.innerWidth - rect.right - gap >= pickerWidth;
    const hasLeftSpace = rect.left - gap >= pickerWidth;

    let top = rect.bottom + gap;
    let left = rect.left;

    if (hasBottomSpace) {
      top = rect.bottom + gap;
      left = rect.left;
    } else if (hasTopSpace) {
      top = rect.top - pickerHeight - gap;
      left = rect.left;
    } else if (hasRightSpace) {
      top = rect.top;
      left = rect.right + gap;
    } else if (hasLeftSpace) {
      top = rect.top;
      left = rect.left - pickerWidth - gap;
    }

    top = Math.max(safePadding, Math.min(top, window.innerHeight - pickerHeight - safePadding));
    left = Math.max(safePadding, Math.min(left, window.innerWidth - pickerWidth - safePadding));

    setEmojiPickerPosition({ top, left });
    setEmojiTarget({ type: targetType, commentId: String(targetCommentId || '') });
    setShowEmojiPicker(true);
  };

  const handleLike = async () => {
    try {
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
      await api.put(`/posts/${displayActionPostId}/like`);
    } catch (err) {
      setIsLiked(isLiked);
      setLikesCount(isLiked ? likesCount : likesCount - 1);
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/posts/${displayActionPostId}/comment`, { text: commentText });
      setCommentText('');
      setCommentInputExpanded(false);
      setShowEmojiPicker(false);
      if (commentTextareaRef.current) {
        commentTextareaRef.current.style.height = '40px';
      }
    } catch (err) {
      console.error(err);
    }
  };

  const autoResizeCommentBox = () => {
    const el = commentTextareaRef.current;
    if (!el) return;
    el.style.height = '40px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const handleCommentInputChange = (e) => {
    setCommentText(e.target.value);
    autoResizeCommentBox();
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (commentText.trim()) {
        handleComment(e);
      }
    }
  };

  const handleInsertEmoji = (emoji) => {
    const textarea = commentTextareaRef.current;
    if (!textarea) {
      setCommentText((prev) => `${prev}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? commentText.length;
    const end = textarea.selectionEnd ?? commentText.length;
    const next = `${commentText.slice(0, start)}${emoji}${commentText.slice(end)}`;
    setCommentText(next);

    requestAnimationFrame(() => {
      autoResizeCommentBox();
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleInsertReplyEmoji = (commentId, emoji) => {
    if (!commentId) return;
    setReplyDraftByComment((prev) => ({
      ...prev,
      [commentId]: `${prev[commentId] || ''}${emoji}`,
    }));
  };

  const handleEmojiSelect = (emojiData) => {
    if (emojiTarget.type === 'reply' && emojiTarget.commentId) {
      handleInsertReplyEmoji(emojiTarget.commentId, emojiData.emoji);
      return;
    }
    handleInsertEmoji(emojiData.emoji);
  };

  const handleCommentLike = async (commentId) => {
    if (!commentId || commentActionLoadingId) return;
    setCommentActionLoadingId(commentId);
    try {
      await api.put(`/posts/${displayActionPostId}/comments/${commentId}/like`);
    } catch (err) {
      console.error(err);
      showToast('Failed to update comment like', 'error');
    } finally {
      setCommentActionLoadingId('');
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!commentId) return;
    const text = (replyDraftByComment[commentId] || '').trim();
    if (!text || commentActionLoadingId) return;

    setCommentActionLoadingId(commentId);
    try {
      await api.post(`/posts/${displayActionPostId}/comments/${commentId}/reply`, { text });
      setReplyDraftByComment((prev) => ({ ...prev, [commentId]: '' }));
      setActiveReplyCommentId('');
    } catch (err) {
      console.error(err);
      showToast('Failed to reply', 'error');
    } finally {
      setCommentActionLoadingId('');
    }
  };

  const handlePin = async () => {
    try {
      const res = await api.put(`/posts/${postId}/pin`);
      showToast(res.data.message);
      if (onPin) onPin(res.data.pinnedPost);
      setIsMenuOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to pin post', 'error');
    }
  };

  const handleRepost = async () => {
    if (repostLoading) return;
    setRepostLoading(true);
    try {
      const res = await api.post(`/posts/${postId}/repost`);
      const action = res?.data?.action;
      const targetPostId = res?.data?.postId || postId;
      if (action === 'unreposted') {
        setHasReposted(false);
        if (onRepostStateChange) onRepostStateChange(targetPostId, false);
        showToast('Removed from reposts');
      } else {
        setHasReposted(true);
        if (onRepostStateChange) onRepostStateChange(targetPostId, true);
        showToast('Post reposted to your profile!');
      }
      setIsMenuOpen(false);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setHasReposted(true);
        if (onRepostStateChange) onRepostStateChange(postId, true);
        showToast('You already reposted this');
      } else {
        showToast('Failed to repost', 'error');
      }
      setIsMenuOpen(false);
    } finally {
      setRepostLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      showToast('Post deleted');
      setIsMenuOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete post', 'error');
    }
  };

  React.useEffect(() => {
    const handleGlobalClick = (e) => {
      if (isMenuOpen && !e.target.closest('.post-menu-container')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isMenuOpen]);

  const isOwnPost = user?.username === currentUser?.username;

  const displayUser = isRepost && originalPost ? originalPost.userId : user;
  const displayContent = isRepost && originalPost ? originalPost.content : content;
  const displayImage = resolveMediaUrl(isRepost && originalPost ? originalPost.image : image);
  const displayVideo = resolveMediaUrl(isRepost && originalPost ? originalPost.video : video);
  const displayPostType = isRepost && originalPost ? originalPost.postType : postType;
  const displayArticleTitle = isRepost && originalPost ? originalPost.articleTitle : articleTitle;
  const displayEventTitle = isRepost && originalPost ? originalPost.eventTitle : eventTitle;
  const displayEventDate = isRepost && originalPost ? originalPost.eventDate : eventDate;
  const displayCodeSnippet = isRepost && originalPost ? originalPost.codeSnippet : codeSnippet;
  const displayCodeLanguage = isRepost && originalPost ? originalPost.codeLanguage : codeLanguage;
  const displayCodeTitle = isRepost && originalPost ? originalPost.codeTitle : codeTitle;
  const isEventCard = displayPostType === 'event';
  const isArticleCard = displayPostType === 'article';
  const isCodeCard = displayPostType === 'code';
  const isMediaCard = !isEventCard && !isArticleCard && !isCodeCard && Boolean(displayImage || displayVideo);
  const typeLabel = isEventCard ? 'Event' : isArticleCard ? 'Article' : isCodeCard ? 'Code' : isMediaCard ? 'Media' : '';
  const showPostFounderBadge = isFounderAccount(displayUser);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden group hover:shadow-md transition-shadow duration-300 ${
        isPinnedDisplay ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-200'
      } ${isEventCard ? 'ring-1 ring-amber-200/70 bg-gradient-to-b from-amber-50/35 to-white' : ''} ${isArticleCard ? 'ring-1 ring-orange-200/60 bg-gradient-to-b from-orange-50/30 to-white' : ''} ${isCodeCard ? 'ring-1 ring-violet-200/60 bg-gradient-to-b from-violet-50/30 to-white' : ''} ${isMediaCard ? 'ring-1 ring-sky-200/60' : ''} mb-4`}
    >
      {isRepost && (
        <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
          <Share2 className="w-3 h-3" />
          <Link to={`/profile/${user?.username}`} className="hover:text-primary hover:underline">{user?.name || user?.username}</Link> reposted this
        </div>
      )}

      {isPinnedDisplay && (
        <div className="bg-primary/5 px-4 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary border-b border-primary/10">
          <Pin className="w-3 h-3" /> Pinned Post
        </div>
      )}

      <div className="p-4 flex gap-3 items-start">
        <Link to={`/profile/${displayUser?.username}`} className="flex-shrink-0">
          <img
            src={resolveMediaUrl(displayUser?.profilePic) || `https://i.pravatar.cc/150?u=${displayUser?.username || 'developer'}`}
            alt={displayUser?.name}
            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-md border border-gray-100"
            onError={(e) => { e.target.src = `https://i.pravatar.cc/150?u=${displayUser?.username || 'dev'}`; }}
          />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/profile/${displayUser?.username}`} className="font-extrabold text-gray-900 hover:text-primary cursor-pointer transition-colors leading-tight tracking-tight">
              {displayUser?.name || displayUser?.username || 'Developer'}
            </Link>
            {showPostFounderBadge && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 shadow-sm">
                <Sparkles className="w-3 h-3" />
                Founder
              </span>
            )}
            {isActivity && !isRepost && (
              <span className="text-gray-500 text-sm font-normal">
                {activityType === 'follow' ? 'started following a new developer' :
                  activityType === 'message' ? 'sent a direct message' :
                    activityType === 'share' ? 'shared a professional insight' : ''}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-500">@{displayUser?.username}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(time)}</p>
        </div>

        {!isPinnedDisplay && (
          <div className="relative post-menu-container">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              className="text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-all active:scale-90"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden animate-scale-in">
                {isOwnPost && (
                  <button onClick={handlePin} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50">
                    <Pin className="w-4 h-4 text-gray-500" /> {user?.pinnedPost === postId ? 'Unpin from profile' : 'Pin this post'}
                  </button>
                )}
                {!isActivity && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsShareModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
                  >
                    <Share2 className="w-4 h-4 text-gray-500" /> Share post
                  </button>
                )}
                {isOwnPost && (
                  <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete post
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {(isEventCard || isArticleCard || isMediaCard) && (
        <div className="px-4 -mt-1 pb-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
              isEventCard
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : isArticleCard
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : isCodeCard
                ? 'bg-violet-50 text-violet-700 border-violet-200'
                : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}
          >
            {isArticleCard ? <FileText className="w-3 h-3" /> : isCodeCard ? <Code2 className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
            {typeLabel}
          </span>
        </div>
      )}

      {displayPostType === 'article' && displayArticleTitle && (
        <div className="px-4 pb-1">
          <h3 className="text-3xl md:text-[2.05rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">{displayArticleTitle}</h3>
        </div>
      )}

      {displayPostType !== 'event' && displayPostType !== 'code' && (
        <div className={`px-4 pb-2 ${isArticleCard ? 'pb-4' : ''}`}>
          <p className={`text-gray-800 whitespace-pre-wrap ${isArticleCard ? 'line-clamp-4 text-[16px] leading-7 bg-slate-50 border border-slate-200 rounded-xl p-3.5' : 'text-[15px] leading-7'}`}>
            {displayContent}
          </p>
        </div>
      )}

      {displayPostType === 'event' && displayEventTitle && (
        <div className="px-4 m-4 mt-0 bg-blue-50/50 rounded-2xl border border-blue-100 p-4">
          <div className="flex gap-4">
            <div className="bg-white border border-blue-200 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-primary shadow-sm flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider">{new Date(displayEventDate).toLocaleString('default', { month: 'short' })}</span>
              <span className="text-2xl font-black leading-none mt-0.5">{new Date(displayEventDate).getDate()}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Virtual Event
              </div>
              <h3 className="text-3xl md:text-[2rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">{displayEventTitle}</h3>
              <p className="text-xs text-gray-500 font-medium mt-1 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(displayEventDate).toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">{displayContent}</p>
              <button onClick={() => showToast('Registered for event!')} className="mt-4 bg-primary text-white font-bold text-sm px-5 py-2 rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all w-max inline-flex items-center gap-2">
                Join Event
              </button>
            </div>
          </div>
        </div>
      )}

      {displayPostType === 'code' && displayCodeSnippet && (
        <div className="px-4 m-4 mt-0 rounded-2xl overflow-hidden border border-violet-200/80 shadow-sm">
          {displayCodeTitle && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                {displayCodeTitle}
              </h3>
              {displayCodeLanguage && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 bg-white/20 px-2.5 py-1 rounded-full">
                  {displayCodeLanguage}
                </span>
              )}
            </div>
          )}
          <div className="relative group/code">
            <pre className="bg-gray-900 text-gray-100 px-4 py-4 text-sm font-mono leading-relaxed overflow-x-auto max-h-80 scrollbar-thin">
              <code>{displayCodeSnippet}</code>
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(displayCodeSnippet);
                showToast('Code copied to clipboard!');
              }}
              className="absolute top-3 right-3 bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white p-2 rounded-lg transition-all opacity-0 group-hover/code:opacity-100 active:scale-90"
              title="Copy code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {displayContent && displayContent !== `💻 Code: ${displayCodeTitle}` && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-600 leading-relaxed">{displayContent}</p>
            </div>
          )}
        </div>
      )}

      {displayImage && (
        <div className={`${isMediaCard ? 'mx-4 mb-3 mt-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-gray-50' : 'mt-2 w-full max-h-96 bg-gray-100'}`}>
          <img src={displayImage} alt="Post media" className={`w-full h-full ${isMediaCard ? 'max-h-[28rem] object-cover' : 'object-contain'}`} />
        </div>
      )}

      {displayVideo && (
        <div className={`${isMediaCard ? 'mx-4 mb-3 mt-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black' : 'mt-2 w-full bg-black'}`}>
          <video src={displayVideo} controls className={`w-full ${isMediaCard ? 'max-h-[28rem]' : 'max-h-96'}`} />
        </div>
      )}

      <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500 border-b border-gray-100 mx-2">
        <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
          <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-primary text-primary' : 'text-gray-400'}`} />
          {likesCount}
        </div>
        <div className="hover:text-primary cursor-pointer transition-colors" onClick={() => setShowComments(!showComments)}>
          {displayCommentsList?.length || 0} comments
        </div>
      </div>

      <div className="px-2 py-1 grid grid-cols-4 gap-1 items-center">
        <button onClick={handleLike} className={`min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-md sm:rounded-lg font-medium text-[11px] sm:text-sm hover:bg-gray-100 active:scale-95 transition-all duration-200 ${isLiked ? 'text-primary' : 'text-gray-600'}`}>
          <ThumbsUp className={`w-5 h-5 -mt-1 transition-transform duration-300 ${isLiked ? 'fill-primary animate-heart-burst text-primary' : 'group-hover:scale-110'}`} />
          <span className="hidden min-[420px]:inline">Like</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-md sm:rounded-lg text-gray-600 font-medium text-[11px] sm:text-sm hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all duration-200 group">
          <MessageSquare className="w-5 h-5 -mt-1 group-hover:scale-110 transition-transform" />
          <span className="hidden min-[420px]:inline">Comment</span>
        </button>
        <button
          onClick={handleRepost}
          disabled={repostLoading}
          className={`min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-md sm:rounded-lg font-medium text-[11px] sm:text-sm active:scale-95 transition-all duration-200 group border ${hasReposted ? 'text-green-700 bg-green-50/80 border-green-100' : 'text-gray-600 border-transparent hover:bg-green-50 hover:text-green-600 hover:border-green-100'} ${repostLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <Repeat2 className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-500 ${hasReposted ? 'text-green-600' : 'group-hover:rotate-180'} ${repostLoading ? 'animate-spin' : ''}`} />
          <span className="hidden min-[420px]:inline">{repostLoading ? 'Updating...' : hasReposted ? 'Reposted' : 'Repost'}</span>
        </button>
        <button onClick={() => setIsSendModalOpen(true)} className="min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-md sm:rounded-lg text-gray-600 font-medium text-[11px] sm:text-sm hover:bg-gray-100 active:scale-95 transition-all duration-200">
          <Send className="w-5 h-5 -mt-1" />
          <span className="hidden min-[420px]:inline">Send</span>
        </button>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postUrl={`${window.location.origin}/post/${postId}`}
        postContent={content}
      />
      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        postId={postId}
      />

      {showComments && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <form onSubmit={handleComment} className="flex gap-2 mb-4">
            <img src={resolveMediaUrl(currentUser?.profilePic) || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} alt="Me" className="w-8 h-8 rounded-full object-cover" />
            <div className="flex-1">
              <textarea
                ref={commentTextareaRef}
                rows={1}
                placeholder="Write a comment..."
                value={commentText}
                onChange={handleCommentInputChange}
                onClick={() => setCommentInputExpanded(true)}
                onFocus={() => setCommentInputExpanded(true)}
                onKeyDown={handleCommentKeyDown}
                className={`w-full resize-none overflow-y-auto bg-white border border-gray-200 px-4 py-2.5 text-sm outline-none shadow-sm transition-all duration-200 focus:border-[#0073b1] focus:shadow-[0_0_0_2px_rgba(0,115,177,0.2)] focus:bg-white ${commentInputExpanded ? 'min-h-[84px] rounded-2xl' : 'h-10 rounded-full'}`}
              />
              <div className="mt-1.5 pl-2">
                <button
                  ref={emojiButtonRef}
                  type="button"
                  onClick={() => toggleEmojiPicker('comment')}
                  className="h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-primary hover:border-blue-200 transition-colors flex items-center justify-center"
                  title="Open emoji picker"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button disabled={!commentText.trim()} type="submit" className="text-primary font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform">Post</button>
          </form>
          {showEmojiPicker &&
            createPortal(
              <div
                ref={emojiPickerRef}
                style={{ top: emojiPickerPosition.top, left: emojiPickerPosition.left }}
                className="fixed z-[1200]"
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  lazyLoadEmojis={true}
                  skinTonesDisabled={false}
                  searchPlaceHolder="Search emoji"
                  width={320}
                  height={380}
                />
              </div>,
              document.body
            )}

          <div className="flex flex-col gap-2.5 pl-6">
            {(!displayCommentsList || displayCommentsList.length === 0) && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-gray-700">No comments yet</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Be the first to comment</p>
              </div>
            )}
            {displayCommentsList?.map((c) => {
              const commentId = c?._id ? String(c._id) : '';
              const likes = c?.likes || [];
              const hasLikedComment = likes.some((id) => String(id) === String(currentUser?._id));
              const replies = c?.replies || [];
              const isReplyOpen = activeReplyCommentId === commentId;
              const replyDraft = replyDraftByComment[commentId] || '';
              const commentUsername = c.userId?.username || 'developer';
              const commentName = c.userId?.name || commentUsername;
              const showCommentFounderBadge = isFounderAccount(c.userId);

              return (
                <div key={commentId} className="flex gap-2">
                  <Link to={`/profile/${commentUsername}`}>
                    <img src={resolveMediaUrl(c.userId?.profilePic) || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} alt={commentName} className="w-7 h-7 rounded-full object-cover mt-1 hover:scale-105 transition-transform" />
                  </Link>
                  <div className="flex-1">
                    <div className="bg-gray-50 px-3 py-2 rounded-xl rounded-tl-none flex-1 border border-gray-100">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link to={`/profile/${commentUsername}`} className="font-semibold text-[11px] text-gray-800 hover:text-primary transition-colors">{commentName}</Link>
                        {showCommentFounderBadge && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                            <Sparkles className="w-2.5 h-2.5" />
                            Founder
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">@{commentUsername} - {formatRelativeTime(c.createdAt)}</p>
                      <p className="text-[11px] text-gray-700 mt-1 leading-relaxed">{c.text}</p>
                    </div>

                    <div className="mt-1 flex items-center gap-3 pl-1">
                      <button
                        type="button"
                        onClick={() => handleCommentLike(commentId)}
                        disabled={!commentId || commentActionLoadingId === commentId}
                        className={`text-[11px] font-semibold transition-colors ${hasLikedComment ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
                      >
                        Like {likes.length > 0 ? `(${likes.length})` : ''}
                      </button>
                      <button
                        type="button"
                        disabled={!commentId}
                        onClick={() => setActiveReplyCommentId(isReplyOpen ? '' : commentId)}
                        className="text-[11px] font-semibold text-gray-500 hover:text-primary transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        Reply
                      </button>
                    </div>

                    {isReplyOpen && (
                      <form onSubmit={(e) => handleReplySubmit(e, commentId)} className="mt-2 flex items-center gap-2 pl-4">
                        <button
                          ref={(el) => {
                            if (el) {
                              replyEmojiButtonRefs.current[commentId] = el;
                            } else {
                              delete replyEmojiButtonRefs.current[commentId];
                            }
                          }}
                          type="button"
                          onClick={() => toggleEmojiPicker('reply', commentId)}
                          className="h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-primary hover:border-blue-200 transition-colors flex items-center justify-center flex-shrink-0"
                          title="Add emoji to reply"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={replyDraft}
                          onChange={(e) => setReplyDraftByComment((prev) => ({ ...prev, [commentId]: e.target.value }))}
                          placeholder="Write a reply..."
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="submit"
                          disabled={!replyDraft.trim() || commentActionLoadingId === commentId}
                          className="text-[11px] font-semibold text-primary disabled:opacity-50"
                        >
                          Send
                        </button>
                      </form>
                    )}

                    {replies.length > 0 && (
                      <div className="mt-2 pl-4 border-l border-gray-200 space-y-2">
                        {replies.map((reply, idx) => {
                          const replyUsername = reply.userId?.username || 'developer';
                          const replyName = reply.userId?.name || replyUsername;
                          const showReplyFounderBadge = isFounderAccount(reply.userId);
                          return (
                            <div key={reply?._id || `${commentId}-reply-${idx}`} className="bg-white border border-gray-100 rounded-xl px-3 py-2">
                              <div className="text-[10px] text-gray-500">
                                <span className="inline-flex items-center gap-1 flex-wrap">
                                  <Link to={`/profile/${replyUsername}`} className="font-semibold text-gray-700 hover:text-primary">
                                    {replyName}
                                  </Link>
                                  {showReplyFounderBadge && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Founder
                                    </span>
                                  )}
                                </span>
                                <span> @{replyUsername} - {formatRelativeTime(reply.createdAt)}</span>
                              </div>
                              <p className="text-[11px] text-gray-700 mt-0.5">{reply.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
