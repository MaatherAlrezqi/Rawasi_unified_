// Updated ProviderMessages.jsx with enhanced visible scrollbar
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare, Send, Paperclip, Search, MoreVertical,
  Phone, Video, Image as ImageIcon, File, Smile, Loader2, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProviderSidebar from './ProviderSidebar';

export default function ProviderMessages() {
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [error, setError] = useState(null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get current user (provider)
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setCurrentUserId(user.id);
          console.log("✅ Provider user ID:", user.id);
        } else {
          setError("Please log in to send messages");
        }
      } catch (err) {
        console.error("❌ Error getting user:", err);
        setError("Failed to authenticate user");
      }
    };
    getCurrentUser();
  }, []);

  // Load all conversations for provider
  useEffect(() => {
    if (!currentUserId) return;

    const loadConversations = async () => {
      try {
        setLoading(true);
        console.log("📋 Loading all conversations for provider:", currentUserId);

        // Get conversations where current user is the provider
        const { data: conversationsData, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("provider_id", currentUserId)
          .order("updated_at", { ascending: false });

        if (convError) throw convError;

        console.log(`✅ Loaded ${conversationsData.length} conversations`);
        
        // Get user info from profiles for each conversation
        const conversationIds = conversationsData.map(c => c.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name, role")
          .in("id", conversationIds);
        
        // Create a map of user_id to profile
        const profilesMap = {};
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap[profile.id] = profile;
          });
        }
        
        // Format conversations with user info
        const formattedConversations = conversationsData.map(conv => {
          const profile = profilesMap[conv.user_id];
          return {
            ...conv,
            userName: profile?.name || conv.user_id?.substring(0, 8) || 'User',
            userEmail: '',
            userProfile: profile
          };
        });

        setConversations(formattedConversations);

        if (formattedConversations.length > 0) {
          setSelectedConversationId(formattedConversations[0].id);
        }

        setError(null);
      } catch (err) {
        console.error("❌ Error loading conversations:", err);
        setError(err.message || "Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUserId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId) return;

    const loadMessages = async () => {
      try {
        console.log("💬 Loading messages for conversation:", selectedConversationId);

        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", selectedConversationId)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;

        console.log(`✅ Loaded ${messagesData.length} messages`);

        const formattedMessages = messagesData.map((msg) => ({
          id: msg.id,
          sender: msg.sender_id === currentUserId ? "You" : selectedConversation?.userName || "User",
          message: msg.message_text,
          time: new Date(msg.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          type: msg.sender_id === currentUserId ? "sent" : "received",
          avatar: msg.sender_id === currentUserId ? null : selectedConversation?.userName?.substring(0, 2).toUpperCase()
        }));

        setMessages(formattedMessages);
      } catch (err) {
        console.error("❌ Error loading messages:", err);
      }
    };

    loadMessages();
  }, [selectedConversationId, currentUserId, selectedConversation]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentUserId) return;

    console.log("🔔 Setting up real-time subscription for provider conversations");

    const messagesChannel = supabase
      .channel(`provider_messages:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          console.log("📩 New message received:", payload);
          const newMsg = payload.new;

          if (newMsg.conversation_id === selectedConversationId) {
            setMessages((prev) => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;
              
              return [
                ...prev,
                {
                  id: newMsg.id,
                  sender: newMsg.sender_id === currentUserId ? "You" : selectedConversation?.userName || "User",
                  message: newMsg.message_text,
                  time: new Date(newMsg.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }),
                  type: newMsg.sender_id === currentUserId ? "sent" : "received",
                  avatar: newMsg.sender_id === currentUserId ? null : selectedConversation?.userName?.substring(0, 2).toUpperCase()
                }
              ];
            });
          }

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === newMsg.conversation_id
                ? { ...conv, last_message: newMsg.message_text, updated_at: newMsg.created_at }
                : conv
            )
          );
        }
      )
      .subscribe();

    return () => {
      console.log("🔕 Cleaning up real-time subscription");
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId, selectedConversationId, selectedConversation]);

  const send = async () => {
    if (!message.trim() || !selectedConversationId || !currentUserId) return;

    try {
      setSending(true);

      const { data, error } = await supabase.from("messages").insert({
        conversation_id: selectedConversationId,
        sender_id: currentUserId,
        message_text: message.trim(),
      }).select();

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({
          last_message: message.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedConversationId);

      setMessage('');
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setError("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <ProviderSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
            <p className="text-slate-600">Loading messages...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Enhanced Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #fb923c #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
          margin: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #fb923c 0%, #f97316 100%);
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #f97316 0%, #ea580c 100%);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
      
      <ProviderSidebar />

      <main className="flex-1 flex flex-col overflow-hidden h-screen">
        {/* Header */}
        <div className="p-8 pb-0 flex-shrink-0">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
          <p className="text-slate-600">Communicate with your clients</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 m-8 mt-6 bg-white rounded-2xl border-2 border-orange-100 overflow-hidden flex min-h-0 max-h-full">
          {/* Conversations List */}
          <div className="w-96 border-r border-orange-200/50 flex flex-col min-h-0 h-full">
            {/* Search */}
            <div className="p-4 border-b border-orange-200/50 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-scroll custom-scrollbar min-h-0 h-0">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  {searchTerm ? "No conversations found" : "No conversations yet"}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`p-4 border-b border-orange-100/50 cursor-pointer transition-all ${
                      selectedConversationId === conv.id
                        ? 'bg-orange-50 border-l-4 border-l-orange-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                        {conv.userName?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm truncate">
                            {conv.userName || 'User'}
                          </h4>
                          <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white px-6 py-4 border-b border-orange-200/50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                        {selectedConversation.userName?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {selectedConversation.userName || 'User'}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {selectedConversation.userEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-orange-50 rounded-lg transition-all">
                        <Phone className="w-5 h-5 text-slate-600" />
                      </button>
                      <button className="p-2 hover:bg-orange-50 rounded-lg transition-all">
                        <Video className="w-5 h-5 text-slate-600" />
                      </button>
                      <button className="p-2 hover:bg-orange-50 rounded-lg transition-all">
                        <MoreVertical className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Messages - Fixed Height with Scroll */}
                <div className="flex-1 overflow-y-scroll p-6 space-y-4 custom-scrollbar min-h-0 h-0">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      No messages yet
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end gap-2 max-w-md ${msg.type === 'sent' ? 'flex-row-reverse' : 'flex-row'}`}>
                          {msg.type === 'received' && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {msg.avatar}
                            </div>
                          )}
                          <div>
                            <div className={`px-4 py-3 rounded-2xl ${
                              msg.type === 'sent'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                                : 'bg-white text-slate-900 border border-orange-200'
                            }`}>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                            <p className={`text-xs text-slate-500 mt-1 ${msg.type === 'sent' ? 'text-right' : 'text-left'}`}>
                              {msg.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-white px-6 py-4 border-t border-orange-200/50 flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <button className="p-2 hover:bg-orange-50 rounded-lg transition-all">
                      <Paperclip className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-orange-50 rounded-lg transition-all">
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-orange-50 rounded-lg transition-all">
                      <File className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-12"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-orange-100 rounded-lg transition-all">
                        <Smile className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                    <button 
                      onClick={send}
                      disabled={!message.trim() || sending}
                      className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg font-medium">
                    Select a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
