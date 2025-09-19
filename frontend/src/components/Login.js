import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Users, Trophy, Award } from 'lucide-react';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials.username, credentials.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero content */}
        <div className="text-center md:text-left">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Hackathon Management System
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Complete platform to manage your hackathon from registration to certificates
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Team Management</h3>
              <p className="text-sm text-gray-600">Organize participants and teams</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Trophy className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Judging System</h3>
              <p className="text-sm text-gray-600">Fair and transparent evaluation</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Award className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Certificates</h3>
              <p className="text-sm text-gray-600">QR-verified digital certificates</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">Demo Credentials:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>Judge:</strong> judge1 / judge123</p>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <LogIn className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;