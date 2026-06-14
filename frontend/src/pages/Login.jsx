import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Lock, User, Wallet, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-100/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 max-w-md w-full p-8 transition-all hover:shadow-2xl duration-300">
        
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 mb-3 text-emerald-600">
            <Wallet className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome to Splitwise</h1>
          <p className="text-sm text-gray-500 mt-1">Split bills, track expenses, and settle up easily.</p>
        </div>

        {/* Errors */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-2.5 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <User className="h-5 w-5" />
              </span>
              <input
                id="username"
                type="text"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition duration-200"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="password"
                type="password"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition duration-200"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
