import React, { useState, useEffect } from "react";
import { requestService } from "../services/requestService";
import { supabase } from "../lib/supabaseClient";


const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  
useEffect(() => {
  let channel;

  const init = async () => {
    await fetchRequests();

    // Ask for notification permission once
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    channel = await setupRealtimeSubscription();
  };

  init();

  return () => {
    if (channel) {
      requestService.unsubscribe(channel);
    }
  };
}, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const data = await requestService.getProjectOwnerRequests(user.id);
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
      accepted: requestsData.filter(r => r.status === 'accepted').length,
      rejected: requestsData.filter(r => r.status === 'rejected').length
    });
  };

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const channel = requestService.subscribeToProjectOwnerRequests(
      user.id,
      (payload) => {
        console.log('Realtime update:', payload);
        
        if (payload.eventType === 'INSERT') {
          setRequests(prev => {
            const updated = [payload.new, ...prev];
            updateStats(updated);
            return updated;
          });
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => {
            const updated = prev.map(req => 
              req.id === payload.new.id ? payload.new : req
            );
            updateStats(updated);
            return updated;
          });
          
          // Show notification for status changes
          if (payload.old.status !== payload.new.status) {
            showNotification(
              `Request ${payload.new.status}!`,
              `Your request for "${payload.new.project_title}" has been ${payload.new.status}.`
            );
          }
        } else if (payload.eventType === 'DELETE') {
          setRequests(prev => {
            const updated = prev.filter(req => req.id !== payload.old.id);
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
      new Notification(title, { body, icon: '/logo.png' });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      pending: '⏳',
      accepted: '✓',
      rejected: '✕'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status]} flex items-center gap-1`}>
        <span>{icons[status]}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredRequests = requests.filter(req => 
    filter === 'all' ? true : req.status === filter
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Requests</h1>
        <p className="text-gray-600">Track the status of your provider requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-600 mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-yellow-800 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-green-800 mb-1">Accepted</p>
          <p className="text-2xl font-bold text-green-900">{stats.accepted}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-red-800 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {['all', 'pending', 'accepted', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              filter === status
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-sm">
              ({status === 'all' ? requests.length : requests.filter(r => r.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-600 text-lg">No {filter !== 'all' ? filter : ''} requests found</p>
          <p className="text-gray-500 text-sm mt-2">Send a request to providers to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(request => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {request.project_title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Request ID: {request.id.slice(0, 8)}...
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              {/* Project Description */}
              {request.project_description && (
                <p className="text-gray-700 mb-4">{request.project_description}</p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600 mb-1">Budget</p>
                  <p className="font-semibold text-gray-900">
                    ${request.budget?.toLocaleString() || 'Not specified'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600 mb-1">Timeline</p>
                  <p className="font-semibold text-gray-900">{request.timeline || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600 mb-1">Sent</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Message */}
              {request.message && (
                <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-sm text-gray-600 mb-1 font-medium">Your Message:</p>
                  <p className="text-gray-800">{request.message}</p>
                </div>
              )}

              {/* Response Info */}
              {request.responded_at && (
                <div className="flex items-center text-sm text-gray-600 pt-3 border-t border-gray-200">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Response received: {new Date(request.responded_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
