import React, { useState, useEffect, useContext } from 'react';
import { X, Search, Send } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const SendModal = ({ isOpen, onClose, postId }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { user: currentUser } = useContext(AuthContext);
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const res = await api.get('/users');
          const filtered = (res.data || []).filter((u) => u._id !== currentUserId);
          setUsers(filtered);
        } catch (err) {
          console.error(err);
        }
      };
      fetchUsers();
    }
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedUser) return;
    if (selectedUser._id === currentUserId) {
      showToast('You cannot send to yourself', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/messages', {
        receiverId: selectedUser._id,
        text: 'Shared a post with you',
        messageType: 'post',
        postId: postId
      });
      showToast(`Post sent to ${selectedUser.username}!`);
      onClose();
    } catch (err) {
      showToast('Failed to send post', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-scale-in">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Send to...</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center bg-white border rounded-full px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search people" 
              className="bg-transparent outline-none ml-2 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredUsers.length > 0 ? filteredUsers.map(user => (
            <div 
              key={user._id} 
              onClick={() => setSelectedUser(user)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedUser?._id === user._id ? 'bg-blue-50 border-primary border' : 'hover:bg-gray-50'}`}
            >
              <img src={user.profilePic} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{user.name || user.username}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-sm text-gray-500 py-4">No people found</p>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-full transition-colors">Cancel</button>
          <button 
            disabled={!selectedUser || loading}
            onClick={handleSend}
            className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Send</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendModal;
