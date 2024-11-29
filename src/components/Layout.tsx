import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Clock, ClipboardList, Users, History, Snowflake } from 'lucide-react';
import { translations } from '../utils/translations';

const { admin: { navigation } } = translations;

export const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D42D27]" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const navigationItems = [
    { name: navigation.timeClock, href: '/clock', icon: Clock },
    { name: navigation.reports, href: '/admin', icon: ClipboardList },
    { name: navigation.employees, href: '/admin/employees', icon: Users },
    { name: navigation.timeEntries, href: '/admin/time-entries', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <nav className="bg-white shadow-sm border-b border-[#E8ECF3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Snowflake className="h-8 w-8 text-[#D42D27]" />
                <h1 className="text-xl font-bold text-[#2F4538]">Rudolf.dk</h1>
              </div>
              <div className="hidden sm:flex sm:space-x-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        location.pathname === item.href
                          ? 'bg-[#E8ECF3] text-[#2F4538]'
                          : 'text-gray-600 hover:text-[#2F4538] hover:bg-[#F8F9FC]'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[#4A6FA5] mr-4">
                {user.firstName} {user.lastName} ({user.role})
              </span>
              <button
                onClick={() => useAuthStore.getState().signOut()}
                className="text-sm text-[#D42D27] hover:text-[#B82520]"
              >
                {translations.auth.signOut}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};