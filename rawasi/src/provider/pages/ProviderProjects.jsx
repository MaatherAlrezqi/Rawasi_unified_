import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderSidebar from './ProviderSidebar';
import {
  Briefcase, Calendar, CheckCircle2, Clock, DollarSign, MapPin,
  TrendingUp, Users, Search, ChevronRight, Building2, Target,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ProviderProjects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from Supabase
  useEffect(() => {
    fetchProviderProjects();
  }, []);

  const fetchProviderProjects = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('User not logged in');
        setLoading(false);
        return;
      }

      // Fetch projects assigned to this provider
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Fetched provider projects:', projectsData);

      // Convert to display format
      const converted = projectsData.map(proj => ({
        id: proj.id,
        name: proj.name,
        client: proj.user_id,
        location: proj.location,
        status: proj.status || 'planning',
        phase: proj.phase || 'Design',
        progress: proj.progress_percentage || 0,
        budget: { 
          total: proj.budget || 0, 
          spent: proj.budget_used || 0 
        },
        team: 12,
        deadline: proj.started_at 
          ? new Date(new Date(proj.started_at).getTime() + (proj.timeline_months || 12) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sizeSqm: proj.size_sqm,
        floors: proj.n_floors,
        techNeeds: proj.tech_needs
      }));

      setProjects(converted);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status.toLowerCase().replace(' ', '-') === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    const colors = {
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'planning': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'on-hold': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'in-progress': <TrendingUp className="w-4 h-4" />,
      'completed': <CheckCircle2 className="w-4 h-4" />,
      'planning': <Clock className="w-4 h-4" />,
      'on-hold': <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || <Briefcase className="w-4 h-4" />;
  };

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalValue: projects.reduce((sum, p) => sum + p.budget.total, 0)
  };

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <ProviderSidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Projects</h1>
          <p className="text-slate-600">Manage and track your construction projects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Projects</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.active}</div>
            <div className="text-sm text-slate-600">Active Projects</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.completed}</div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              SAR {(stats.totalValue / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-slate-600">Total Value</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
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
                onClick={() => setFilterStatus('in-progress')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  filterStatus === 'in-progress'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  filterStatus === 'completed'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate(`/provider/dashboard?project=${project.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      {project.location}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Building2 className="w-4 h-4 text-orange-600" />
                      {project.sizeSqm} sqm • {project.floors} floors
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.techNeeds && Array.isArray(project.techNeeds) && project.techNeeds.slice(0, 2).map((tech, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Progress • {project.phase}
                  </span>
                  <span className="font-bold text-slate-900">{project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-600 transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Bottom Info */}
              <div className="flex items-center justify-between pt-4 border-t border-orange-100">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Budget</div>
                    <div className="font-bold text-slate-900">
                      SAR {(project.budget.spent / 1000).toFixed(0)}K / {(project.budget.total / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Deadline</div>
                    <div className="font-semibold text-slate-700 text-sm">
                      {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-medium hover:bg-orange-100 transition-all group-hover:bg-orange-500 group-hover:text-white">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-12 text-center">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
            <p className="text-slate-600">
              {searchTerm ? 'Try adjusting your search criteria' : 'You don\'t have any projects assigned yet'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
