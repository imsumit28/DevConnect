import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Send, Search } from 'lucide-react';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { socketUrl } from '../utils/runtimeConfig';

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id) return getId(value._id);
    if (value.$oid) return value.$oid;
    if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
      return value.toString();
    }
  }
  return String(value);
};

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Messages = () => {
  const { user } = useContext(AuthContext);
  const currentUserId = user?._id || user?.id || '';
  const [users, setUsers] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadByUser, setUnreadByUser] = useState({});
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const previousTopConversationIdRef = useRef('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingList(true);
      try {
        const [usersRes, inboxRes] = await Promise.all([
          api.get('/users'),
          api.get('/messages'),
        ]);

        const allUsers = (usersRes.data || []).filter((u) => getId(u._id) !== currentUserId);
        const conversations = inboxRes.data || [];

        setUsers(allUsers);
        setInbox(conversations);

        if (conversations.length > 0 && conversations[0].user) {
          setSelectedUser(conversations[0].user);
        } else {
          setSelectedUser(null);
        }
      } catch (error) {
        console.error('Failed to load messages page data', error);
      } finally {
        setLoadingList(false);
      }
    };

    if (currentUserId) fetchInitialData();
  }, [currentUserId]);

  useEffect(() => {
    const fetchConversation = async () => {
      const selectedId = getId(selectedUser?._id);
      if (!selectedId) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      try {
        const res = await api.get(`/messages/${selectedId}`);
        setMessages(res.data || []);
      } catch (error) {
        console.error('Failed to load conversation', error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchConversation();
  }, [selectedUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUserId) return;
    const socket = io(socketUrl);
    socket.emit('join', currentUserId);

    socket.on('new_message', (msg) => {
      const senderId = getId(msg.senderId);
      const receiverId = getId(msg.receiverId);
      const selectedId = getId(selectedUser?._id);
      const myId = currentUserId;

      if (
        selectedId &&
        ((senderId === selectedId && receiverId === myId) ||
          (senderId === myId && receiverId === selectedId))
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      setInbox((prev) => {
        const otherUserId = senderId === myId ? receiverId : senderId;
        const existingIndex = prev.findIndex((c) => getId(c.user?._id) === otherUserId);

        if (existingIndex >= 0) {
          const updated = [...prev];
          const convo = { ...updated[existingIndex], lastMessage: msg, updatedAt: msg.createdAt };
          updated.splice(existingIndex, 1);
          return [convo, ...updated];
        }

        const otherUser = users.find((u) => getId(u._id) === otherUserId);
        if (otherUser) {
          return [{ user: otherUser, lastMessage: msg, updatedAt: msg.createdAt }, ...prev];
        }
        return prev;
      });

      const isIncoming = receiverId === myId && senderId !== myId;
      const isActiveChat = selectedId && senderId === selectedId;
      if (isIncoming && !isActiveChat) {
        setUnreadByUser((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    });

    return () => socket.disconnect();
  }, [currentUserId, selectedUser?._id, users]);

  const listSource = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const convoByUserId = new Map();

    inbox.forEach((c) => {
      const userId = getId(c.user?._id);
      if (!userId) return;
      convoByUserId.set(userId, c);
    });

    const combined = users.map((u) => {
      const userId = getId(u._id);
      const convo = convoByUserId.get(userId);
      const lastMessage = convo?.lastMessage || null;
      const lastAtRaw = convo?.updatedAt || lastMessage?.createdAt || '';
      const lastAt = lastAtRaw ? new Date(lastAtRaw).getTime() : 0;

      return {
        user: u,
        lastMessage,
        lastAt,
      };
    });

    const filtered = q
      ? combined.filter(({ user: u }) =>
          u.username?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)
        )
      : combined;

    return filtered.sort((a, b) => b.lastAt - a.lastAt);
  }, [inbox, users, searchTerm]);

  const noConversationsYet = !loadingList && inbox.length === 0;

  useLayoutEffect(() => {
    if (!listRef.current || searchTerm.trim()) return;

    const topConversationId = listSource[0]?.user?._id
      ? getId(listSource[0].user._id)
      : '';

    const topChanged = previousTopConversationIdRef.current !== topConversationId;
    if (topChanged) {
      listRef.current.scrollTo({ top: 0, behavior: 'auto' });
      previousTopConversationIdRef.current = topConversationId;
    }
  }, [listSource, searchTerm]);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    const selectedId = getId(u?._id);
    if (selectedId) {
      setUnreadByUser((prev) => ({ ...prev, [selectedId]: 0 }));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const selectedId = getId(selectedUser?._id);
    const text = newMessage.trim();
    if (!selectedId || !text || sending) return;
    if (selectedId === currentUserId) {
      console.error('Blocked self-message send attempt');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/messages', {
        receiverId: selectedId,
        text,
        messageType: 'text',
      });

      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pt-28 md:pt-20 pb-6">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-8.5rem)] md:h-[78vh] overflow-hidden grid grid-cols-1 md:grid-cols-3">
          <aside className={`md:col-span-1 border-r border-gray-200 flex-col overflow-hidden ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Messages</h2>
              <div className="mt-3 flex items-center bg-gray-100 rounded-full px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search people"
                  className="bg-transparent outline-none ml-2 text-sm w-full"
                />
              </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto pt-2 pb-2">
              {loadingList ? (
                <p className="p-4 text-sm text-gray-500">Loading chats...</p>
              ) : listSource.length > 0 ? (
                listSource.map(({ user: u, lastMessage }) => {
                  const lastText = lastMessage?.text || 'No messages yet';
                  const unreadCount = unreadByUser[getId(u._id)] || 0;
                  const isMineLast = lastMessage && getId(lastMessage.senderId) === currentUserId;

                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`w-full flex items-center gap-3 p-3 text-left border-b border-gray-100 transition-colors overflow-visible ${
                        getId(selectedUser?._id) === getId(u._id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <img
                        src={u.profilePic || `https://i.pravatar.cc/150?u=${u.username}`}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">{u.name || u.username}</p>
                          {unreadCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {isMineLast ? `You: ${lastText}` : lastText}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4">
                  <p className="text-sm text-gray-500">No chats yet.</p>
                </div>
              )}
            </div>
          </aside>

          <section className={`md:col-span-2 flex-col min-h-0 ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
            {noConversationsYet ? (
              <div className="h-full flex items-center justify-center p-8">
                <div className="max-w-md text-center bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-8">
                  <p className="text-xl font-semibold text-gray-800">No conversations yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start connecting with developers and send your first message
                  </p>
                  <Link
                    to="/"
                    className="mt-5 inline-flex items-center justify-center rounded-full border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Find People
                  </Link>
                </div>
              </div>
            ) : !selectedUser ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Select a user to start chatting.
              </div>
            ) : (
              <>
                <header className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden inline-flex items-center rounded-full border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <img
                    src={selectedUser.profilePic || `https://i.pravatar.cc/150?u=${selectedUser.username}`}
                    alt={selectedUser.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{selectedUser.name || selectedUser.username}</p>
                    <p className="text-xs text-gray-500">@{selectedUser.username}</p>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/70">
                  {loadingMessages ? (
                    <p className="text-sm text-gray-500">Loading conversation...</p>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isMine = getId(msg.senderId) === currentUserId;
                      return (
                        <div key={msg._id} className={`mb-3 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-white/80' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Messages;
