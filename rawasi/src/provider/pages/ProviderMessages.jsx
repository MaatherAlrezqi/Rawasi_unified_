import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3, Bell, Briefcase, ChevronRight, FolderOpen, Home,
  MessageSquare, User, Menu, Send, Paperclip, Search, MoreVertical,
  Phone, Video, Image as ImageIcon, File, Smile
} from 'lucide-react';

export default function ProviderMessages() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const messages = [
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
      message: 'That\'s great to hear! Can we schedule a site visit for next week?',
      time: '10:30 AM',
      type: 'received',
      avatar: 'MR'
    },
    {
      id: 4,
      sender: 'Mohammed Al-Rashid',
      message: 'I\'d like to see the progress in person.',
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

const navItems = [
  { label: "Overview",   icon: Home,      to: "/provider/dashboard" },
  { label: "Dashboards", icon: Briefcase, badge: 4, to: "/provider/dashboards" },
  { label: "Requests",   icon: FolderOpen, badge: 3, to: "/provider/requests" },
  { label: "Messages",   icon: MessageSquare, badge: 2, to: "/provider/messages" },
  { label: "Reports",    icon: BarChart3, to: "/provider/reports" },
  { label: "Profile",    icon: User,      to: "/provider/profile" }
];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/20">
      {/* Left Sidebar */}
     <aside
  className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 text-white transition-all duration-300 z-50 ${
    sidebarOpen ? 'w-64' : 'w-20'
  }`}
>
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <img 
               src="/photo_2025-08-13_21-03-51.png" 
              alt="Rawasi" 
              className="w-10 h-10 rounded-xl shadow-lg"
            />
            {sidebarOpen && (
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  RAWASI
                </div>
                <div className="text-xs text-orange-400 font-medium -mt-0.5">Provider Portal</div>
              </div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2">
  {navItems.map((item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.to;

    return (
      <Link
        key={item.to}
        to={item.to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
          isActive
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/50'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {sidebarOpen && (
          <>
            <span className="font-medium">{item.label}</span>

            {item.badge && (
              <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  })}
</nav>


        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-slate-800 text-white p-1.5 rounded-full shadow-lg hover:bg-slate-700 transition-all"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
                AM
              </div>
              <div>
                <p className="text-sm font-medium text-white">Ahmad Mohammed</p>
                <p className="text-xs text-slate-400">Provider</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                <p className="text-sm text-slate-600 mt-1">Communicate with clients and project owners</p>
              </div>
              <button className="relative p-2.5 rounded-xl hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-all">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Layout */}
        <div className="flex h-[calc(100vh-88px)]">
          {/* Conversations List */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-all ${
                    selectedConversation === conv.id
                      ? 'bg-orange-50 border-l-4 border-l-orange-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-md">
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{conv.name}</h4>
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{conv.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{conv.project}</p>
                      <p className="text-sm text-slate-600 truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <div className="flex-shrink-0 mt-1">
                        <span className="inline-block px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                          {conv.unread}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50">
            {/* Chat Header */}
            {currentConversation && (
              <>
                <div className="bg-white px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-md">
                          {currentConversation.avatar}
                        </div>
                        {currentConversation.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{currentConversation.name}</h3>
                        <p className="text-xs text-slate-600">{currentConversation.project}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                        <Phone className="w-5 h-5 text-slate-600" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                        <Video className="w-5 h-5 text-slate-600" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-md ${msg.type === 'sent' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {msg.type === 'received' && (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {msg.avatar}
                          </div>
                        )}
                        <div>
                          <div className={`px-4 py-3 rounded-2xl ${
                            msg.type === 'sent'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                              : 'bg-white text-slate-900 border border-slate-200'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
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
                <div className="bg-white px-6 py-4 border-t border-slate-200">
                  <div className="flex items-end gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                      <Paperclip className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                      <File className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-lg transition-all">
                        <Smile className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                    <button className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
