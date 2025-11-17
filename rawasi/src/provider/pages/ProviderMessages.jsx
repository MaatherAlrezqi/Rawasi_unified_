import React, { useState } from 'react';
import ProviderSidebar from './ProviderSidebar';
import {
  Send, Paperclip, Search, MoreVertical, Phone, Video, Image as ImageIcon, File, Smile
} from 'lucide-react';

export default function ProviderMessages() {
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const conversations = [
    {
      id: 1,
      name: 'Mohammed Al-Rashid',
      role: 'Project Owner',
      project: 'Modern Villa Construction',
      lastMessage: 'Can we schedule a site visit for next week?',
      time: '10:30 AM',
      unread: 2,
      online: true,
      avatar: 'MR'
    },
    {
      id: 2,
      name: 'Fatima Al-Mutairi',
      role: 'Project Owner',
      project: 'Office Renovation',
      lastMessage: 'The updated plans look great, thank you!',
      time: 'Yesterday',
      unread: 0,
      online: false,
      avatar: 'FM'
    },
    {
      id: 3,
      name: 'Abdullah Group',
      role: 'Client',
      project: 'Commercial Complex',
      lastMessage: 'When can we expect the final proposal?',
      time: '2 days ago',
      unread: 1,
      online: true,
      avatar: 'AG'
    },
    {
      id: 4,
      name: 'Education Foundation',
      role: 'Client',
      project: 'School Extension',
      lastMessage: 'Thank you for the detailed breakdown',
      time: '3 days ago',
      unread: 0,
      online: false,
      avatar: 'EF'
    }
  ];

  const messagesList = [
    {
      id: 1,
      sender: 'Mohammed Al-Rashid',
      message: 'Good morning! I wanted to discuss the progress on the villa project.',
      time: '10:15 AM',
      type: 'received',
      avatar: 'MR'
    },
    {
      id: 2,
      sender: 'You',
      message: 'Good morning Mohammed! The structural work is progressing well. We\'re currently at 65% completion.',
      time: '10:18 AM',
      type: 'sent'
    },
    {
      id: 3,
      sender: 'Mohammed Al-Rashid',
      message: 'That\'s great to hear! I\'d like to visit the site.',
      time: '10:20 AM',
      type: 'received',
      avatar: 'MR'
    },
    {
      id: 4,
      sender: 'You',
      message: 'Of course! I\'ll arrange a site visit for next Tuesday at 10 AM. Does that work for you?',
      time: '10:25 AM',
      type: 'sent'
    },
    {
      id: 5,
      sender: 'Mohammed Al-Rashid',
      message: 'Can we schedule a site visit for next week?',
      time: '10:30 AM',
      type: 'received',
      avatar: 'MR'
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.project.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <ProviderSidebar />

      <main className="flex-1 flex">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-orange-200/50 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-orange-200/50">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Messages</h2>
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
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-4 border-b border-orange-100 cursor-pointer transition-all ${
                  selectedConversation === conv.id
                    ? 'bg-orange-50 border-l-4 border-l-orange-500'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                      {conv.avatar}
                    </div>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{conv.name}</h3>
                      <span className="text-xs text-slate-500 ml-2">{conv.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{conv.project}</p>
                    <p className="text-sm text-slate-500 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {conv.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-orange-200/50 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold">
                        {currentConversation.avatar}
                      </div>
                      {currentConversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{currentConversation.name}</h2>
                      <p className="text-sm text-slate-600">{currentConversation.project}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-3 rounded-xl hover:bg-orange-50 transition-all">
                      <Phone className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-3 rounded-xl hover:bg-orange-50 transition-all">
                      <Video className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-3 rounded-xl hover:bg-orange-50 transition-all">
                      <MoreVertical className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesList.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-[70%] ${msg.type === 'sent' ? 'flex-row-reverse' : ''}`}>
                      {msg.type === 'received' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {msg.avatar}
                        </div>
                      )}
                      <div>
                        <div className={`px-4 py-3 rounded-2xl ${
                          msg.type === 'sent'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                            : 'bg-white border-2 border-orange-100 text-slate-900'
                        }`}>
                          <p>{msg.message}</p>
                        </div>
                        <p className={`text-xs text-slate-500 mt-1 ${msg.type === 'sent' ? 'text-right' : 'text-left'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-orange-200/50 bg-white">
                <div className="flex items-center gap-3">
                  <button className="p-3 rounded-xl hover:bg-orange-50 transition-all">
                    <Paperclip className="w-5 h-5 text-slate-600" />
                  </button>
                  <button className="p-3 rounded-xl hover:bg-orange-50 transition-all">
                    <ImageIcon className="w-5 h-5 text-slate-600" />
                  </button>
                  <button className="p-3 rounded-xl hover:bg-orange-50 transition-all">
                    <File className="w-5 h-5 text-slate-600" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-orange-50 transition-all">
                      <Smile className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:shadow-lg transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No conversation selected</h3>
                <p className="text-slate-600">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
