import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  User,
  Users,
  Search,
  UserPlus,
  UserMinus,
  AlertCircle,
  Activity,
  DollarSign,
  ArrowRight,
  Clock,
  ArrowLeft,
  ShieldAlert,
  X
} from 'lucide-react';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add friend states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  // Modal display states
  const [showAddModal, setShowAddModal] = useState(false);

  const searchDropdownRef = useRef(null);

  const fetchData = async () => {
    try {
      const [friendsRes, groupsRes, expensesRes] = await Promise.all([
        api.get('/api/friends/'),
        api.get('/api/groups/'),
        api.get('/api/expenses/'),
      ]);
      setFriends(friendsRes.data);
      setGroups(groupsRes.data);
      setExpenses(expensesRes.data);

      // Preserve or update selection
      if (selectedFriend) {
        const updated = friendsRes.data.find((f) => f.id === selectedFriend.id);
        setSelectedFriend(updated || null);
      }
    } catch (err) {
      console.error('Failed to fetch friends data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setAddError('');

    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/api/users/?search=${val}`);
      // Filter out users who are already friends
      const filtered = res.data.filter(
        (u) => !friends.some((f) => f.friend_id === u.id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddFriend = async (user) => {
    setAddError('');
    setAddSuccess(false);
    try {
      await api.post('/api/friends/', { identifier: user.username });
      setAddSuccess(true);
      setSearchQuery('');
      setSearchResults([]);
      await fetchData();
      setTimeout(() => {
        setAddSuccess(false);
        setShowAddModal(false);
      }, 1500);
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add friend.');
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (!window.confirm('Are you sure you want to remove this friend? This will clear reciprocal ties.')) return;
    try {
      await api.delete(`/api/friends/${friendshipId}/`);
      setSelectedFriend(null);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove friend.');
    }
  };

  // Filter shared expenses with the currently selected friend
  const getSharedExpenses = () => {
    if (!selectedFriend) return [];
    return expenses.filter((exp) => {
      const groupObj = groups.find((g) => g.id === exp.group);
      if (!groupObj) return false;
      return groupObj.members.some((m) => m.id === selectedFriend.friend_id);
    });
  };

  const sharedExpenses = getSharedExpenses();
  const balanceVal = selectedFriend ? parseFloat(selectedFriend.balance) : 0;
  const initials = selectedFriend?.friend_username ? selectedFriend.friend_username.substring(0, 2).toUpperCase() : 'FR';

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Left column sidebar navigation */}
        <Sidebar
          groups={groups}
          friends={friends}
          onAddGroup={() => {}} // Modals handled on Dashboard
          onAddFriend={() => setShowAddModal(true)}
        />

        {/* Middle/Right: Friends List & Detail Split View */}
        <main className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100 min-h-[500px]">
          
          {/* Friends Left Panel */}
          <div className="w-full lg:w-1/3 pr-0 lg:pr-6 pb-6 lg:pb-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold text-gray-900">Friends</h1>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Friend</span>
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-gray-150 rounded-xl bg-gray-50/50">
                <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-500">You have not added any friends yet.</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {friends.map((f) => (
                  <li key={f.id}>
                    <button
                      onClick={() => setSelectedFriend(f)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left cursor-pointer ${
                        selectedFriend?.id === f.id
                          ? 'bg-emerald-50/60 border border-emerald-100/50'
                          : 'border border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {f.friend_avatar_base64 ? (
                          <img
                            src={f.friend_avatar_base64}
                            alt={f.friend_username}
                            className="w-8 h-8 rounded-full object-cover border border-emerald-100 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center border border-emerald-250 shrink-0">
                            {f.friend_username.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-gray-800 block truncate">{f.friend_username}</span>
                          <span className="text-[10px] text-gray-400 block truncate">{f.friend_full_name || f.friend_email}</span>
                        </div>
                      </div>

                      {parseFloat(f.balance) !== 0 && (
                        <span
                          className={`text-xs font-bold shrink-0 ${
                            parseFloat(f.balance) > 0 ? 'text-emerald-600' : 'text-orange-500'
                          }`}
                        >
                          {parseFloat(f.balance) > 0
                            ? `+₹${parseFloat(f.balance).toFixed(0)}`
                            : `-₹${Math.abs(parseFloat(f.balance)).toFixed(0)}`}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Friend Detail Right Panel */}
          <div className="w-full lg:w-2/3 pl-0 lg:pl-6 pt-6 lg:pt-0 flex flex-col justify-between">
            {selectedFriend ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Header Detail Card */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      {selectedFriend.friend_avatar_base64 ? (
                        <img
                          src={selectedFriend.friend_avatar_base64}
                          alt={selectedFriend.friend_username}
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-extrabold flex items-center justify-center border border-emerald-250">
                          {initials}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{selectedFriend.friend_username}</h2>
                        <p className="text-xs text-gray-500">{selectedFriend.friend_email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFriend(selectedFriend.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold cursor-pointer transition"
                      title="Remove friend relationship"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Unfriend</span>
                    </button>
                  </div>

                  {/* Relationship Balance */}
                  <div className="my-6 p-4 bg-gray-50/50 border border-gray-150 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        Shared Balance
                      </span>
                      <span className="text-xs text-gray-500 block leading-relaxed">
                        Total settlement balance with {selectedFriend.friend_username} across all shared groups.
                      </span>
                    </div>
                    <div className="text-right">
                      {balanceVal > 0 ? (
                        <>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Owes you</span>
                          <span className="text-xl font-extrabold text-emerald-600">₹{balanceVal.toFixed(2)}</span>
                        </>
                      ) : balanceVal < 0 ? (
                        <>
                          <span className="text-[10px] font-bold text-orange-500 uppercase block">You owe</span>
                          <span className="text-xl font-extrabold text-orange-500">₹{Math.abs(balanceVal).toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Settled</span>
                          <span className="text-xl font-extrabold text-gray-500">₹0.00</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Shared Expenses list */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                      Shared Expenses ({sharedExpenses.length})
                    </h3>

                    {sharedExpenses.length === 0 ? (
                      <div className="text-center py-8 px-4 border border-dashed border-gray-150 rounded-xl bg-gray-50/30">
                        <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-gray-500">No shared expenses found.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {sharedExpenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="p-3 bg-white border border-gray-150 hover:border-emerald-500/30 rounded-xl flex justify-between items-center transition"
                          >
                            <div className="min-w-0 pr-4">
                              <span className="font-bold text-xs text-gray-800 block truncate">{exp.description}</span>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="font-semibold">Paid by {exp.payer.username}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-gray-800 whitespace-nowrap">
                              ₹{parseFloat(exp.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 mt-6 pt-3 border-t border-gray-50 text-center leading-relaxed">
                  ⚠️ Removing a friend will delete reciprocal friendship records. Expenses will remain inside their respective groups.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center py-16 px-4">
                <User className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-700 text-lg mb-1">No Friend Selected</h3>
                <p className="text-sm text-gray-400 max-w-[280px]">
                  Select a friend from the left panel to inspect shared expenses and net balances.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Friend Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl max-w-md w-full p-6" ref={searchDropdownRef}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                <span>Add Friend</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setAddError('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <span>Friend added successfully! closing...</span>
              </div>
            )}

            {addError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div className="relative mb-5">
              <div className="relative">
                <Search className="absolute inset-y-0 left-3 h-5 w-5 text-gray-400 flex items-center pointer-events-none mt-2.5" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 transition"
                  placeholder="Search username or email..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                />
              </div>

              {/* Autocomplete dropdown lists */}
              {searchResults.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-50 max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => handleAddFriend(u)}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm flex justify-between items-center transition cursor-pointer"
                      >
                        <div>
                          <span className="font-semibold text-gray-700 block">{u.username}</span>
                          <span className="text-xs text-gray-400 block">{u.email}</span>
                        </div>
                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Add</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl p-3 text-center text-xs text-gray-400 shadow-xl z-50">
                  No users found
                </div>
              )}
            </div>

            <div className="text-[10px] text-gray-400 leading-relaxed">
              💡 Type a registered username or email. If they are not registered, use the <strong>Invite Friends</strong> widget in the sidebar menu instead.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Friends;
