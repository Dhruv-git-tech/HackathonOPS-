import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Users, Upload, Award, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  const adminNavItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Teams', path: '/teams' },
    { icon: Upload, label: 'Import Data', path: '/import' },
    { icon: Award, label: 'Certificates', path: '/certificates' },
  ];

  const judgeNavItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : judgeNavItems;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Hackathon Manager</span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </a>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {user?.username} ({user?.role})
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 py-2">
          <div className="flex flex-wrap gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors text-sm"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;