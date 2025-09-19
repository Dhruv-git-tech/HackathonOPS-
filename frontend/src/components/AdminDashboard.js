import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserCheck, GitBranch, Clock, TrendingUp, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      setError('Failed to fetch dashboard statistics');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const quickActions = [
    {
      title: 'Import Participant Data',
      description: 'Upload CSV/XLSX files with team data',
      icon: Users,
      link: '/import',
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Teams',
      description: 'View and edit team information',
      icon: UserCheck,
      link: '/teams',
      color: 'bg-green-500',
    },
    {
      title: 'Generate Certificates',
      description: 'Create QR-verified certificates',
      icon: GitBranch,
      link: '/certificates',
      color: 'bg-purple-500',
    },
    {
      title: 'Judging Panel',
      description: 'Manage judges and scoring',
      icon: Clock,
      link: '/judging',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the hackathon management control center</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalParticipants || 0}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                Active registrations
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalTeams || 0}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <Activity className="w-4 h-4 mr-1" />
                Registered teams
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projects Submitted</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.submittedProjects || 0}</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <GitBranch className="w-4 h-4 mr-1" />
                With GitHub links
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Judging Status</p>
              <p className="text-lg font-bold text-gray-900">{stats?.judgingStatus || 'Not Started'}</p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1" />
                Current round
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Teams per Track */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams per Track</h3>
          {stats?.teamsPerTrack && stats.teamsPerTrack.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.teamsPerTrack}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No track data available
            </div>
          )}
        </div>

        {/* Team Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Status Overview</h3>
          {stats?.teamsPerTrack && stats.teamsPerTrack.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.teamsPerTrack}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {stats.teamsPerTrack.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for visualization
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.link}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all card-hover"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </a>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-gray-700">System initialized and ready for data import</p>
            <span className="text-xs text-gray-500 ml-auto">Just now</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-gray-700">Admin dashboard loaded successfully</p>
            <span className="text-xs text-gray-500 ml-auto">1 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;