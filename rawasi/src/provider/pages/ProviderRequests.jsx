import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3, Bell, Briefcase, Calendar, CheckCircle2, ChevronRight,
  Clock, DollarSign, FileText, FolderOpen, Home, MapPin, MessageSquare,
  Search, User, Users, X, Check, AlertCircle, Menu, Eye, Filter, Send, TrendingUp
} from 'lucide-react';

export default function ProviderRequests() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const requests = [
    {
      id: 1,
      title: 'Residential Villa Construction',
      client: 'Mohammed Al-Rashid',
      location: 'Riyadh North',
      budget: '2,500,000',
      status: 'pending',
      date: '2024-11-01',
      type: 'Residential',
      description: 'Modern 3-story villa with contemporary design featuring luxury finishes and smart home integration.',
      timeline: '10 months',
      size: '450 sqm',
      floors: '3',
      requirements: ['Strong thermal insulation', 'High fire resistance', 'Smart home ready']
    },
    {
      id: 2,
      title: 'Office Building Renovation',
      client: 'Fatima Al-Mutairi',
      location: 'King Fahd District',
      budget: '1,800,000',
      status: 'reviewing',
      date: '2024-10-28',
      type: 'Commercial',
      description: 'Full interior renovation with modern office spaces, meeting rooms, and common areas.',
      timeline: '6 months',
      size: '800 sqm',
      floors: '2',
      requirements: ['Modern acoustics', 'Energy efficient HVAC', 'Flexible workspace design']
    },
    {
      id: 3,
      title: 'Commercial Complex Development',
      client: 'Abdullah Group',
      location: 'Olaya District',
      budget: '15,000,000',
      status: 'accepted',
      date: '2024-10-15',
      type: 'Commercial',
      description: 'Mixed-use complex with retail spaces on ground floor and offices above.',
      timeline: '18 months',
      size: '3,500 sqm',
      floors: '5',
      requirements: ['High-capacity elevators', 'Commercial-grade HVAC', 'Parking structure']
    },
    {
      id: 4,
      title: 'School Building Extension',
      client: 'Education Foundation',
      location: 'Al Malqa',
      budget: '3,200,000',
      status: 'pending',
      date: '2024-10-20',
      type: 'Educational',
      description: 'New classroom block and facilities including science labs and library.',
      timeline: '8 months',
      size: '1,200 sqm',
      floors: '2',
      requirements: ['Safety compliant', 'Natural lighting', 'Accessible design']
    },
    {
      id: 5,
      title: 'Warehouse Construction',
      client: 'Logistics Co.',
      location: 'Industrial City',
      budget: '4,500,000',
      status: 'rejected',
      date: '2024-10-10',
      type: 'Industrial',
      description: 'Temperature-controlled storage facility with loading docks.',
      timeline: '7 months',
      size: '2,000 sqm',
      floors: '1',
      requirements: ['Climate control', 'Heavy load capacity', 'Security systems']
    }
  ];

  const stats = [
    { label: 'Total Requests', value: requests.length, color: 'orange', icon: FolderOpen },
    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'yellow', icon: Clock },
    { label: 'Under Review', value: requests.filter(r => r.status === 'reviewing').length, color: 'blue', icon: Eye },
    { label: 'Accepted', value: requests.filter(r => r.status === 'accepted').length, color: 'green', icon: CheckCircle2 }
  ];

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-orange-50 text-orange-700';
      case 'reviewing': return 'bg-blue-50 text-blue-700';
      case 'accepted': return 'bg-green-50 text-green-700';
      case 'rejected': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return Clock;
      case 'reviewing': return Eye;
      case 'accepted': return CheckCircle2;
      case 'rejected': return X;
      default: return AlertCircle;
    }
  };

const navItems = [
  { label: "Overview",   icon: Home,      to: "/provider/dashboard" },
  { label: "Dashboards", icon: Briefcase, badge: 4, to: "/provider/dashboards" },
  { label: "Requests",   icon: FolderOpen, badge: 3, to: "/provider/requests" },
  { label: "Messages",   icon: MessageSquare, badge: 2, to: "/provider/messages" },
  { label: "Reports",    icon: BarChart3, to: "/provider/reports" },
  { label: "Profile",    icon: User,      to: "/provider/profile" }
];
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20">
      {/* Sidebar */}
     <aside
  className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 text-white transition-all duration-300 z-50 ${
    sidebarOpen ? 'w-64' : 'w-20'
  }`}
>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img 
               src="/photo_2025-08-13_21-03-51.png"
              alt="Rawasi" 
              className="w-10 h-10 rounded-xl shadow-lg"
            />
            {sidebarOpen && (
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">RAWASI</div>
                <div className="text-xs text-slate-400">Provider Portal</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
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


        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-slate-800 text-white p-1.5 rounded-full shadow-lg hover:bg-slate-700 transition-all"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* User Profile */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
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
                <h1 className="text-2xl font-bold text-slate-900">Project Requests</h1>
                <p className="text-sm text-slate-600 mt-1">Review and respond to client project requests</p>
              </div>
              <button className="relative p-2.5 rounded-xl hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-all">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-2">{stat.label}</p>
                      <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl group-hover:bg-orange-100 transition-colors ${
                      stat.color === 'orange' ? 'bg-orange-50' :
                      stat.color === 'yellow' ? 'bg-yellow-50' :
                      stat.color === 'blue' ? 'bg-blue-50' :
                      'bg-green-50'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        stat.color === 'orange' ? 'text-orange-600' :
                        stat.color === 'yellow' ? 'text-yellow-600' :
                        stat.color === 'blue' ? 'text-blue-600' :
                        'text-green-600'
                      }`} />
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      stat.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                      stat.color === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      stat.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`} style={{ width: `${(stat.value / requests.length) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
              {['all', 'pending', 'reviewing', 'accepted', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2.5 rounded-xl font-medium capitalize transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 hover:border-blue-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <div 
                  key={request.id}
                  className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">{request.title}</h3>
                      <p className="text-sm text-slate-600">{request.type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1 ${getStatusColor(request.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {request.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>{request.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span>{request.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span>SAR {request.budget}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span>{request.timeline}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <button
                      onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                      className="w-full px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all font-medium text-sm"
                    >
                      {selectedRequest === request.id ? 'Hide Details' : 'View Details'}
                    </button>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          Accept
                        </button>
                        <button className="flex-1 px-4 py-2.5 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-all font-medium text-sm flex items-center justify-center gap-2">
                          <X className="w-4 h-4" />
                          Decline
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'accepted' && (
                      <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </button>
                    )}
                  </div>

                  {/* Expandable Details */}
                  {selectedRequest === request.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">Description</h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{request.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">Project Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <span className="text-slate-600">Size:</span>
                            <span className="font-medium text-slate-900 ml-2">{request.size}</span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <span className="text-slate-600">Floors:</span>
                            <span className="font-medium text-slate-900 ml-2">{request.floors}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">Requirements</h4>
                        <ul className="space-y-1">
                          {request.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No requests found</h3>
              <p className="text-slate-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
