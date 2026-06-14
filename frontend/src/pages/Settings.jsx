import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../AuthContext';
import { 
  User, Bell, Shield, Sliders, Key, Trash2, Globe, DollarSign, 
  Upload, Check, AlertCircle, Laptop, Smartphone, HelpCircle, Ban, 
  Search, ShieldAlert, ArrowLeft, ToggleLeft, ToggleRight
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab 1: Profile & Preferences states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Tab 2: Notification preference states
  const [notifications, setNotifications] = useState({
    notify_group_added: true,
    notify_friend_added: true,
    notify_expense_added: true,
    notify_expense_updated: true,
    notify_expense_comment: true,
    notify_expense_due: true,
    notify_payment_received: true,
    notify_monthly_summary: true,
    notify_product_updates: true,
    notify_tips: true,
  });

  // Tab 3: Privacy & Security states
  const [discoverable, setDiscoverable] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const blockDropdownRef = useRef(null);

  const triggerToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 4000);
  };

  const fetchSettingsData = async () => {
    try {
      const [profileRes, notifRes, privacyRes] = await Promise.all([
        api.get('/api/profile/'),
        api.get('/api/profile/notifications/'),
        api.get('/api/profile/privacy/'),
      ]);

      // Map profile details
      setFullName(profileRes.data.full_name || '');
      setEmail(profileRes.data.email || '');
      setPhoneNumber(profileRes.data.phone_number || '');
      setAvatarBase64(profileRes.data.profile?.avatar_base64 || '');
      setDefaultCurrency(profileRes.data.profile?.default_currency || 'INR');
      setTimezone(profileRes.data.profile?.timezone || 'UTC');
      setLanguage(profileRes.data.profile?.language || 'en');

      // Map notifications
      setNotifications(notifRes.data);

      // Map privacy
      setDiscoverable(privacyRes.data.discoverable);
      setBlockedUsers(privacyRes.data.blocked_users);
      setActiveSessions(privacyRes.data.active_sessions);
    } catch (err) {
      console.error("Error fetching settings info", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  // Click outside blocker dropdown
  useEffect(() => {
    const clickOutside = (e) => {
      if (blockDropdownRef.current && !blockDropdownRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Handle avatar upload via FileReader
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit avatar to 1MB to prevent large DB payloads
    if (file.size > 1024 * 1024) {
      triggerToast("Image size exceeds 1MB limit. Please choose a smaller file.", true);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setAvatarBase64(base64String);
      try {
        await api.post('/api/profile/avatar/', { avatar_base64: base64String });
        triggerToast("Avatar picture updated successfully!");
      } catch (err) {
        triggerToast("Failed to upload avatar image.", true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit profile settings
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put('/api/profile/', {
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
      });
      // Also update preferences in parallel
      await api.put('/api/profile/preferences/', {
        default_currency: defaultCurrency,
        timezone: timezone,
        language: language,
      });
      triggerToast("Profile details updated successfully!");
    } catch (err) {
      triggerToast(err.response?.data?.email?.[0] || "Failed to update profile.", true);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast("New passwords do not match.", true);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/profile/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast("Password changed successfully!");
    } catch (err) {
      triggerToast(err.response?.data?.old_password?.[0] || err.response?.data?.non_field_errors?.[0] || "Failed to change password.", true);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Notification settings
  const handleUpdateNotifications = async (key, val) => {
    const updatedNotifs = { ...notifications, [key]: val };
    setNotifications(updatedNotifs);
    try {
      await api.put('/api/profile/notifications/', updatedNotifs);
    } catch (err) {
      triggerToast("Failed to update notification preference.", true);
    }
  };

  // Submit discoverability status
  const handleToggleDiscoverable = async () => {
    const newDiscoverable = !discoverable;
    setDiscoverable(newDiscoverable);
    try {
      await api.put('/api/profile/privacy/', { discoverable: newDiscoverable });
    } catch (err) {
      triggerToast("Failed to save privacy settings.", true);
      setDiscoverable(!newDiscoverable);
    }
  };

  // Terminate specific device session
  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to log out from this session?")) return;
    try {
      await api.post('/api/profile/privacy/terminate-session/', { session_id: sessionId });
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      triggerToast("Session terminated.");
    } catch (err) {
      triggerToast("Failed to terminate session.", true);
    }
  };

  // Log out all devices
  const handleLogoutAll = async () => {
    if (!window.confirm("This will log you out from all other devices. Proceed?")) return;
    try {
      await api.post('/api/auth/logout-all/');
      logout();
      navigate('/login');
    } catch (err) {
      triggerToast("Failed to terminate other sessions.", true);
    }
  };

  // Soft delete account
  const handleDeleteAccount = async () => {
    const confirmText = "DELETE ACCOUNT";
    const input = window.prompt(`WARNING: Deactivating your account is irreversible. All current group balances must be settled. Type "${confirmText}" to confirm.`);
    
    if (input !== confirmText) {
      triggerToast("Deactivation canceled.", true);
      return;
    }

    try {
      await api.delete('/api/profile/delete-account/');
      logout();
      navigate('/register');
    } catch (err) {
      triggerToast("Failed to deactivate account.", true);
    }
  };

  // Block User Search
  const handleUserQueryChange = async (e) => {
    const val = e.target.value;
    setUserQuery(val);

    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/api/users/?search=${val}`);
      // Exclude already blocked users from lookup
      const filtered = res.data.filter(u => !blockedUsers.some(b => b.blocked_user.id === u.id));
      setSearchResults(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Block a user
  const handleBlockUser = async (user) => {
    try {
      const res = await api.post('/api/profile/privacy/block/', { blocked_user_id: user.id });
      setBlockedUsers(prev => [...prev, res.data]);
      setUserQuery('');
      setSearchResults([]);
      triggerToast(`Blocked ${user.username}.`);
    } catch (err) {
      triggerToast(err.response?.data?.error || "Failed to block user.", true);
    }
  };

  // Unblock a user
  const handleUnblockUser = async (userId) => {
    try {
      await api.post('/api/profile/privacy/unblock/', { blocked_user_id: userId });
      setBlockedUsers(prev => prev.filter(b => b.blocked_user.id !== userId));
      triggerToast("User unblocked.");
    } catch (err) {
      triggerToast("Failed to unblock user.", true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        
        {/* Back Link */}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium transition mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Global Toast notifications */}
        {(successMsg || errorMsg) && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-2.5 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300 ${
            errorMsg ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
            {errorMsg ? <AlertCircle className="h-5 w-5 text-red-500 shrink-0" /> : <Check className="h-5 w-5 text-emerald-600 shrink-0" />}
            <span className="text-sm font-medium">{errorMsg || successMsg}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Settings Tabs Sidebar */}
          <div className="w-full lg:w-64 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <User className="h-5 w-5 shrink-0" />
              <span>My Account</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'notifications' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Bell className="h-5 w-5 shrink-0" />
              <span>Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'privacy' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Shield className="h-5 w-5 shrink-0" />
              <span>Privacy & Security</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'advanced' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>Advanced Features</span>
            </button>
          </div>

          {/* Settings Tab Detail Card */}
          <div className="flex-1 w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
            
            {/* 1. Account Settings Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                
                {/* Profile detail section */}
                <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b border-gray-50">
                  <div className="relative group shrink-0">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-50 border border-gray-150 flex items-center justify-center">
                      {avatarBase64 ? (
                        <img src={avatarBase64} alt="User profile avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                    
                    {/* File Upload trigger overlay */}
                    <label className="absolute inset-0 bg-black/45 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer">
                      <Upload className="h-5 w-5" />
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Click your profile circle to upload a custom avatar.</p>
                  </div>
                </div>

                {/* Profile Edit fields form */}
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="fullName">Full Name</label>
                      <input
                        id="fullName"
                        type="text"
                        placeholder="Enter full name"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      type="text"
                      placeholder="e.g. +91 9999999999"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  {/* Preferences section */}
                  <div className="pt-4 border-t border-gray-50 space-y-4">
                    <h3 className="text-md font-bold text-gray-800 flex items-center gap-1.5">
                      <Sliders className="h-4.5 w-4.5 text-gray-400" />
                      <span>Preferences</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Currency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Default Currency</label>
                        <select
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500"
                          value={defaultCurrency}
                          onChange={(e) => setDefaultCurrency(e.target.value)}
                        >
                          <option value="INR">₹ (INR)</option>
                          <option value="USD">$ (USD)</option>
                          <option value="EUR">€ (EUR)</option>
                          <option value="GBP">£ (GBP)</option>
                        </select>
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Time Zone</label>
                        <select
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500"
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                        >
                          <option value="UTC">UTC (GMT+0)</option>
                          <option value="IST">Asia/Kolkata (GMT+5:30)</option>
                          <option value="EST">US/Eastern (GMT-5)</option>
                          <option value="PST">US/Pacific (GMT-8)</option>
                        </select>
                      </div>

                      {/* Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Language</label>
                        <select
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      Save Settings
                    </button>
                  </div>
                </form>

                {/* Password Change card Form */}
                <form onSubmit={handleChangePassword} className="pt-6 border-t border-gray-50 space-y-4">
                  <h3 className="text-md font-bold text-gray-800 flex items-center gap-1.5">
                    <Key className="h-4.5 w-4.5 text-gray-400" />
                    <span>Change Password</span>
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="oldPassword">Current Password</label>
                      <input
                        id="oldPassword"
                        type="password"
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="newPassword">New Password</label>
                        <input
                          id="newPassword"
                          type="password"
                          required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="confirm">Confirm New Password</label>
                        <input
                          id="confirm"
                          type="password"
                          required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>

              </div>
            )}

            {/* 2. Notification Preferences Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-400 mt-1">Configure when you want to receive transaction updates.</p>
                </div>

                <div className="space-y-6 divide-y divide-gray-50">
                  
                  {/* Group notification preferences */}
                  <div className="pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Group Notifications</h3>
                    
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Someone adds me to a group</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_group_added', !notifications.notify_group_added)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_group_added ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Someone adds me as a friend</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_friend_added', !notifications.notify_friend_added)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_friend_added ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expense notifications */}
                  <div className="pt-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Expense Notifications</h3>
                    
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Expense added</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_expense_added', !notifications.notify_expense_added)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_expense_added ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Expense edited</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_expense_updated', !notifications.notify_expense_updated)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_expense_updated ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Expense comment/discussion added</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_expense_comment', !notifications.notify_expense_comment)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_expense_comment ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Expense due reminders</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_expense_due', !notifications.notify_expense_due)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_expense_due ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Someone pays me / Settles up</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_payment_received', !notifications.notify_payment_received)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_payment_received ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* News & Updates */}
                  <div className="pt-6 space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">News & Updates</h3>
                    
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Monthly activity summary report</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_monthly_summary', !notifications.notify_monthly_summary)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_monthly_summary ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Product updates & feature launches</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_product_updates', !notifications.notify_product_updates)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_product_updates ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Tips, alerts, and announcements</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNotifications('notify_tips', !notifications.notify_tips)}
                          className="text-emerald-600 cursor-pointer"
                        >
                          {notifications.notify_tips ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 3. Privacy & Security Settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-8">
                
                {/* Discoverability section */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
                  <p className="text-sm text-gray-400 mt-1">Configure search privacy and blocked accounts list.</p>

                  <div className="flex justify-between items-center mt-6 bg-gray-50/50 border border-gray-100 p-4 rounded-xl">
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">Allow others to discover me</span>
                      <span className="text-xs text-gray-400 mt-0.5 block">Let friends search and add you by your email or username.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleDiscoverable}
                      className="text-emerald-600 cursor-pointer"
                    >
                      {discoverable ? <ToggleRight className="h-9 w-9 stroke-[1.5]" /> : <ToggleLeft className="h-9 w-9 stroke-[1.5] text-gray-300" />}
                    </button>
                  </div>
                </div>

                {/* Blocked Users Section */}
                <div className="pt-6 border-t border-gray-50">
                  <h3 className="text-md font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                    <Ban className="h-4.5 w-4.5 text-gray-400" />
                    <span>Blocked Users</span>
                  </h3>
                  
                  {/* Block user search bar */}
                  <div className="relative mb-4" ref={blockDropdownRef}>
                    <div className="relative">
                      <Search className="absolute inset-y-0 left-3 h-5 w-5 text-gray-400 flex items-center pointer-events-none mt-2" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 transition"
                        placeholder="Search users to block..."
                        value={userQuery}
                        onChange={handleUserQueryChange}
                      />
                    </div>

                    {/* Results dropdown */}
                    {searchResults.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-150 rounded-xl shadow-xl z-50 divide-y divide-gray-50 max-h-40 overflow-y-auto">
                        {searchResults.map((user) => (
                          <li key={user.id}>
                            <button
                              type="button"
                              onClick={() => handleBlockUser(user)}
                              className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm flex justify-between items-center transition cursor-pointer"
                            >
                              <div>
                                <span className="font-semibold text-gray-700 block">{user.username}</span>
                                <span className="text-xs text-gray-400 block">{user.email}</span>
                              </div>
                              <span className="text-xs text-red-600 font-bold bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">Block</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Block list */}
                  {blockedUsers.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No users blocked currently.</p>
                  ) : (
                    <ul className="space-y-2">
                      {blockedUsers.map((block) => (
                        <li key={block.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl">
                          <span className="text-sm font-semibold text-gray-700">{block.blocked_user.username}</span>
                          <button
                            type="button"
                            onClick={() => handleUnblockUser(block.blocked_user.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                          >
                            Unblock
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Active Sessions list */}
                <div className="pt-6 border-t border-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-bold text-gray-800 flex items-center gap-1.5">
                      <Laptop className="h-4.5 w-4.5 text-gray-400" />
                      <span>Active Sessions</span>
                    </h3>
                    
                    {activeSessions.length > 1 && (
                      <button
                        onClick={handleLogoutAll}
                        className="text-xs text-red-600 hover:text-red-700 font-bold transition cursor-pointer"
                      >
                        Logout all other devices
                      </button>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {activeSessions.map((session) => {
                      const isMobile = /mobile/i.test(session.user_agent);

                      return (
                        <li key={session.id} className={`p-4 border rounded-xl flex items-center justify-between gap-4 ${
                          session.is_current ? 'bg-emerald-50/15 border-emerald-100/50' : 'bg-gray-50/20 border-gray-100'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-500">
                              {isMobile ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                            </div>
                            <div className="pr-4 truncate">
                              <span className="text-sm font-bold text-gray-800 block truncate max-w-[280px]" title={session.user_agent}>
                                {session.user_agent}
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                IP: {session.ip_address} • Last active: {new Date(session.last_activity).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {session.is_current ? (
                              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            ) : (
                              <button
                                onClick={() => handleTerminateSession(session.id)}
                                className="text-xs px-2.5 py-1 text-gray-500 hover:text-red-600 font-semibold border border-gray-200 hover:border-red-200 bg-white rounded-lg transition cursor-pointer"
                              >
                                Log out
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

              </div>
            )}

            {/* 4. Advanced Settings Settings */}
            {activeTab === 'advanced' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Advanced Features</h2>
                  <p className="text-sm text-gray-400 mt-1">Manage account deactivations, upgrade licenses, and data options.</p>
                </div>

                {/* Subscriptions info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Upgrade placeholder */}
                  <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-600 border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-3">
                        Upgrade Option
                      </span>
                      <h3 className="font-bold text-lg text-gray-800">Splitwise Pro</h3>
                      <p className="text-xs text-gray-500 mt-1">Get currency conversions, OCR receipt scans, repeating expenses, and charts.</p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full mt-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg opacity-50 cursor-not-allowed"
                    >
                      Upgrade Plan (Coming Soon)
                    </button>
                  </div>

                  {/* Account Merge placeholder */}
                  <div className="border border-gray-100 bg-gray-50/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 border border-gray-100 bg-gray-50 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-3">
                        Data Control
                      </span>
                      <h3 className="font-bold text-lg text-gray-800">Merge Accounts</h3>
                      <p className="text-xs text-gray-500 mt-1">Consolidate expenses and groups from another Splitwise account into this profile.</p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full mt-4 py-2 bg-gray-100 text-gray-400 font-semibold text-xs rounded-lg cursor-not-allowed"
                    >
                      Merge Accounts (Coming Soon)
                    </button>
                  </div>
                </div>

                {/* Account deletion warning */}
                <div className="pt-6 border-t border-gray-150 p-5 bg-red-50/20 border border-red-100 rounded-2xl">
                  <h3 className="font-bold text-lg text-red-700 flex items-center gap-1.5 mb-2">
                    <Trash2 className="h-5 w-5 text-red-500" />
                    <span>Deactivate Account</span>
                  </h3>
                  <p className="text-xs text-red-600/90 leading-relaxed mb-4 max-w-xl">
                    Deactivating your account will soft-delete your email and username from active lookup indexes and terminate all active logins. All group debts must be settled before you proceed.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-md hover:shadow-red-600/15 cursor-pointer text-sm"
                  >
                    Deactivate Account
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
};

export default Settings;
