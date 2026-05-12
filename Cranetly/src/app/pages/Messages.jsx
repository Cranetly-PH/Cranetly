import { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
} from '../../lib/api';
import { timeAgo } from '../utils/timeAgo';

export function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  async function loadConversations() {
    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) return;
    loadMessages(selectedConversation.id);
    markMessagesRead(selectedConversation.id, user.id).catch(console.error);
  }, [selectedConversation]);

  async function loadMessages(conversationId) {
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  // Real-time subscription for new messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        payload => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedConversation]);

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || !selectedConversation) return;
    const content = messageInput.trim();
    setMessageInput('');
    try {
      await sendMessage(selectedConversation.id, user.id, content);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessageInput(content); // Restore on failure
    }
  }

  function getOtherParticipant(conv) {
    if (!conv) return null;
    const isParticipant1 = conv.participant1_id === user.id;
    return isParticipant1 ? conv.participant2 : conv.participant1;
  }

  function getInitial(name) {
    return name?.charAt(0)?.toUpperCase() || '?';
  }

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    const name = other?.full_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow flex overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-white mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {conversations.length === 0 ? 'No conversations yet' : 'No results'}
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = getOtherParticipant(conv);
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      {getInitial(other?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm text-gray-900 dark:text-white truncate">
                          {other?.full_name || 'Unknown User'}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {conv.last_message_at ? timeAgo(new Date(conv.last_message_at)) : ''}
                        </span>
                      </div>
                      {conv.product_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                          Re: {conv.product_name}
                        </p>
                      )}
                      {conv.last_message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                {getInitial(getOtherParticipant(selectedConversation)?.full_name)}
              </div>
              <div>
                <h3 className="text-sm text-gray-900 dark:text-white">
                  {getOtherParticipant(selectedConversation)?.full_name || 'Unknown User'}
                </h3>
                {selectedConversation.product_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Re: {selectedConversation.product_name}
                  </p>
                )}
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => {
              const isMe = message.sender_id === user.id;
              return (
                <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMe
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {timeAgo(new Date(message.created_at))}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <Paperclip className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p>Select a conversation to start messaging</p>
            <p className="text-sm mt-2">You can start a conversation from any product listing.</p>
          </div>
        </div>
      )}
    </div>
  );
}
