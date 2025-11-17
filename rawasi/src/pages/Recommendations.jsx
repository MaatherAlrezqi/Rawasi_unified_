// src/pages/Recommendations.jsx
import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { requestService } from "../services/requestService";
import { saveDraftProject } from "../services/projectService";
import {
  MapPin,
  Star,
  Search,
  X,
  Award,
  Loader2,
  ChevronDown,
  Sparkles,
  Users,
  CheckCircle,
  Send,
  MessageCircle,
  TrendingUp,
  Brain,
} from "lucide-react";
import { Section } from "../components/ui.jsx";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Recommendations({
  project,
  onCompareToggle,
  selectedCompare,
  onProceed,
}) {
  const navigate = useNavigate();

  const [savedProject, setSavedProject] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [llmInsights, setLlmInsights] = useState(null);
  const [projectComplexity, setProjectComplexity] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [techFilter, setTechFilter] = useState("All Technologies");
  const [requestingId, setRequestingId] = useState(null);
  const [requested, setRequested] = useState(new Set());
  const [autoProjectId, setAutoProjectId] = useState(null);

  const t = {
    title: "AI Recommendations",
    subtitle: "LLM-powered matches based on your project requirements",
    loadingLLM: "Our AI is analyzing your project requirements...",
    topPicks: "Top Picks",
    allProviders: "All Providers",
    search: "Search providers...",
    all: "All Technologies",
    score: "Match Score",
    compare: "Compare",
    aiReason: "Why recommended",
    request: "Send request",
    message: "Message",
    sending: "Sending...",
    sent: "Sent",
    showing: "Showing",
    of: "of",
    providers: "providers",
    complexity: "Project Complexity",
  };

  // -------- Load recommendations (from project.recommendations or API) --------
  useEffect(() => {
    const load = async () => {
      if (!project) return;

      setIsLoading(true);
      setError(null);

      try {
        // 0) Ensure we have a project row
        let workingProject = project;
        if (!project.id && !project.projectId) {
          const inserted = await saveDraftProject(project); // writes to public.projects
          workingProject = { ...project, id: inserted.id };
          setSavedProject(inserted);
        } else {
          setSavedProject(project);
        }

        // 1) If recs embedded in project, use them
        if (
          workingProject.recommendations?.success &&
          workingProject.recommendations?.suppliers
        ) {
          const recs = workingProject.recommendations;
          const tx = recs.suppliers.map((s, i) => ({
            id: `llm_${i}`,
            providerId: s.provider_id ?? null,
            name: s.name,
            locationEn: s.region,
            technologies: Array.isArray(s.technology)
              ? s.technology
              : s.technology
              ? [s.technology]
              : [],
            rating: s.rating,
            matchScore: s.match_score,
            matchReasons: s.match_reasons || [],
            contact: s.contact,
            email: s.email,
            phone: s.phone,
            aiReason:
              (s.match_reasons || []).join(". ") ||
              "Matches your project requirements",
            matched_technology: s.matched_technology,
            finalScore: (s.match_score || 0) / 100,
          }));

          setRecommendations(tx);
          setLlmInsights(recs.ai_insights);
          setProjectComplexity(recs.project_complexity);
          setIsLoading(false);
          return;
        }

        // 2) Otherwise call recommendation API
        const API_URL =
          import.meta.env.VITE_RECOMMENDATION_API_URL ||
          "http://localhost:5001/api";

        const payload = {
          name: workingProject.name,
          type: workingProject.type,
          location: workingProject.location,
          sizeSqm: workingProject.sizeSqm || workingProject.size_sqm,
          budget: workingProject.budget,
          timelineMonths:
            workingProject.timelineMonths || workingProject.timeline_months,
          Nfloors: workingProject.Nfloors || workingProject.n_floors,
          techNeeds:
            workingProject.techNeeds || workingProject.tech_needs || [],
        };

        const res = await fetch(`${API_URL}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok)
          throw new Error(`API ${API_URL}/recommend returned ${res.status}`);

        const data = await res.json();
        if (!data.success)
          throw new Error(data.message || "No recommendations found");

        const tx = data.suppliers.map((s, i) => ({
          id: `llm_${i}`,
          providerId: s.provider_id ?? null,
          name: s.name,
          locationEn: s.region,
          technologies: Array.isArray(s.technology)
            ? s.technology
            : s.technology
            ? [s.technology]
            : [],
          rating: s.rating,
          matchScore: s.match_score,
          matchReasons: s.match_reasons || [],
          contact: s.contact,
          email: s.email,
          phone: s.phone,
          aiReason:
            (s.match_reasons || []).join(". ") ||
            "Matches your project requirements",
          matched_technology: s.matched_technology,
          finalScore: (s.match_score || 0) / 100,
        }));

        setRecommendations(tx);
        setLlmInsights(data.ai_insights);
        setProjectComplexity(data.project_complexity);
      } catch (e) {
        console.error(e);
        setError(e.message);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [project]);

  // --------- Filters / memo ---------
  const techOptions = useMemo(() => {
    const s = new Set([t.all]);
    recommendations.forEach((p) =>
      (p.technologies || []).forEach((x) => s.add(x))
    );
    return Array.from(s);
  }, [recommendations]);

  const filteredProviders = useMemo(
    () =>
      recommendations.filter((p) => {
        const techOk =
          techFilter === t.all ||
          (p.technologies || []).includes(techFilter);
        const nameOk = String(p.name)
          .toLowerCase()
          .includes(query.toLowerCase());
        return techOk && nameOk;
      }),
    [recommendations, query, techFilter]
  );

  const topPicks = recommendations.slice(0, 3);

  // --------- Ensure project exists (for users who jump straight to recs) ---------
  async function ensureProjectId(projectArg, setId) {
    const existing = projectArg?.id ?? projectArg?.projectId ?? null;
    if (existing) return existing;

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user)
      throw new Error("Please log in before sending a request.");

    const payload = {
      user_id: user.id,
      title:
        projectArg?.name ||
        projectArg?.basic?.projectName ||
        "Untitled project",
      type: projectArg?.type || "Residential",
      location: projectArg?.location || "Unknown",
      size_sqm: projectArg?.sizeSqm ?? projectArg?.size_sqm ?? null,
      budget: projectArg?.budget ?? null,
      timeline_months:
        projectArg?.timelineMonths ?? projectArg?.timeline_months ?? null,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;

    setId?.(data.id);
    return data.id;
  }

const handleRequest = async (provider) => {
  try {
    setError(null);

    const pidKey = provider.providerId || provider.id;
    setRequestingId(pidKey);

    // 1) Ensure user is logged in
    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr || !user) {
      throw new Error("Please log in as a project owner to send requests.");
    }

    // 2) Ensure projectId exists
    const projectId = 
      savedProject?.id ||
      project?.id ||
      project?.projectId ||
      (await ensureProjectId(project, (id) => setAutoProjectId(id)));

    // 3) Find directory provider ID
    let directoryProviderId = provider.providerId ?? null;

    if (!directoryProviderId) {
      let row = null;

      // 3a) Try match by email first
      const email = (provider.email || provider.Email || "").trim();
      if (email) {
        const { data, error } = await supabase
          .from("provider")
          .select("provider_id")
          .ilike("email", email)
          .maybeSingle();
        if (!error) row = data;
      }

      // 3b) If not found → try match by company_name
      if (!row) {
        const name = provider.name || provider.Factory_Name || provider.company_name || "";
        const cleanName = String(name).trim();

        const { data, error } = await supabase
          .from("provider")
          .select("provider_id")
          .ilike("company_name", `%${cleanName}%`)
          .maybeSingle();

        if (!error) row = data;
      }

      // Still not found
      if (!row?.provider_id) {
        throw new Error("This provider isn't in the directory yet. Choose a listed provider.");
      }

      directoryProviderId = row.provider_id;
    }

    // 4) Check if request already exists
    const exists = await requestService.requestExists(
      projectId,
      null,  // providerUserId - not applicable for directory providers
      user.id,  // projectOwnerId
      directoryProviderId
    );

    if (exists) {
      setRequested((prev) => new Set(prev).add(pidKey));
      return;
    }

    // 5) Create new request
    await requestService.createRequest({
      projectId,
      projectOwnerId: user.id,
      directoryProviderId,
      projectTitle:
        project?.basic?.projectName || project?.name || "Untitled project",
      projectDescription:
        project?.scope?.description || project?.description || "",
      budget: project?.budget ?? null,
      timeline:
        project?.timeline ??
        project?.timelineMonths ??
        project?.timeline_months ??
        null,
      message: "New request from Rawasi.",
    });

    setRequested((prev) => new Set(prev).add(pidKey));

  } catch (err) {
    console.error("Request error:", err);
    setError(err.message || "Failed to send request.");
  } finally {
    setRequestingId(null);
  }
};


  // ----------------------------- UI states -----------------------------
  if (isLoading) {
    return (
      <Section className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-amber-500/20 rounded-full blur-xl"></div>
              <Brain className="h-16 w-16 text-blue-700 relative z-10 animate-pulse" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-slate-800 mb-4 text-center"
            >
              {t.loadingLLM}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-center max-w-md"
            >
              Using advanced AI to match you with the perfect providers for your
              project...
            </motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "250px" }}
              transition={{ delay: 0.5, duration: 2 }}
              className="mt-8 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 rounded-full"
            ></motion.div>
          </div>
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">
              Unable to Load Recommendations
            </h2>
            <p className="mb-6 text-slate-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-md"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </Section>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Section className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-300 bg-white p-8 text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-8 w-8 text-slate-600" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">
              No Providers Found
            </h2>
            <p className="mb-6 text-slate-700">
              We couldn't find any providers matching your project requirements.
              Try adjusting your project details or check back later.
            </p>
            <button
              onClick={() => navigate("/project")}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-md"
            >
              Update Project
            </button>
          </motion.div>
        </div>
      </Section>
    );
  }

  // ----------------------------- Main UI -----------------------------
  return (
    <Section className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header with AI insights */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-lg"></div>
                <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 p-3 rounded-xl border border-blue-200">
                  <Sparkles className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {t.title}
              </h1>
              <p className="text-slate-600">{t.subtitle}</p>
            </div>
          </div>

          {/* AI Insights Banner */}
          {llmInsights && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">
                    AI Analysis
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {llmInsights}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Project Complexity */}
          {projectComplexity && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-300 shadow-sm"
            >
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-700">
                {t.complexity}:
              </span>
              <span className="text-sm font-bold text-amber-600 capitalize">
                {projectComplexity}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 flex flex-col md:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Tech Filter */}
          <div className="relative md:w-64">
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full appearance-none px-4 py-3 pr-10 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm cursor-pointer"
            >
              {techOptions.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          </div>
        </motion.div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6 text-sm text-slate-600"
        >
          {t.showing} <span className="font-semibold text-slate-900">{filteredProviders.length}</span> {t.of}{" "}
          <span className="font-semibold text-slate-900">{recommendations.length}</span> {t.providers}
        </motion.div>

        {/* Top Picks */}
        {topPicks.length > 0 && query === "" && techFilter === t.all && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-slate-900">{t.topPicks}</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topPicks.map((provider, index) => (
                <TopPickCard
                  key={provider.id}
                  provider={provider}
                  index={index}
                  onRequest={() => handleRequest(provider)}
                  onMessage={() => navigate("/messages")}
                  isRequesting={requestingId === (provider.providerId || provider.id)}
                  isRequested={requested.has(provider.providerId || provider.id)}
                  t={t}
                  project={project}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* All Providers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {t.allProviders}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider, index) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                index={index}
                onCompareToggle={
                  onCompareToggle
                    ? () => onCompareToggle(provider.id)
                    : undefined
                }
                isCompared={selectedCompare?.has(provider.id)}
                onRequest={() => handleRequest(provider)}
                onMessage={() => navigate("/messages")}
                isRequesting={requestingId === (provider.providerId || provider.id)}
                isRequested={requested.has(provider.providerId || provider.id)}
                t={t}
                project={project}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ======================== Card Components ========================

function TopPickCard({
  provider,
  index,
  onRequest,
  onMessage,
  isRequesting,
  isRequested,
  t,
  project,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      {/* Top pick badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-full shadow-lg">
          <Award className="h-3 w-3" />
          <span>TOP PICK</span>
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 to-orange-200/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>

      <div className="relative bg-white rounded-2xl border-2 border-amber-200 shadow-md overflow-hidden backdrop-blur-sm group-hover:shadow-xl transition-all duration-300">
        <div className="p-6 pt-8">
          {/* Header */}
          <div className="mb-5">
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              {provider.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span>{provider.locationEn}</span>
              </div>
              {provider.rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-semibold">
                    {typeof provider.rating === "number"
                      ? provider.rating.toFixed(1)
                      : provider.rating}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI Reason */}
          {provider.aiReason && (
            <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-blue-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 leading-relaxed">
                  {provider.aiReason}
                </p>
              </div>
            </div>
          )}

          {/* Match Reasons */}
          {provider.matchReasons?.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {provider.matchReasons.map((reason, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200 font-medium"
                >
                  ✓ {reason}
                </span>
              ))}
            </div>
          )}

          {/* Score */}
          <div className="grid grid-cols-1 gap-4 mb-5">
            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-600 mb-1">{t.score}</div>
              <div className="font-bold text-slate-900 text-lg">
                {Math.round(provider.matchScore || provider.finalScore * 100)}
                /100
              </div>
            </div>
          </div>

          {/* Technologies */}
          {provider.technologies?.length > 0 && (
            <div className="mb-5">
              <div className="flex flex-wrap gap-2">
                {provider.technologies.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200 font-medium"
                  >
                    {tech}
                  </span>
                ))}
                {provider.technologies.length > 3 && (
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-300">
                    +{provider.technologies.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="mb-5 p-3 bg-slate-50 rounded-xl space-y-2 text-sm">
            {provider.contact && (
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-medium">Contact:</span>
                <span>{provider.contact}</span>
              </div>
            )}
            {provider.phone && (
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-medium">Phone:</span>
                <span>{provider.phone}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onRequest(provider)}
              disabled={isRequesting || isRequested}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                isRequested
                  ? "bg-emerald-600 text-white shadow-sm"
                  : isRequesting
                  ? "bg-amber-600 text-white animate-pulse shadow-sm"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {isRequested ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isRequesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>
                  {isRequesting ? t.sending : isRequested ? t.sent : t.request}
                </span>
              </div>
            </button>
              <button
                onClick={onMessage}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium hover:border-blue-300 hover:text-blue-700 hover:shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{t.message}</span>
              </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProviderCard({
  provider,
  index,
  onCompareToggle,
  isCompared,
  onRequest,
  onMessage,
  isRequesting,
  isRequested,
  t,
  project,
}) {
  const area =
    Number(project?.sizeSqm || project?.size_sqm) > 0
      ? Number(project.sizeSqm || project.size_sqm)
      : 1500;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden backdrop-blur-sm group-hover:shadow-md transition-all duration-300">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 mb-1.5 truncate">
                {provider.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  <span>{provider.locationEn}</span>
                </div>
                {provider.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span className="font-medium">
                      {typeof provider.rating === "number"
                        ? provider.rating.toFixed(1)
                        : provider.rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {onCompareToggle && (
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 transition-colors">
                <input
                  type="checkbox"
                  checked={isCompared}
                  onChange={onCompareToggle}
                  className="rounded border-slate-400 text-blue-700 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700">
                  {t.compare}
                </span>
              </label>
            )}
          </div>

          {provider.technologies?.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1.5">
                {provider.technologies.slice(0, 2).map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full border border-slate-300 font-medium"
                  >
                    {tech}
                  </span>
                ))}
                {provider.technologies.length > 2 && (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-300">
                    +{provider.technologies.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 mb-4 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-600 mb-1">{t.score}</div>
              <div className="font-semibold text-slate-900 text-sm">
                {Math.round(provider.matchScore || provider.finalScore * 100)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onRequest(provider)}
              disabled={isRequesting || isRequested}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all ${
                isRequesting
                  ? "bg-amber-600 text-white animate-pulse shadow-sm"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-sm hover:shadow-md"
              }`}
            >
              {isRequesting ? t.sending : isRequested ? t.sent : t.request}
            </button>
            <button
              onClick={onMessage}
              className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:border-blue-300 hover:text-blue-700 hover:shadow-sm transition-all"
            >
              {t.message}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
