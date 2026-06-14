import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, UserPlus, X, Search, Users, ShieldAlert } from 'lucide-react';

const CreateGroup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const searchDropdownRef = useRef(null);

  // Close search results dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users dynamically
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/api/users/?search=${val}`);
      // Filter out users that are already selected
      const filtered = res.data.filter(
        (u) => !selectedMembers.some((sm) => sm.id === u.id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectMember = (user) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(selectedMembers.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create group
      const res = await api.post('/api/groups/', {
        name: name.trim(),
        type: groupType,
      });
      const group = res.data;

      // 2. Add selected members to group
      for (const member of selectedMembers) {
        try {
          await api.post(`/api/groups/${group.id}/add-member/`, {
            identifier: member.username,
          });
        } catch (memberErr) {
          console.error(`Failed to add member ${member.username}:`, memberErr);
        }
      }

      // Redirect to newly created group
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Card wrapper */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create a group</h1>
              <p className="text-sm text-gray-500">Set up a new space to share bills and expenses.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-xl flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label htmlFor="group-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Group Name
              </label>
              <input
                id="group-name"
                type="text"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-gray-900"
                placeholder="e.g. Winter Trip 2026, Flat 4B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Group Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Group Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 'home', label: '🏠 Home' },
                  { value: 'trip', label: '✈️ Trip' },
                  { value: 'couple', label: '💕 Couple' },
                  { value: 'other', label: '🌟 Other' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setGroupType(type.value)}
                    className={`py-2 px-3 border rounded-xl text-sm font-semibold transition cursor-pointer text-center ${
                      groupType === type.value
                        ? 'border-emerald-500 bg-emerald-50/55 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Invite/Add Members */}
            <div className="relative" ref={searchDropdownRef}>
              <label htmlFor="member-search" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Add Group Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  id="member-search"
                  type="text"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 transition"
                  placeholder="Type username or email..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              {/* Search dropdown list */}
              {searchResults.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-50 max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectMember(user)}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm flex justify-between items-center transition cursor-pointer"
                      >
                        <div>
                          <span className="font-semibold text-gray-700 block">{user.username}</span>
                          <span className="text-xs text-gray-400 block">{user.email}</span>
                        </div>
                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          <span>Select</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl p-3 text-center text-xs text-gray-400 shadow-xl z-50">
                  No users found
                </div>
              )}
            </div>

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Invited ({selectedMembers.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-emerald-50 border border-emerald-100/50 rounded-full text-emerald-700 text-sm font-semibold"
                    >
                      <span>{member.username}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-0.5 hover:bg-emerald-100 rounded-full transition cursor-pointer text-emerald-600"
                        title="Remove member"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-gray-50 flex items-center justify-end gap-3">
              <Link
                to="/dashboard"
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 font-semibold rounded-xl text-gray-700 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateGroup;
