import { X, Bird, Share2, Link2, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ShareModal = ({ isOpen, onClose, postUrl, postContent }) => {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const logShare = async () => {
    try {
      await api.post('/posts/activity', {
        activityType: 'share',
        content: `shared a post`
      });
    } catch (err) {
      console.error("Failed to log share activity", err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postUrl);
    showToast('Link copied to clipboard!');
    logShare();
    onClose();
  };

  const shareLinks = [
    { 
      name: 'WhatsApp', 
      icon: <MessageCircle className="w-6 h-6 text-green-500" />, 
      url: `https://wa.me/?text=${encodeURIComponent((postContent || 'Check this out!') + ' ' + postUrl)}` 
    },
    { 
      name: 'X (Twitter)', 
      icon: <Bird className="w-6 h-6 text-black" />, 
      url: `https://x.com/intent/tweet?text=${encodeURIComponent(postContent || 'Professional update on DevConnect')}&url=${encodeURIComponent(postUrl)}` 
    },
    {
      name: 'Facebook',
      icon: (
        <div className="w-6 h-6 rounded-full bg-[#1877F2] text-white text-[14px] font-bold flex items-center justify-center leading-none">
          f
        </div>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
    },
    { 
      name: 'LinkedIn', 
      icon: <Share2 className="w-6 h-6 text-blue-700" />, 
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}` 
    },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Share Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-3 gap-4">
          {shareLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.url} 
              target="_blank" 
              rel="noreferrer"
              className="flex flex-col items-center gap-2 group"
              onClick={() => {
                showToast(`Sharing to ${link.name}...`);
                logShare();
                onClose();
              }}
            >
              <div className="p-3 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors">
                {link.icon}
              </div>
              <span className="text-xs font-medium text-gray-600">{link.name}</span>
            </a>
          ))}
          <button 
            onClick={copyToClipboard}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="p-3 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-gray-600">Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
