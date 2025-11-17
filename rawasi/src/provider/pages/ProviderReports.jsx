import React, { useState } from 'react';
import ProviderSidebar from './ProviderSidebar';
import {
  BarChart3, TrendingUp, DollarSign, Calendar, Download, Filter,
  FileText, CheckCircle2, Clock, AlertTriangle, Users, Briefcase
} from 'lucide-react';

export default function ProviderReports() {
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');

  const stats = [
    {
      label: 'Total Revenue',
      value: 'SAR 12.5M',
      change: '+15%',
      icon: DollarSign,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      label: 'Active Projects',
      value: '12',
      change: '+3',
      icon: Briefcase,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      label: 'Completed Tasks',
      value: '247',
      change: '+18%',
      icon: CheckCircle2,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      label: 'Team Members',
      value: '48',
      change: '+5',
      icon: Users,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const projectPerformance = [
    { project: 'Riyadh North Hospital', progress: 85, budget: 92, timeline: 'On track', status: 'good' },
    { project: 'Al Academy Campus', progress: 67, budget: 78, timeline: 'Slight delay', status: 'warning' },
    { project: 'Palm Valley Mall', progress: 100, budget: 98, timeline: 'Completed', status: 'excellent' },
    { project: 'Tech Hub Building', progress: 45, budget: 55, timeline: 'On track', status: 'good' }
  ];

  const financialData = [
    { category: 'Materials', amount: 6500000, percentage: 52 },
    { category: 'Labor', amount: 4375000, percentage: 35 },
    { category: 'Equipment', amount: 1625000, percentage: 13 }
  ];

  const getStatusColor = (status) => {
    const colors = {
      excellent: 'text-green-600 bg-green-50 border-green-200',
      good: 'text-blue-600 bg-blue-50 border-blue-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      danger: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status] || colors.good;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <ProviderSidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Reports & Analytics</h1>
              <p className="text-slate-600">Track performance and generate insights</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium hover:shadow-lg transition-all">
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-green-600">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-4">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                const value = 40 + Math.random() * 50;
                return (
                  <div key={month}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600">{month}</span>
                      <span className="font-bold text-slate-900">SAR {(value * 20).toFixed(0)}K</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Distribution */}
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Budget Distribution</h3>
            <div className="space-y-6">
              {financialData.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700 font-medium">{item.category}</span>
                    <span className="text-slate-900 font-bold">SAR {(item.amount / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 w-12">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-orange-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold">Total Budget</span>
                <span className="text-xl font-bold text-slate-900">SAR 12.5M</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Performance Table */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Project Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-orange-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Project</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Progress</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Budget Used</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Timeline</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectPerformance.map((project, index) => (
                  <tr key={index} className="border-b border-orange-50 hover:bg-orange-50/50 transition-all">
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{project.project}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold text-slate-700">{project.budget}%</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm text-slate-600">{project.timeline}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}>
                          {project.status === 'excellent' ? 'Excellent' : project.status === 'good' ? 'Good' : 'Warning'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-900">On-Time Delivery</h4>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">92%</div>
            <p className="text-sm text-slate-600">Projects completed on schedule</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900">Avg Response Time</h4>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">6h</div>
            <p className="text-sm text-slate-600">Client inquiry response time</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-yellow-100">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-slate-900">Change Orders</h4>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">3</div>
            <p className="text-sm text-slate-600">Active change requests</p>
          </div>
        </div>
      </main>
    </div>
  );
}
