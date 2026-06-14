import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogOut, User, Wallet, Settings as SettingsIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition">
              <Wallet className="h-6 w-6 stroke-[2.5]" />
              <span className="font-bold text-xl tracking-tight text-gray-900">
                Split<span className="text-emerald-600">wise</span>
              </span>
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center gap-6">
              <Link
                to="/settings"
                className="flex items-center gap-2 text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-100 transition"
                title="View Account Settings"
              >
                <User className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">{user.username}</span>
                <SettingsIcon className="h-3.5 w-3.5 text-gray-400 hover:text-emerald-600 transition" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 font-medium transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
