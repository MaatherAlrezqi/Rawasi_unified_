// src/pages/OwnerRequests.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  FolderOpen,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  Home,
  Search,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// ==================== Helpers ====================

function getStatusColor(status) {
  switch (status) {
    case "pending":
      return "bg-orange-50 text-orange-700";
    case "reviewing":
      return "bg-blue-50 text-blue-700";
    case "accepted":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-50 text-slate-700";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "pending":
      return Clock;
    case "reviewing":
      return AlertCircle;
    case "accepted":
      return CheckCircle2;
    case "rejected":
      return X;
    default:
      return AlertCircle;
  }
}

function mapRowToRequest(row) {
  return {
    id: row.id,
    title: row.title || "Untitled project",
    client: row.client_name || "You",
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
    provider_id: row.provider_id,
  };
}

// ==================== Component ====================

export default function OwnerRequests() {
  const [requests, setRequests] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // -------- 1) تحميل الطلبات لأول مرة --------
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          setError("You are not logged in as a project owner.");
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);

        // ✅ هذا الجزء موجود كما هو: نجلب طلبات هذا اليوزر فقط
        const { data, error: reqError } = await supabase
          .from("project_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (reqError) throw reqError;

        const mapped = (data || []).map(mapRowToRequest);
        setRequests(mapped);
      } catch (err) {
        console.error("Error loading owner requests:", err);
        setError(err.message || "Failed to load your requests.");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  // -------- 2) Real-time updates --------
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`owner-project-requests-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_requests",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          setRequests((prev) => {
            if (payload.eventType === "INSERT") {
              const newReq = mapRowToRequest(payload.new);
              const exists = prev.some((r) => r.id === newReq.id);
              return exists ? prev : [newReq, ...prev];
            }

            if (payload.eventType === "UPDATE") {
              const updatedReq = mapRowToRequest(payload.new);
              return prev.map((r) => (r.id === updatedReq.id ? updatedReq : r));
            }

            if (payload.eventType === "DELETE") {
              const deletedId = payload.old.id;
              return prev.filter((r) => r.id !== deletedId);
            }

            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log("Owner requests realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // -------- 3) فلاتر وبحث --------
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus =
        filterStatus === "all" || r.status === filterStatus;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === "" ||
        r.title.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [requests, filterStatus, searchTerm]);

  const stats = useMemo(
    () => [
      {
        label: "Total Requests",
        value: requests.length,
        color: "orange",
        icon: FolderOpen,
      },
      {
        label: "Pending",
        value: requests.filter((r) => r.status === "pending").length,
        color: "yellow",
        icon: Clock,
      },
      {
        label: "Under Review",
        value: requests.filter((r) => r.status === "reviewing").length,
        color: "blue",
        icon: AlertCircle,
      },
      {
        label: "Accepted",
        value: requests.filter((r) => r.status === "accepted").length,
        color: "green",
        icon: CheckCircle2,
      },
    ],
    [requests]
  );

  // ==================== JSX ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/40 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-semibold text-slate-900">
                My Project Requests
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                Track all requests you sent to providers and see their status in
                real time.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const barColorMap = {
              orange: "from-orange-500 to-amber-400",
              yellow: "from-yellow-400 to-amber-300",
              blue: "from-sky-500 to-cyan-400",
              green: "from-emerald-500 to-lime-400",
            };

            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-semibold mt-1 text-slate-900">
                      {stat.value ?? 0}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-orange-50">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      barColorMap[stat.color]
                    }`}
                    style={{
                      width:
                        requests.length > 0
                          ? `${(stat.value / Math.max(requests.length, 1)) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* Search + Filters */}
        <section className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by project title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {["all", "pending", "reviewing", "accepted", "rejected"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium capitalize whitespace-nowrap transition-all ${
                    filterStatus === status
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-300 hover:border-orange-300"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </section>

        {/* Loading / Error / Empty */}
        {loading && (
          <div className="py-16 text-center text-slate-500 text-sm">
            Loading your requests...
          </div>
        )}

        {error && !loading && (
          <div className="py-6 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filteredRequests.length === 0 && (
          <div className="py-16 text-center text-slate-500 text-sm">
            No requests found. Start by creating a project and sending
            recommendations to providers.
          </div>
        )}

        {/* Requests Grid */}
        {!loading && !error && filteredRequests.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              const isSelected = selectedRequest === request.id;

              return (
                <div
                  key={request.id}
                  className="group bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-orange-300 hover:shadow-md transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors text-sm md:text-base">
                        {request.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {request.type}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase flex items-center gap-1 ${getStatusColor(
                        request.status
                      )}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {request.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs md:text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <div className="p-1.5 rounded-lg bg-orange-50">
                        <Users className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <span>Client: {request.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <div className="p-1.5 rounded-lg bg-orange-50">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <span>{request.location}</span>
                    </div>
                    {request.budget ? (
                      <div className="flex items-center gap-2 text-slate-700">
                        <div className="p-1.5 rounded-lg bg-orange-50">
                          <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <span>
                          Budget:{" "}
                          {Number(request.budget).toLocaleString("en-US")} SAR
                        </span>
                      </div>
                    ) : null}
                    {request.timeline && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <div className="p-1.5 rounded-lg bg-orange-50">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <span>{request.timeline}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Sent at:{" "}
                      {request.date
                        ? new Date(request.date).toLocaleString()
                        : "-"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <button
                      onClick={() =>
                        setSelectedRequest(isSelected ? null : request.id)
                      }
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs md:text-sm font-medium hover:bg-orange-50 hover:text-orange-700 transition-colors"
                    >
                      {isSelected ? "Hide details" : "View details"}
                    </button>

                    {isSelected && (
                      <div className="mt-3 space-y-3 text-xs md:text-sm">
                        {request.description && (
                          <div>
                            <p className="text-slate-800 font-semibold mb-1">
                              Description
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                              {request.description}
                            </p>
                          </div>
                        )}

                        {(request.size || request.floors) && (
                          <div>
                            <p className="text-slate-800 font-semibold mb-1">
                              Project details
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {request.size && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                                  <span className="text-slate-500">Size:</span>
                                  <span className="ml-1 text-slate-900 font-medium">
                                    {request.size}
                                  </span>
                                </div>
                              )}
                              {request.floors && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                                  <span className="text-slate-500">
                                    Floors:
                                  </span>
                                  <span className="ml-1 text-slate-900 font-medium">
                                    {request.floors}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {request.requirements &&
                          request.requirements.length > 0 && (
                            <div>
                              <p className="text-slate-800 font-semibold mb-1">
                                Requirements
                              </p>
                              <ul className="space-y-1">
                                {request.requirements.map((req, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-center gap-2 text-slate-800"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
