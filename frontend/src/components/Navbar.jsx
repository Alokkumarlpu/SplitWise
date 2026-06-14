import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Wallet } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const { user } = useAuth();

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
            <div className="flex items-center gap-4">
              <ProfileDropdown />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
