import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProviderSidebar from './ProviderSidebar';
import {
  Activity, BarChart3, Bell, Briefcase, Calendar, CheckCircle2, ChevronRight,
  Clock, DollarSign, FileText, Home, MapPin, TrendingUp, User, Users, 
  Edit2, Save, AlertTriangle, Download, Share2, X, Target
} from 'lucide-react';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
//----------------------- PROXY -----------------------
import ProxyDatabaseHandler from "../../services/database/ProxyDatabaseHandler";
import RealDatabaseHandler from "../../services/database/RealDatabaseHandler";
//----------------------- PROXY -----------------------
import ProviderService from "../../services/ProviderService";
//----------------------- PROXY -----------------------

const providerService = new ProviderService();
//----------------------- PROXY -----------------------


export default function ProviderDashboard() {


  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  
  const [selectedProject, setSelectedProject] = useState(projectIdFromUrl || '');
  const [editMode, setEditMode] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [editData, setEditData] = useState({
    progress: 0,
    budgetUsed: 0,
    phase: '',
    status: ''
  });
  //----------------------- PROXY -----------------------

  // Fetch provider's projects 
 useEffect(() => {
  providerService.getProviderProjects().then((data) => {
    console.log("Provider Projects:", data);
    setProjects(data);
    setLoading(false);
  });
}, []);

  //----------------------- PROXY -----------------------

  const fetchProviderProjects = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('User not logged in');
        setLoading(false);
        return;
      }

      // Get provider's profile to get provider_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Fetch projects assigned to this provider
      //----------------------- PROXY -----------------------
      console.log("Proxy Log → GET Provider Projects for Provider:", profile.id);

      const projectsData = await providerService.getProjectsByProviderId(profile.id);

      if (!projectsData) {
      console.error("❌ Proxy returned no projects");
      setLoading(false);
       return;
      }
    //----------------------- PROXY -----------------------


      if (error) throw error;

      console.log('✅ Fetched provider projects:', projectsData);

      // Convert to dashboard format
      const converted = projectsData.map(proj => ({
        id: proj.id,
        name: proj.name,
        client: proj.user_id, // You might want to join with profiles to get actual name
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
          daysTotal: (proj.timeline_months || 12) * 30,
          daysElapsed: Math.floor(((proj.timeline_months || 12) * 30) * ((proj.progress_percentage || 0) / 100)),
          daysRemaining: Math.ceil(((proj.timeline_months || 12) * 30) * (1 - ((proj.progress_percentage || 0) / 100)))
        },
        team: 12, // You might want to add team_size to database
        tasks: { 
          total: 50, 
          completed: Math.floor(50 * ((proj.progress_percentage || 0) / 100)) 
        },
        type: proj.type,
        techNeeds: proj.tech_needs
      }));

      setProjects(converted);
      
      // Set first project as selected if none selected
      if (!selectedProject && converted.length > 0) {
        setSelectedProject(converted[0].id);
        setEditData({
          progress: converted[0].progress,
          budgetUsed: converted[0].budget.spent,
          phase: converted[0].phase,
          status: converted[0].status
        });
      }

    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject) || projects[0];

  // Update edit data when project changes
  useEffect(() => {
    if (currentProject) {
      setEditData({
        progress: currentProject.progress,
        budgetUsed: currentProject.budget.spent,
        phase: currentProject.phase,
        status: currentProject.status
      });
    }
  }, [selectedProject, currentProject]);

  // Save changes to Supabase
  const handleSave = async () => {
    if (!currentProject) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('projects')
        .update({
          progress_percentage: editData.progress,
          budget_used: editData.budgetUsed,
          phase: editData.phase,
          status: editData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProject.id);

      if (error) throw error;

      console.log('✅ Project updated successfully');
      
      // Refresh projects
      await fetchProviderProjects();
      setEditMode(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Chart data
  const budgetChartData = currentProject ? [
    { name: 'Materials', value: currentProject.budget.spent * 0.52, color: '#f97316' },
    { name: 'Labor', value: currentProject.budget.spent * 0.35, color: '#fb923c' },
    { name: 'Technology', value: currentProject.budget.spent * 0.13, color: '#fdba74' }
  ] : [];

  const progressChartData = currentProject ? [
    { month: 'Month 1', progress: 10, budget: 8 },
    { month: 'Month 2', progress: 20, budget: 18 },
    { month: 'Month 3', progress: 35, budget: 32 },
    { month: 'Month 4', progress: currentProject.progress, budget: (currentProject.budget.spent / currentProject.budget.total) * 100 }
  ] : [];
// ENHANCED CHARTS DATA
  const phaseData = currentProject ? [
    { phase: 'Design', completion: currentProject.phase === 'Design' ? currentProject.progress : ['Groundwork', 'Structure', 'MEP', 'Finishes', 'Handover'].includes(currentProject.phase) ? 100 : 0, color: '#3b82f6' },
    { phase: 'Groundwork', completion: currentProject.phase === 'Groundwork' ? currentProject.progress : ['Structure', 'MEP', 'Finishes', 'Handover'].includes(currentProject.phase) ? 100 : 0, color: '#8b5cf6' },
    { phase: 'Structure', completion: currentProject.phase === 'Structure' ? currentProject.progress : ['MEP', 'Finishes', 'Handover'].includes(currentProject.phase) ? 100 : 0, color: '#f97316' },
    { phase: 'MEP', completion: currentProject.phase === 'MEP' ? currentProject.progress : ['Finishes', 'Handover'].includes(currentProject.phase) ? 100 : 0, color: '#10b981' },
    { phase: 'Finishes', completion: currentProject.phase === 'Finishes' ? currentProject.progress : currentProject.phase === 'Handover' ? 100 : 0, color: '#f59e0b' },
    { phase: 'Handover', completion: currentProject.phase === 'Handover' ? currentProject.progress : 0, color: '#14b8a6' }
  ] : [];

  const costBreakdown = currentProject ? [
    { category: 'Materials', allocated: currentProject.budget.total * 0.50, spent: currentProject.budget.spent * 0.52 },
    { category: 'Labor', allocated: currentProject.budget.total * 0.35, spent: currentProject.budget.spent * 0.35 },
    { category: 'Equipment', allocated: currentProject.budget.total * 0.10, spent: currentProject.budget.spent * 0.08 },
    { category: 'Technology', allocated: currentProject.budget.total * 0.05, spent: currentProject.budget.spent * 0.05 }
  ] : [];

  const healthMetrics = currentProject ? {
    overallScore: Math.min(100, Math.round((currentProject.progress * 0.4) + ((1 - (currentProject.budget.spent / currentProject.budget.total)) * 100 * 0.3) + (30)))
  } : null;

  const timelineData = currentProject ? [
    { name: 'Planned', days: currentProject.timeline.daysTotal, color: '#94a3b8' },
    { name: 'Elapsed', days: currentProject.timeline.daysElapsed, color: '#f97316' },
    { name: 'Remaining', days: currentProject.timeline.daysRemaining, color: '#3b82f6' }
  ] : [];

  const budgetUtilizationData = currentProject ? [
    { phase: 'Design', utilized: 15, target: 20 },
    { phase: 'Groundwork', utilized: 12, target: 15 },
    { phase: 'Structure', utilized: currentProject.phase === 'Structure' ? Math.round((currentProject.budget.spent / currentProject.budget.total) * 100) : 25, target: 30 },
    { phase: 'MEP', utilized: currentProject.phase === 'MEP' ? Math.round((currentProject.budget.spent / currentProject.budget.total) * 100) : 20, target: 20 },
    { phase: 'Finishes', utilized: 10, target: 10 },
    { phase: 'Handover', utilized: 3, target: 5 }
  ] : [];

  const riskIndicators = currentProject ? [
    { category: 'Schedule', level: currentProject.progress < 40 ? 'High' : currentProject.progress < 70 ? 'Medium' : 'Low', color: currentProject.progress < 40 ? '#ef4444' : currentProject.progress < 70 ? '#f59e0b' : '#10b981', score: currentProject.progress },
    { category: 'Budget', level: (currentProject.budget.spent / currentProject.budget.total) > 0.85 ? 'High' : (currentProject.budget.spent / currentProject.budget.total) > 0.65 ? 'Medium' : 'Low', color: (currentProject.budget.spent / currentProject.budget.total) > 0.85 ? '#ef4444' : (currentProject.budget.spent / currentProject.budget.total) > 0.65 ? '#f59e0b' : '#10b981', score: Math.round((currentProject.budget.spent / currentProject.budget.total) * 100) },
    { category: 'Quality', level: 'Low', color: '#10b981', score: 85 }
  ] : []; 

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <ProviderSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
            <p className="text-slate-600">Loading projects...</p>
          </div>
        </main>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <ProviderSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Projects Assigned</h2>
            <p className="text-slate-600">You don't have any projects assigned yet.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <ProviderSidebar />
      
      <main className="flex-1">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-orange-200/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4" />
                  <span className="font-medium text-orange-600">Project Dashboard</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button 
                      onClick={() => setEditMode(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 rounded-xl border border-orange-200 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span className="font-medium">Cancel</span>
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 rounded-xl border border-orange-200 transition-all">
                      <Share2 className="w-4 h-4" />
                      <span className="font-medium">Share</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 rounded-xl border border-orange-200 transition-all">
                      <Download className="w-4 h-4" />
                      <span className="font-medium">Export</span>
                    </button>
                    <button 
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Progress</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Project Info Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {currentProject?.status} • {currentProject?.phase}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {/* Project Selector */}
          <div className="mb-6">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                SAR {((currentProject?.budget.spent || 0) / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-slate-600">Spent of {((currentProject?.budget.total || 0) / 1000).toFixed(0)}K</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: `${((currentProject?.budget.spent || 0) / (currentProject?.budget.total || 1)) * 100}%` }}
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
              {editMode ? (
                <div>
                  <input
                    type="number"
                    value={editData.progress}
                    onChange={(e) => setEditData({...editData, progress: parseInt(e.target.value) || 0})}
                    className="w-24 px-3 py-1 border-2 border-orange-200 rounded-lg text-2xl font-bold text-slate-900"
                    min="0"
                    max="100"
                  />
                  <span className="text-2xl font-bold text-slate-900">%</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-slate-900 mb-1">{currentProject?.progress}%</div>
              )}
              <div className="text-sm text-slate-600">Progress</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                  style={{ width: `${editData.progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{currentProject?.team}</div>
              <div className="text-sm text-slate-600">Team Members</div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-100">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {currentProject?.tasks.completed}/{currentProject?.tasks.total}
              </div>
              <div className="text-sm text-slate-600">Tasks Completed</div>
            </div>
          </div>

          {/* Edit Form */}
          {editMode && (
            <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Update Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phase</label>
                  <select
                    value={editData.phase}
                    onChange={(e) => setEditData({...editData, phase: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                  >
                    <option value="Design">Design</option>
                    <option value="Groundwork">Groundwork</option>
                    <option value="Structure">Structure</option>
                    <option value="MEP">MEP</option>
                    <option value="Finishes">Finishes</option>
                    <option value="Handover">Handover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Budget Used (SAR)</label>
                  <input
                    type="number"
                    value={editData.budgetUsed}
                    onChange={(e) => setEditData({...editData, budgetUsed: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Interactive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Progress Over Time Chart */}
            <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Progress & Budget Tracking</h3>
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

            {/* Budget Distribution Pie Chart */}
            <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Budget Distribution</h3>
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
                  <Tooltip 
                    formatter={(value) => `SAR ${(value / 1000).toFixed(0)}K`}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #fed7aa',
                      borderRadius: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        {/* NEW ENHANCED CHARTS */}
          <div className="space-y-6 mb-8">
            
            {/* Row 1: Phase Progress + Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Phase Progress Bar Chart */}
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
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #fed7aa', borderRadius: '12px' }}
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

              {/* Cost Breakdown */}
              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  Cost Analysis by Category
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={costBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #fed7aa', borderRadius: '12px' }}
                      formatter={(value) => `SAR ${(value / 1000).toFixed(0)}K`}
                    />
                    <Legend />
                    <Bar dataKey="allocated" fill="#94a3b8" name="Allocated" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="spent" fill="#f97316" name="Spent" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Row 2: Project Health Dashboard */}
            <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border-2 border-orange-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Project Health Dashboard
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Overall Health Score */}
                <div className="col-span-1 flex flex-col items-center justify-center bg-white rounded-xl p-6 border-2 border-orange-200">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                      <circle cx="64" cy="64" r="56" stroke="#f97316" strokeWidth="12" fill="none"
                        strokeDasharray={`${(healthMetrics?.overallScore || 0) * 3.51} 351`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">{healthMetrics?.overallScore || 0}</span>
                      <span className="text-xs text-slate-600">Health Score</span>
                    </div>
                  </div>
                </div>

                {/* Risk Indicators */}
                {riskIndicators.map((risk, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 border-2 border-orange-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-700">{risk.category} Risk</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold`}
                        style={{ backgroundColor: `${risk.color}20`, color: risk.color }}>
                        {risk.level}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${risk.score}%`, backgroundColor: risk.color }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Score</span>
                        <span className="font-bold">{risk.score}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 3: Timeline + Budget Utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Timeline Pie */}
              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Timeline Overview
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={timelineData} cx="50%" cy="50%" labelLine={false}
                      label={({ name, days }) => `${name}: ${days}d`} outerRadius={100} fill="#8884d8" dataKey="days">
                      {timelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} days`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-600">Total</div>
                    <div className="text-lg font-bold text-slate-900">{currentProject?.timeline.daysTotal}d</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Elapsed</div>
                    <div className="text-lg font-bold text-orange-600">{currentProject?.timeline.daysElapsed}d</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Remaining</div>
                    <div className="text-lg font-bold text-blue-600">{currentProject?.timeline.daysRemaining}d</div>
                  </div>
                </div>
              </div>

              {/* Budget Utilization */}
              <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Budget Utilization by Phase
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={budgetUtilizationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="phase" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #fed7aa', borderRadius: '12px' }}
                      formatter={(value) => `${value}%`}
                    />
                    <Legend />
                    <Bar dataKey="target" fill="#cbd5e1" name="Target %" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="utilized" fill="#f97316" name="Utilized %" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Row 4: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Cost Efficiency */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-blue-600">
                    {currentProject ? Math.round((currentProject.progress / ((currentProject.budget.spent / currentProject.budget.total) * 100)) * 100) : 0}%
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Cost Efficiency</h4>
                <p className="text-sm text-slate-600">Progress vs Budget Ratio</p>
              </div>

              {/* Budget Remaining */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl border-2 border-green-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-100">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-green-600">
                    SAR {currentProject ? ((currentProject.budget.total - currentProject.budget.spent) / 1000).toFixed(0) : 0}K
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Budget Remaining</h4>
                <p className="text-sm text-slate-600">Available Funds</p>
              </div>

              {/* Days to Completion */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border-2 border-purple-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-3xl font-bold text-purple-600">
                    {currentProject?.timeline.daysRemaining || 0}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">Days to Completion</h4>
                <p className="text-sm text-slate-600">Estimated Time Left</p>
              </div>

            </div>

          </div>
          {/* END NEW CHARTS */}

          
          {/* Timeline Section */}
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Timeline Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Days Elapsed</span>
                <span className="font-bold text-gray-900">{currentProject?.timeline.daysElapsed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Days Remaining</span>
                <span className="font-bold text-orange-600">{currentProject?.timeline.daysRemaining}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Duration</span>
                <span className="font-bold text-gray-900">{currentProject?.timeline.daysTotal} days</span>
              </div>
              <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                  style={{ width: `${((currentProject?.timeline.daysElapsed || 0) / (currentProject?.timeline.daysTotal || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
