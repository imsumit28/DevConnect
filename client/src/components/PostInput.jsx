import React, { useState, useContext, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Image, Video, Calendar, FileText, X, Clock, MapPin, ExternalLink, Code2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { compressImageFile } from '../utils/imageCompression';

const MAX_VIDEO_SIZE_BYTES = 5 * 1024 * 1024;
const VIDEO_SIZE_ERROR = 'video till 5mb is allowed or compress video to 5 mb';
const ACTIVE_HASHTAG_REGEX = /(^|\s)#([a-z0-9_]*)$/i;

const DEV_EVENTS = [
  { id: 1, title: 'React Summit 2026', date: '2026-06-15', location: 'Amsterdam', desc: 'The biggest React conference in the world' },
  { id: 2, title: 'NodeConf EU', date: '2026-07-10', location: 'Kilkenny, Ireland', desc: 'Europe\'s premier Node.js conference' },
  { id: 3, title: 'Google I/O Extended', date: '2026-05-20', location: 'Virtual', desc: 'Developer festival with hands-on workshops' },
  { id: 4, title: 'AWS re:Invent', date: '2026-11-28', location: 'Las Vegas', desc: 'Cloud computing mega event by Amazon' },
  { id: 5, title: 'JSConf India', date: '2026-08-12', location: 'Bengaluru', desc: 'JavaScript community conference in India' },
  { id: 6, title: 'PyCon US 2026', date: '2026-04-23', location: 'Pittsburgh', desc: 'Largest gathering of the Python community' },
  { id: 7, title: 'DockerCon', date: '2026-09-18', location: 'San Francisco', desc: 'Containerization and DevOps innovation' },
  { id: 8, title: 'MongoDB World', date: '2026-06-07', location: 'New York', desc: 'The premier event for MongoDB developers' },
  { id: 9, title: 'GitHub Universe', date: '2026-10-29', location: 'San Francisco', desc: 'The developer event of the year' },
  { id: 10, title: 'KubeCon Europe', date: '2026-04-01', location: 'Paris', desc: 'Cloud native computing conference' },
  { id: 11, title: 'VueConf US', date: '2026-05-14', location: 'Tampa', desc: 'Official Vue.js conference in the US' },

  { id: 12, title: 'RustConf', date: '2026-09-05', location: 'Portland', desc: 'Annual Rust programming language conference' },
  { id: 13, title: 'GraphQL Summit', date: '2026-10-07', location: 'San Diego', desc: 'World\'s largest GraphQL conference' },
  { id: 14, title: 'DevOps Days London', date: '2026-03-26', location: 'London', desc: 'Community-run DevOps conference' },
  { id: 15, title: 'Next.js Conf', date: '2026-10-25', location: 'Virtual', desc: 'Vercel\'s annual Next.js conference' },
];

const PostInput = ({ onPostCreated, editDraft = null, onEditCancel = null, onEditSaved = null }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [editingPostId, setEditingPostId] = useState('');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const postInputRef = useRef(null);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  // Article form
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');

  // Code form
  const [codeTitle, setCodeTitle] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeFileName, setCodeFileName] = useState('');
  const [codeDifficulty, setCodeDifficulty] = useState('Intermediate');
  const [codeReadTime, setCodeReadTime] = useState('3');
  const [codeDescription, setCodeDescription] = useState('');

  useEffect(() => {
    const targetPostId = String(editDraft?.postId || '');
    if (!targetPostId) return;

    const nextContent = String(editDraft?.content || '');
    setEditingPostId(targetPostId);
    setContent(nextContent);
    setImage(null);
    setVideo(null);
    setHashtagSuggestions([]);
    setShowHashtagSuggestions(false);
    setActiveSuggestionIndex(0);

    requestAnimationFrame(() => {
      const input = postInputRef.current;
      if (!input) return;
      input.focus();
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 300)}px`;
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [editDraft?.postId, editDraft?.content]);

  const getActiveHashtagQuery = (value, cursorPosition) => {
    const uptoCursor = value.slice(0, cursorPosition);
    const match = uptoCursor.match(ACTIVE_HASHTAG_REGEX);
    return match ? match[2].toLowerCase() : '';
  };

  const insertSuggestion = (tag) => {
    const input = postInputRef.current;
    if (!input) return;

    const cursorStart = input.selectionStart ?? content.length;
    const cursorEnd = input.selectionEnd ?? content.length;
    const beforeCursor = content.slice(0, cursorStart);
    const afterCursor = content.slice(cursorEnd);
    const match = beforeCursor.match(ACTIVE_HASHTAG_REGEX);

    if (!match) return;

    const replaceStart = cursorStart - match[2].length - 1;
    const nextValue = `${content.slice(0, replaceStart)}${tag} ${afterCursor}`;
    const nextCursor = replaceStart + tag.length + 1;

    setContent(nextValue);
    setShowHashtagSuggestions(false);
    setActiveSuggestionIndex(0);

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 300)}px`;
    });
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    const el = postInputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
    }
  };

  useEffect(() => {
    const input = postInputRef.current;
    const cursorPosition = input?.selectionStart ?? content.length;
    const query = getActiveHashtagQuery(content, cursorPosition);

    if (!query) {
      setHashtagSuggestions([]);
      setShowHashtagSuggestions(false);
      setActiveSuggestionIndex(0);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/posts/hashtag-suggestions', {
          params: { q: query },
        });

        if (cancelled) return;

        setHashtagSuggestions(res.data || []);
        setShowHashtagSuggestions((res.data || []).length > 0);
        setActiveSuggestionIndex(0);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load hashtag suggestions', error);
        }
      }
    }, 160);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image && !video) return;

    const isEditingNow = Boolean(editingPostId);
    setLoading(true);
    try {
      if (isEditingNow) {
        const res = await api.put(`/posts/${editingPostId}`, { content: content.trim() });
        setContent('');
        setEditingPostId('');
        if (postInputRef.current) {
          postInputRef.current.style.height = 'auto';
        }
        if (onEditSaved) onEditSaved(res.data);
        showToast('Post updated');
        return;
      }

      let imageUrl = '';
      let videoUrl = '';

      if (image) {
        const compressedImage = await compressImageFile(image, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.82,
        });
        const formData = new FormData();
        formData.append('image', compressedImage);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      if (video) {
        if (video.size > MAX_VIDEO_SIZE_BYTES) {
          showToast(VIDEO_SIZE_ERROR, 'error');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('image', video);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        videoUrl = uploadRes.data.url;
      }

      const res = await api.post('/posts', { content, image: imageUrl, video: videoUrl });
      setContent('');
      if (postInputRef.current) {
        postInputRef.current.style.height = 'auto';
      }
      setHashtagSuggestions([]);
      setShowHashtagSuggestions(false);
      setImage(null);
      setVideo(null);
      if (onPostCreated) onPostCreated(res.data);
    } catch (error) {
      const fallbackMessage = isEditingNow ? 'Failed to update post' : 'Failed to create post';
      const serverMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : '') ||
        error?.message ||
        '';
      console.error(isEditingNow ? 'Failed to update post' : 'Failed to create post', error);
      showToast(serverMessage || fallbackMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId('');
    setContent('');
    if (postInputRef.current) {
      postInputRef.current.style.height = 'auto';
    }
    if (onEditCancel) onEditCancel();
  };

  const handleImageChange = (e) => {
    if (e.target.files?.[0]) setImage(e.target.files[0]);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast('Please select a video file', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      showToast(VIDEO_SIZE_ERROR, 'error');
      e.target.value = '';
      return;
    }
    setVideo(file);
  };

  const handleContentKeyDown = (e) => {
    if (!showHashtagSuggestions || hashtagSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % hashtagSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev - 1 + hashtagSuggestions.length) % hashtagSuggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertSuggestion(`#${hashtagSuggestions[activeSuggestionIndex].tag}`);
    } else if (e.key === 'Escape') {
      setShowHashtagSuggestions(false);
    }
  };

  const handleSubmitEvent = async () => {
    if (!eventTitle.trim() || !eventDate) {
      showToast('Please fill event title and date', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/posts', {
        content: eventDesc || `📅 Event: ${eventTitle}`,
        postType: 'event',
        eventTitle,
        eventDate,
      });
      setShowEventModal(false);
      setEventTitle('');
      setEventDate('');
      setEventDesc('');
      if (onPostCreated) onPostCreated(res.data);
      showToast('Event scheduled!');
    } catch (err) {
      console.error(err);
      showToast('Failed to schedule event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitArticle = async () => {
    if (!articleTitle.trim() || !articleContent.trim()) {
      showToast('Please fill article title and content', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/posts', {
        content: articleContent,
        postType: 'article',
        articleTitle,
      });
      setShowArticleModal(false);
      setArticleTitle('');
      setArticleContent('');
      if (onPostCreated) onPostCreated(res.data);
      showToast('Article published!');
    } catch (err) {
      console.error(err);
      showToast('Failed to publish article', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!codeTitle.trim() || !codeSnippet.trim()) {
      showToast('Please fill in the title and code snippet', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/posts', {
        content: codeDescription || `💻 Code: ${codeTitle}`,
        postType: 'code',
        codeTitle,
        codeSnippet,
        codeLanguage,
        codeFileName,
        codeDifficulty,
        codeReadTime: Number(codeReadTime) || 0,
      });
      setShowCodeModal(false);
      setCodeTitle('');
      setCodeSnippet('');
      setCodeLanguage('javascript');
      setCodeFileName('');
      setCodeDifficulty('Intermediate');
      setCodeReadTime('3');
      setCodeDescription('');
      if (onPostCreated) onPostCreated(res.data);
      showToast('Code snippet shared!');
    } catch (err) {
      console.error(err);
      showToast('Failed to share code snippet', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
        <form onSubmit={handleSubmit} className="flex items-start gap-2 sm:gap-3">
          <img 
            src={user?.profilePic || `https://i.pravatar.cc/150?u=${user?.username || 'me'}`} 
            alt="Profile" 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm border border-gray-100 shrink-0"
          />
          <textarea 
            ref={postInputRef}
            rows={1}
            value={content}
            onChange={handleContentChange}
            onFocus={() => {
              if (hashtagSuggestions.length > 0) setShowHashtagSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowHashtagSuggestions(false), 120);
            }}
            onKeyDown={handleContentKeyDown}
            placeholder={editingPostId ? 'Edit your post...' : 'Start a post...'}
            className={`flex-1 min-w-0 bg-gray-100 hover:bg-gray-200 border border-transparent focus:border-gray-300 focus:bg-white px-3 sm:px-5 py-2.5 sm:py-3 text-gray-700 outline-none transition-all text-sm sm:text-base resize-none overflow-y-auto leading-relaxed [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${content.length > 0 || (postInputRef.current && postInputRef.current.scrollHeight > 60) ? 'rounded-2xl min-h-[50px]' : 'rounded-full h-10 sm:h-12'}`}
          />
          {editingPostId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={loading}
              className="border border-gray-300 text-gray-700 font-semibold px-3 sm:px-4 py-2 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors active:scale-95 shrink-0 whitespace-nowrap text-sm sm:text-base mt-0.5 sm:mt-1"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            disabled={(!content.trim() && !image && !video) || loading}
            className="bg-primary text-white font-semibold px-3 sm:px-4 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors active:scale-95 shrink-0 whitespace-nowrap text-sm sm:text-base mt-0.5 sm:mt-1"
          >
            {loading ? (editingPostId ? 'Updating...' : 'Posting...') : (editingPostId ? 'Update' : 'Post')}
          </button>
        </form>

        {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-2 shadow-sm">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700/75">
              Suggested hashtags
            </p>
            <div className="space-y-1">
              {hashtagSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.tag}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertSuggestion(suggestion.label);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    index === activeSuggestionIndex ? 'bg-white text-primary shadow-sm' : 'text-gray-700 hover:bg-white/80'
                  }`}
                >
                  <span className="font-semibold">{suggestion.label}</span>
                  <span className="text-xs text-gray-500">{suggestion.count} {suggestion.count === 1 ? 'post' : 'posts'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-2 px-1 text-[11px] text-gray-500">
          Type `#` while writing to get hashtag suggestions.
        </p>

        {/* Image preview */}
        {image && (
          <div className="mt-3 relative inline-block">
            <img src={URL.createObjectURL(image)} alt="Preview" className="h-32 rounded-lg object-cover" />
            <button onClick={() => setImage(null)} className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-1 text-xs hover:bg-gray-700">✕</button>
          </div>
        )}

        {/* Video preview */}
        {video && (
          <div className="mt-3 relative inline-block">
            <video src={URL.createObjectURL(video)} className="h-32 rounded-lg" controls />
            <button
              onClick={() => {
                setVideo(null);
                if (videoInputRef.current) videoInputRef.current.value = '';
              }}
              className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-1 text-xs hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        )}
        
        {!editingPostId && (
        <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-3 pt-2">
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
          <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={handleVideoChange} />

          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-2 py-2.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 font-medium text-sm w-full justify-center lg:justify-start lg:w-auto active:scale-95"
          >
            <Image className="text-[#378fe9] w-5 h-5" />
            <span className="hidden sm:inline">Media</span>
          </button>
          <button 
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center gap-2 px-2 py-2.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 font-medium text-sm w-full justify-center lg:justify-start lg:w-auto active:scale-95"
          >
            <Video className="text-[#5f9b41] w-5 h-5" />
            <span className="hidden sm:inline">Video</span>
          </button>
          <button 
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-2 px-2 py-2.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 font-medium text-sm w-full justify-center lg:justify-start lg:w-auto active:scale-95"
          >
            <Code2 className="text-[#7c3aed] w-5 h-5" />
            <span className="hidden sm:inline">Code</span>
          </button>
          <button 
            type="button"
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-2 px-2 py-2.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 font-medium text-sm w-full justify-center lg:justify-start lg:w-auto active:scale-95"
          >
            <Calendar className="text-[#c37d16] w-5 h-5" />
            <span className="hidden sm:inline">Event</span>
          </button>
          <button 
            type="button"
            onClick={() => setShowArticleModal(true)}
            className="flex items-center gap-2 px-2 py-2.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 font-medium text-sm w-full justify-center lg:justify-start lg:w-auto active:scale-95"
          >
            <FileText className="text-[#e16745] w-5 h-5" />
            <span className="hidden sm:inline">Article</span>
          </button>
        </div>
        )}
      </div>

      {/* ── EVENT MODAL ── */}
      {showEventModal && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowEventModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#c37d16]" /> Schedule an Event</h2>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Title</label>
                <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="e.g. React Workshop" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Date</label>
                <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (optional)</label>
                <textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none" rows={2} placeholder="Tell people about this event..." />
              </div>

              {/* Pre-populated dev events */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" /> Upcoming Dev Events</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {DEV_EVENTS.map(ev => (
                    <div key={ev.id} className="border border-gray-100 rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">{ev.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</p>
                      <p className="text-xs text-gray-600 mt-1">{ev.desc}</p>
                      <button className="mt-2 text-xs font-semibold text-white bg-primary rounded-full px-3 py-1 hover:bg-blue-700 transition-colors active:scale-95 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Register Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 shrink-0">
              <button onClick={() => setShowEventModal(false)} className="border border-gray-400 text-gray-600 font-semibold px-5 py-2 rounded-full hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSubmitEvent} disabled={loading} className="bg-[#c37d16] text-white font-semibold px-6 py-2 rounded-full hover:bg-[#a96b12] transition-colors disabled:opacity-50 active:scale-95">
                {loading ? 'Scheduling...' : '📅 Schedule Event'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── ARTICLE MODAL ── */}
      {showArticleModal && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowArticleModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-[#e16745]" /> Write an Article</h2>
              <button onClick={() => setShowArticleModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Article Title</label>
                <input type="text" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Give your article a compelling title..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content</label>
                <textarea value={articleContent} onChange={(e) => setArticleContent(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none leading-relaxed" rows={6} placeholder="Write your article here... Share your knowledge, insights, and experience with the community." />
                <p className="text-xs text-gray-400 mt-1 text-right">{articleContent.length} characters</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 shrink-0">
              <button onClick={() => setShowArticleModal(false)} className="border border-gray-400 text-gray-600 font-semibold px-5 py-2 rounded-full hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSubmitArticle} disabled={loading} className="bg-[#e16745] text-white font-semibold px-6 py-2 rounded-full hover:bg-[#c9553a] transition-colors disabled:opacity-50 active:scale-95">
                {loading ? 'Publishing...' : '📝 Publish Article'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CODE MODAL ── */}
      {showCodeModal && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCodeModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Code2 className="w-5 h-5 text-[#7c3aed]" /> Share Code Snippet</h2>
              <button onClick={() => setShowCodeModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                <input type="text" value={codeTitle} onChange={(e) => setCodeTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent outline-none transition-all" placeholder="e.g. Custom React Hook for Debounce" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Language</label>
                <select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent outline-none transition-all bg-white">
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="ruby">Ruby</option>
                  <option value="php">PHP</option>
                  <option value="swift">Swift</option>
                  <option value="kotlin">Kotlin</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash / Shell</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">File Name</label>
                  <input
                    type="text"
                    value={codeFileName}
                    onChange={(e) => setCodeFileName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent outline-none transition-all"
                    placeholder="app.js"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulty</label>
                  <select
                    value={codeDifficulty}
                    onChange={(e) => setCodeDifficulty(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Read Time (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={codeReadTime}
                    onChange={(e) => setCodeReadTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent outline-none transition-all"
                    placeholder="3"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Code</label>
                <textarea value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono bg-gray-900 text-green-400 focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent outline-none transition-all resize-none leading-relaxed" rows={5} placeholder="Paste or type your code here..." spellCheck={false} />
                <p className="text-xs text-gray-400 mt-1 text-right">{codeSnippet.length} characters</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (optional)</label>
                <textarea value={codeDescription} onChange={(e) => setCodeDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent outline-none transition-all resize-none" rows={2} placeholder="Explain what this code does, why you wrote it, or how to use it..." />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 shrink-0">
              <button onClick={() => setShowCodeModal(false)} className="border border-gray-400 text-gray-600 font-semibold px-5 py-2 rounded-full hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSubmitCode} disabled={loading} className="bg-[#7c3aed] text-white font-semibold px-6 py-2 rounded-full hover:bg-[#6d28d9] transition-colors disabled:opacity-50 active:scale-95">
                {loading ? 'Sharing...' : '💻 Share Code'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PostInput;
