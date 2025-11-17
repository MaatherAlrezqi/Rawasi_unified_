import React, { useState, useEffect } from 'react';
import ProviderSidebar from './ProviderSidebar';
import {
  Calendar, CheckCircle2, Clock, DollarSign, MapPin, Search,
  X, Check, AlertCircle, Eye, Filter, Send, TrendingUp, Building2
} from 'lucide-react';
import { requestService } from '../../services/requestService';
import { supabase } from '../../lib/supabaseClient';

export default function ProviderRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Supabase data
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    accepted: 0,
    rejected: 0
  });

  // Fetch + realtime
  useEffect(() => {
    let channel;

    const init = async () => {
      await fetchRequests();
      requestNotificationPermission();
      channel = await setupRealtimeSubscription();
    };

    init();

    return () => {
      if (channel) {
        requestService.unsubscribe(channel);
      }
    };
  }, []);

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const data = await requestService.getProviderRequests(user.id);
      setRequests(data);
      updateStats(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (requestsData) => {
    setStats({
      total: requestsData.length,
      pending: requestsData.filter(r => r.status === 'pending').length,
      reviewing: requestsData.filter(r => r.status === 'reviewing').length,
      accepted: requestsData.filter(r => r.status === 'accepted').length,
      rejected: requestsData.filter(r => r.status === 'rejected').length
    });
  };

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const channel = requestService.subscribeToProviderRequests(
      user.id,
      (payload) => {
        console.log('New request change:', payload);

        if (payload.eventType === 'INSERT') {
          setRequests(prev => {
            const updated = [payload.new, ...prev];
            updateStats(updated);
            return updated;
          });

          showNotification(
            'New Request Received!',
            `New construction request for ${payload.new.project_name}`
          );
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => {
            const updated = prev.map(r => r.id === payload.new.id ? payload.new : r);
            updateStats(updated);
            return updated;
          });
        }
      }
    );

    return channel;
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/photo_2025-08-13_21-03-51.png' });
    }
  };

  const handleResponse = async (requestId, action) => {
    if (processingId) return;

    setProcessingId(requestId);
    try {
      await requestService.respondToRequest(requestId, action);
      await fetchRequests();
      setSelectedRequest(null);
      
      showNotification(
        'Response Sent',
        `You ${action === 'accept' ? 'accepted' : 'rejected'} the request`
      );
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      alert(`Failed to ${action} request. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
      accepted: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'reviewing': return <Eye className="w-4 h-4" />;
      case 'accepted': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <ProviderSidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Project Requests</h1>
          <p className="text-slate-600">Manage incoming construction requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Requests</div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-yellow-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
            </div>
            <div className="text-sm text-slate-600">Pending</div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <div className="text-2xl font-bold text-slate-900">{stats.reviewing}</div>
            </div>
            <div className="text-sm text-slate-600">Reviewing</div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-green-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="text-2xl font-bold text-slate-900">{stats.accepted}</div>
            </div>
            <div className="text-sm text-slate-600">Accepted</div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-red-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-5 h-5 text-red-600" />
              <div className="text-2xl font-bold text-slate-900">{stats.rejected}</div>
            </div>
            <div className="text-sm text-slate-600">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('accepted')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  filterStatus === 'accepted'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Accepted
              </button>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {request.project_name || 'Unnamed Project'}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        {request.location || 'Location not specified'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-600" />
                        {request.technology || 'Technology not specified'}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                        {request.budget ? `SAR ${(request.budget / 1000).toFixed(0)}K` : 'Budget not specified'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Date not specified'}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                  </div>
                </div>

                {request.description && (
                  <p className="text-slate-600 mb-4">{request.description}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-orange-200 text-orange-600 font-medium hover:bg-orange-50 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleResponse(request.id, 'accept')}
                        disabled={processingId === request.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleResponse(request.id, 'reject')}
                        disabled={processingId === request.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-orange-200">
                <div className="flex items-start justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedRequest.project_name || 'Project Details'}
                  </h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <p className="text-slate-900">{selectedRequest.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Technology</label>
                  <p className="text-slate-900">{selectedRequest.technology || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Budget</label>
                  <p className="text-slate-900">
                    {selectedRequest.budget ? `SAR ${selectedRequest.budget.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <p className="text-slate-900">{selectedRequest.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status?.charAt(0).toUpperCase() + selectedRequest.status?.slice(1)}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-orange-200 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-6 py-2 rounded-xl border-2 border-orange-200 text-slate-700 font-medium hover:bg-orange-50 transition-all"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleResponse(selectedRequest.id, 'accept');
                      }}
                      className="px-6 py-2 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-all"
                    >
                      Accept Request
                    </button>
                    <button
                      onClick={() => {
                        handleResponse(selectedRequest.id, 'reject');
                      }}
                      className="px-6 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
                    >
                      Reject Request
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
