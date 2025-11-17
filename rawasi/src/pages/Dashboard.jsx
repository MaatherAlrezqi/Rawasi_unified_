// Enhanced Owner Dashboard - Similar style to Provider but owner-focused
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity, BarChart3, Calendar, CheckCircle2, ChevronRight,
  Clock, DollarSign, Home, MapPin, TrendingUp, Users,
  Edit2, Save, X, Target, Building2, Zap, Award, Shield,
  AlertTriangle, PieChart as PieChartIcon, LineChart as LineChartIcon
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

export default function OwnerDashboard() {
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  
  const [selectedProject, setSelectedProject] = useState(projectIdFromUrl || '');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch owner's projects from Supabase
  useEffect(() => {
    fetchOwnerProjects();
  }, []);

  const fetchOwnerProjects = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('❌ User not logged in:', userError);
        setLoading(false);
        return;
      }

      console.log('✅ Current user:', user.id, user.email);

      // SIMPLE QUERY - Get projects without join first
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('❌ Error fetching projects:', projectsError);
        console.error('Error details:', projectsError.message, projectsError.details);
        throw projectsError;
      }

      console.log('✅ Fetched projects:', projectsData);
      console.log('✅ Projects count:', projectsData?.length);

      if (!projectsData || projectsData.length === 0) {
        console.log('⚠️ No projects found for user:', user.id);
        setProjects([]);
        setLoading(false);
        return;
      }

      // Get unique provider IDs
      const providerIds = [...new Set(
        projectsData
          .map(p => p.provider_id)
          .filter(Boolean)
      )];

      console.log('📋 Provider IDs to fetch:', providerIds);

      // Fetch provider info separately if needed
      let providersData = [];
      if (providerIds.length > 0) {
        const { data: providers, error: providersError } = await supabase
          .from('profiles')
          .select('id, name')  // No email column in profiles!
          .in('id', providerIds);

        if (providersError) {
          console.error('⚠️ Error fetching providers:', providersError);
        } else {
          providersData = providers || [];
          console.log('✅ Fetched providers:', providersData);
        }
      }

      // Convert to dashboard format
      const converted = projectsData.map(proj => {
        const provider = providersData.find(p => p.id === proj.provider_id);
        
        return {
          id: proj.id,
          name: proj.name,
          location: proj.location,
          status: proj.status || 'planning',
          phase: proj.phase || 'Design',
          progress: proj.progress_percentage || 0,
          budget: { 
            total: proj.budget || 0, 
            spent: proj.budget_used || 0,
            remaining: (proj.budget || 0) - (proj.budget_used || 0)
          },
          timeline: {
            months: proj.timeline_months || 12,
            daysTotal: (proj.timeline_months || 12) * 30,
            daysElapsed: Math.floor(((proj.timeline_months || 12) * 30) * ((proj.progress_percentage || 0) / 100)),
            daysRemaining: Math.ceil(((proj.timeline_months || 12) * 30) * (1 - ((proj.progress_percentage || 0) / 100)))
          },
          type: proj.type,
          sizeSqm: proj.size_sqm,
          floors: proj.n_floors,
          techNeeds: proj.tech_needs,
          provider: provider ? {
            id: provider.id,
            name: provider.name || 'Provider',
            rating: 4.5
          } : null
        };
      });

      console.log('✅ Converted projects:', converted);

      setProjects(converted);
      
      // Set selected project (from URL or first project)
      if (projectIdFromUrl && converted.find(p => p.id === projectIdFromUrl)) {
        setSelectedProject(projectIdFromUrl);
        console.log('✅ Selected project from URL:', projectIdFromUrl);
      } else if (converted.length > 0) {
        setSelectedProject(converted[0].id);
        console.log('✅ Selected first project:', converted[0].id);
      }
    } catch (error) {
      console.error('❌ Error in fetchOwnerProjects:', error);
      console.error('Full error:', error.message, error.details, error.hint);
    } finally {
      setLoading(false);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  // Chart data calculations
  const progressChartData = currentProject ? [
    { month: 'Month 1', progress: Math.round(currentProject.progress * 0.2), budget: Math.round((currentProject.budget.spent / currentProject.budget.total) * 100 * 0.15) },
    { month: 'Month 2', progress: Math.round(currentProject.progress * 0.4), budget: Math.round((currentProject.budget.spent / currentProject.budget.total) * 100 * 0.35) },
    { month: 'Month 3', progress: Math.round(currentProject.progress * 0.7), budget: Math.round((currentProject.budget.spent / currentProject.budget.total) * 100 * 0.60) },
    { month: 'Current', progress: currentProject.progress, budget: Math.round((currentProject.budget.spent / currentProject.budget.total) * 100) }
  ] : [];

  const budgetChartData = currentProject ? [
    { name: 'Materials', value: currentProject.budget.spent * 0.50, color: '#f97316' },
    { name: 'Labor', value: currentProject.budget.spent * 0.35, color: '#3b82f6' },
    { name: 'Equipment', value: currentProject.budget.spent * 0.10, color: '#8b5cf6' },
    { name: 'Other', value: currentProject.budget.spent * 0.05, color: '#10b981' }
  ] : [];

  const phaseData = currentProject ? [
    { phase: 'Design', completion: currentProject.phase === 'Design' ? currentProject.progress : ['Groundwork', 'Structure', 'MEP', 'Finishes', 'Handover'].includes(currentProject.phase) ? 100 : 0, color: '#3b82f6' },
    { phase: 'Groundwork', completion: currentProject.phase === 'Groundwork' ? currentProject.progress : ['Structure', 'MEP', 'Finishes', 'Handover'].includes(currentProject.phase) ? 100 : 0, color: '#8b5cf6' },
    { phase: 'Structure', completion: currentProject.phase === 'Structure' ? currentProject.progress : ['MEP', 'Finishes', 'Handover'].includes(currentProject.phase) ? 100 : 0, color: '#f97316' },
    { phase: 'MEP', completion: currentProject.phase === 'MEP' ? currentProject.progress : ['Finishes', 'Handover'].includes(currentProject.phase) ? 100 : 0, color: '#10b981' },
    { phase: 'Finishes', completion: currentProject.phase === 'Finishes' ? currentProject.progress : currentProject.phase === 'Handover' ? 100 : 0, color: '#f59e0b' },
    { phase: 'Handover', completion: currentProject.phase === 'Handover' ? currentProject.progress : 0, color: '#14b8a6' }
  ] : [];

  const costEfficiency = currentProject ? 
    Math.round((currentProject.progress / ((currentProject.budget.spent / currentProject.budget.total) * 100)) * 100) : 0;

  const healthScore = currentProject ? 
    Math.min(100, Math.round((currentProject.progress * 0.4) + ((currentProject.budget.remaining / currentProject.budget.total) * 100 * 0.3) + (30))) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Projects</h2>
          <p className="text-slate-600">You haven't created any projects yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      
      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-orange-600">Project Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Project Overview</h1>
          <p className="text-slate-600 mt-1">Monitor and track your construction projects</p>
        </div>

        {/* Project Selector */}
        {projects.length > 1 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full max-w-md px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.location}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentProject && (
          <>
            {/* TOP ROW: 3 Key KPI Cards - MOVED FROM BOTTOM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Cost Efficiency */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-blue-600">
                    {costEfficiency}%
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Cost Efficiency</h4>
                <p className="text-sm text-slate-600">Progress vs Budget Ratio</p>
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-bold text-slate-900">{currentProject.progress}%</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-600">Budget Used</span>
                    <span className="font-bold text-slate-900">
                      {Math.round((currentProject.budget.spent / currentProject.budget.total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Budget Remaining */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl border-2 border-green-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-100">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-green-600">
                    SAR {((currentProject.budget.remaining) / 1000).toFixed(0)}K
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Budget Remaining</h4>
                <p className="text-sm text-slate-600">Available Funds</p>
                <div className="mt-4 pt-4 border-t border-green-100">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                      style={{ width: `${(currentProject.budget.remaining / currentProject.budget.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-slate-600">
                      {Math.round((currentProject.budget.remaining / currentProject.budget.total) * 100)}% of total
                    </span>
                  </div>
                </div>
              </div>

              {/* Days to Completion */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border-2 border-purple-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-3xl font-bold text-purple-600">
                    {currentProject.timeline.daysRemaining}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Days to Completion</h4>
                <p className="text-sm text-slate-600">Estimated Time Left</p>
                <div className="mt-4 pt-4 border-t border-purple-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Elapsed</span>
                    <span className="font-bold text-slate-900">{currentProject.timeline.daysElapsed} days</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-600">Total Duration</span>
                    <span className="font-bold text-slate-900">{currentProject.timeline.daysTotal} days</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Stats Grid - Project Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  SAR {((currentProject.budget.spent) / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-slate-600">Spent of {((currentProject.budget.total) / 1000).toFixed(0)}K</div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${(currentProject.budget.spent / currentProject.budget.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-orange-100">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{currentProject.progress}%</div>
                <div className="text-sm text-slate-600">Progress</div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                    style={{ width: `${currentProject.progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-emerald-100">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1 capitalize">{currentProject.phase}</div>
                <div className="text-sm text-slate-600">Current Phase</div>
                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  currentProject.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  currentProject.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {currentProject.status}
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{healthScore}</div>
                <div className="text-sm text-slate-600">Project Health Score</div>
                <div className={`mt-2 text-xs font-medium ${
                  healthScore >= 80 ? 'text-green-600' :
                  healthScore >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {healthScore >= 80 ? '✓ Excellent' : healthScore >= 60 ? '⚠ Good' : '✗ Needs Attention'}
                </div>
              </div>

            </div>

            {/* Charts Row 1: Progress Tracking & Budget Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5 text-orange-600" />
                  Progress & Budget Tracking
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #fed7aa',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="progress" stroke="#f97316" strokeWidth={3} name="Progress %" />
                    <Line type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={3} name="Budget Used %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-orange-600" />
                  Budget Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={budgetChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {budgetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `SAR ${(value / 1000).toFixed(0)}K`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Charts Row 2: Phase Status & Provider Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-600" />
                  Phase Completion Status
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={phaseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} />
                    <YAxis type="category" dataKey="phase" stroke="#64748b" fontSize={12} width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #fed7aa',
                        borderRadius: '12px'
                      }}
                      formatter={(value) => `${value}%`}
                    />
                    <Bar dataKey="completion" radius={[0, 8, 8, 0]}>
                      {phaseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Provider Information
                </h3>
                {currentProject.provider ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                      <div className="p-3 rounded-full bg-orange-100">
                        <Users className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{currentProject.provider.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Award key={i} className={`w-4 h-4 ${i < Math.floor(currentProject.provider.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-sm text-slate-600">{currentProject.provider.rating}/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <div className="text-xs text-blue-700">Status</div>
                        <div className="font-semibold text-blue-900">Active</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl">
                        <div className="text-xs text-green-700">Performance</div>
                        <div className="font-semibold text-green-900">Excellent</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <AlertTriangle className="w-12 h-12 text-orange-400 mb-3" />
                    <p className="text-slate-600 mb-4">No provider assigned yet</p>
                    <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all">
                      Assign Provider
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Project Details */}
            <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                Project Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="text-xs text-slate-600 mb-1">Location</div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    {currentProject.location}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Type</div>
                  <div className="font-semibold text-slate-900">{currentProject.type}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Size</div>
                  <div className="font-semibold text-slate-900">{currentProject.sizeSqm} sqm</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Floors</div>
                  <div className="font-semibold text-slate-900">{currentProject.floors} floors</div>
                </div>
              </div>
              {currentProject.techNeeds && currentProject.techNeeds.length > 0 && (
                <div className="mt-6 pt-6 border-t border-orange-100">
                  <div className="text-xs text-slate-600 mb-3">Technology Requirements</div>
                  <div className="flex flex-wrap gap-2">
                    {currentProject.techNeeds.map((tech, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </main>
    </div>
  );
}
