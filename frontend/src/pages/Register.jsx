import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Lock, Mail, User, Wallet, AlertCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      const responseData = err.response?.data;
      let errMsg = 'Registration failed. Please check your details.';
      if (responseData) {
        if (typeof responseData === 'object') {
          // Flatten dictionary error structures returned by DRF
          const firstKey = Object.keys(responseData)[0];
          const val = responseData[firstKey];
          errMsg = Array.isArray(val) ? val[0] : `${firstKey}: ${val}`;
        } else {
          errMsg = responseData;
        }
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-100/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 max-w-md w-full p-8 transition-all hover:shadow-2xl duration-300">
        
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 mb-3 text-emerald-600">
            <Wallet className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Get started splitwise-ing expenses today.</p>
        </div>

        {/* Errors */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-2.5 mb-5">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
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
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition duration-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="password"
                type="password"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition duration-200"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="confirmPassword"
                type="password"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition duration-200"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
