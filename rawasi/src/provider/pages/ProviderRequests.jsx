// Updated ProviderRequests.jsx with consistent sidebar layout
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Search,
  Users,
  X,
  Check,
  AlertCircle,
  Send,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import ProviderSidebar from './ProviderSidebar';

export default function ProviderRequests() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Load requests for current provider
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from auth
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          setError("You are not logged in as a provider.");
          setLoading(false);
          return;
        }

        // Get provider row linked to this user
        const { data: providerRow, error: providerError } = await supabase
          .from("provider")
          .select("provider_id, company_name")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (providerError) throw providerError;
        if (!providerRow) {
          setError("No provider profile is linked to this account.");
          setLoading(false);
          return;
        }

        const providerId = providerRow.provider_id;

        // Get requests from project_requests
        const { data, error: reqError } = await supabase
          .from("project_requests")
          .select("*")
          .eq("provider_id", providerId)
          .order("created_at", { ascending: false });

        if (reqError) throw reqError;

        const mapped =
          (data || []).map((row) => ({
            id: row.id,
            title: row.title || "Untitled project",
            client: row.client_name || "Client",
            location: row.location || "-",
            budget: row.budget || 0,
            status: row.status || "pending",
            date: row.created_at,
            type: row.project_type || "Residential",
            description: row.description || "",
            timeline: row.timeline || null,
            size: row.size || null,
            floors: row.floors || null,
            requirements: row.requirements || [],
            project_id: row.project_id,
            user_id: row.user_id,
          })) ?? [];

        setRequests(mapped);
      } catch (err) {
        console.error("Error loading provider requests:", err);
        setError(err.message || "Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const handleStatusChange = async (requestId, newStatus) => {
    const previousRequests = [...requests];

    try {
      setUpdatingId(requestId);

      // Find the request to get project_id
      const request = requests.find((r) => r.id === requestId);
      if (!request) throw new Error("Request not found");

      // Optimistic update
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );

      // Update project_requests table
      const { error: requestError } = await supabase
        .from("project_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Update projects table
      if (request.project_id) {
        // Get current provider info for accepted status
        let providerInfo = {};
        if (newStatus === "accepted") {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const { data: providerRow } = await supabase
            .from("provider")
            .select("provider_id, company_name")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (providerRow) {
            providerInfo = {
              provider_id: providerRow.provider_id,
              provider_name: providerRow.company_name,
            };
          }
        }

        const { error: projectError } = await supabase
          .from("projects")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
            ...providerInfo,
          })
          .eq("id", request.project_id);

        if (projectError) {
          console.error("Failed to update project status:", projectError);
        }
      }

      toast.success(
        newStatus === "accepted"
          ? "✅ Request accepted! Project status updated."
          : "❌ Request declined. Project status updated."
      );
    } catch (err) {
      console.error("Error updating status:", err);
      setRequests(previousRequests);
      toast.error("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendMessage = (request) => {
    navigate("/provider/messages");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      accepted: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      accepted: CheckCircle2,
      rejected: X,
    };
    return icons[status] || Clock;
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || req.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <ProviderSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
            <p className="text-slate-600">Loading requests...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <ProviderSidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Project Requests</h1>
          <p className="text-slate-600">Review and manage incoming project requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Inbox className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Requests</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.pending}</div>
            <div className="text-sm text-slate-600">Pending</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.accepted}</div>
            <div className="text-sm text-slate-600">Accepted</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-100">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.rejected}</div>
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
                placeholder="Search requests..."
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
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  filterStatus === 'rejected'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Requests Grid */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              const isPending = request.status === "pending";
              const isAccepted = request.status === "accepted";

              return (
                <div
                  key={request.id}
                  className="group bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                        {request.title}
                      </h3>
                      <p className="text-sm text-slate-600">{request.type}</p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase flex items-center gap-1 border ${getStatusColor(
                        request.status
                      )}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {request.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <Users className="w-4 h-4 text-orange-600" />
                      </div>
                      <span>{request.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <MapPin className="w-4 h-4 text-orange-600" />
                      </div>
                      <span>{request.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                      </div>
                      <span>
                        SAR {Number(request.budget).toLocaleString("en-US")}
                      </span>
                    </div>
                    {request.timeline && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                          <Calendar className="w-4 h-4 text-orange-600" />
                        </div>
                        <span>{request.timeline}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-orange-100 space-y-2">
                    <button
                      onClick={() =>
                        setSelectedRequest(
                          selectedRequest === request.id ? null : request.id
                        )
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all font-medium text-sm"
                    >
                      {selectedRequest === request.id
                        ? "Hide Details"
                        : "View Details"}
                    </button>

                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleStatusChange(request.id, "accepted")
                          }
                          disabled={updatingId === request.id}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4" />
                          {updatingId === request.id ? "Saving..." : "Accept"}
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(request.id, "rejected")
                          }
                          disabled={updatingId === request.id}
                          className="flex-1 px-4 py-2.5 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-all font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          {updatingId === request.id ? "Saving..." : "Decline"}
                        </button>
                      </div>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => handleSendMessage(request)}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Message
                      </button>
                    )}
                  </div>

                  {/* Expandable Details */}
                  {selectedRequest === request.id && (
                    <div className="mt-4 pt-4 border-t border-orange-100 space-y-4">
                      {request.description && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm">
                            Description
                          </h4>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {request.description}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm">
                          Project Details
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {request.size && (
                            <div className="bg-slate-50 rounded-lg p-2">
                              <span className="text-slate-600">Size:</span>
                              <span className="font-medium text-slate-900 ml-2">
                                {request.size}
                              </span>
                            </div>
                          )}
                          {request.floors && (
                            <div className="bg-slate-50 rounded-lg p-2">
                              <span className="text-slate-600">Floors:</span>
                              <span className="font-medium text-slate-900 ml-2">
                                {request.floors}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {request.requirements &&
                        request.requirements.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2 text-sm">
                              Requirements
                            </h4>
                            <ul className="space-y-1">
                              {request.requirements.map((req, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center gap-2 text-sm text-slate-700"
                                >
                                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredRequests.length === 0 && !error && (
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No requests found
            </h3>
            <p className="text-slate-600">
              {searchTerm
                ? "Try adjusting your search or filter criteria"
                : "You don't have any project requests yet"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
