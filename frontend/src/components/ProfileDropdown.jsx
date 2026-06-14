import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { User, PlusCircle, Calculator, HelpCircle, LogOut, ChevronDown } from 'lucide-react';

const ProfileDropdown = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Toggle dropdown
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) return null;

  // Retrieve avatar or fallback initials
  const avatarUrl = user.profile?.avatar_base64;
  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'US';

  const menuItems = [
    { label: 'Your Account', path: '/settings', icon: User },
    { label: 'Create a Group', path: '/groups/create', icon: PlusCircle },
    { label: 'Fairness Calculators', path: '/calculators', icon: Calculator },
    { label: 'Contact Support', path: '/support', icon: HelpCircle },
    { label: 'Log Out', path: '/logout', icon: LogOut, className: 'text-red-600 hover:bg-red-50 hover:text-red-700' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-100 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.username}
            className="w-6 h-6 rounded-full object-cover border border-emerald-100"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-200">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium max-w-[100px] truncate">{user.username}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 transform origin-top-right transition-all duration-150 animate-in fade-in slide-in-from-top-2"
        >
          {/* User Info Header */}
          <div className="px-4 py-2 border-b border-gray-50">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{user.profile?.full_name || user.username}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition font-medium cursor-pointer ${
                    item.className || 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
