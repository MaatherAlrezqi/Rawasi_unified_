import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Inbox, 
  BarChart3, 
  MessageSquare,
  User
} from 'lucide-react';

export default function ProviderSidebar() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/provider/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/provider/projects', icon: FileText },
    { name: 'Requests', path: '/provider/requests', icon: Inbox },
    { name: 'Reports', path: '/provider/reports', icon: BarChart3 },
    { name: 'Messages', path: '/provider/messages', icon: MessageSquare },
    { name: 'Profile', path: '/provider/profile', icon: User }
  ];

  return (
    <aside className="w-64 bg-white border-r border-orange-200/50 min-h-screen flex flex-col">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 p-6 border-b border-orange-200/50">
        <img 
          src="/photo_2025-08-13_21-03-51.png" 
          alt="Rawasi" 
          className="h-10 w-10 rounded-xl shadow-md hover:scale-110 transition-transform duration-300"
        />
        <div>
          <div className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            RAWASI
          </div>
          <div className="text-xs text-orange-600 font-medium -mt-0.5">
            Provider Portal
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-orange-200/50">
        <div className="px-4 py-3 rounded-xl bg-orange-50 text-sm text-slate-600">
          <div className="font-semibold text-slate-900">Need help?</div>
          <div className="text-xs mt-1">Contact support</div>
        </div>
      </div>
    </aside>
  );
}
