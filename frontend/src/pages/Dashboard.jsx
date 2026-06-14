import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DashboardStats from '../components/DashboardStats';
import RecentActivity from '../components/RecentActivity';
import QuickActions from '../components/QuickActions';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';
import {
  Menu,
  X,
  FolderPlus,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  DollarSign,
  AlertCircle,
  Check,
  UserPlus,
  Users,
  Search,
  ShieldAlert
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Group creation states
  const [newGroupName, setNewGroupName] = useState('');
  const [groupType, setGroupType] = useState('home');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Friend addition states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendError, setFriendError] = useState('');
  const [friendSuccess, setFriendSuccess] = useState(false);

  const searchDropdownRef = useRef(null);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/api/dashboard/');
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Click outside friend autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreatingGroup(true);
    try {
      const res = await api.post('/api/groups/', { name: newGroupName.trim(), type: groupType });
      setNewGroupName('');
      setShowGroupModal(false);
      await fetchDashboardData();
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      console.error('Error creating group:', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleFriendSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setFriendError('');

    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/api/users/?search=${val}`);
      // Filter out users who are already friends
      const currentFriends = dashboardData?.friends || [];
      const filtered = res.data.filter(
        (u) => !currentFriends.some((f) => f.friend_id === u.id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Error searching friends:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddFriendSubmit = async (user) => {
    setFriendError('');
    setFriendSuccess(false);
    try {
      await api.post('/api/friends/', { identifier: user.username });
      setFriendSuccess(true);
      setSearchQuery('');
      setSearchResults([]);
      await fetchDashboardData();
      setTimeout(() => {
        setFriendSuccess(false);
        setShowFriendModal(false);
      }, 1200);
    } catch (err) {
      setFriendError(err.response?.data?.error || 'Failed to add friend.');
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

  const { groups = [], friends = [], balances = {}, activities = [] } = dashboardData || {};
  const hasExpenses = parseInt(balances.total_expenses || 0) > 0;
  const netBal = parseFloat(balances.net_balance || '0.00');

  // Pull out dynamic debts from shared groups
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col relative">
      <Navbar />

      {/* Top Mobile Bar */}
      <div className="md:hidden bg-white border-b border-gray-150 px-4 py-3 flex items-center justify-between z-10 sticky top-16">
        <span className="font-extrabold text-sm text-gray-800">Splitwise Menu</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-gray-150 rounded-lg text-gray-600 transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 relative">
        {/* Left column sidebar navigation */}
        <div className={`md:block shrink-0 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <Sidebar
            groups={groups}
            friends={friends}
            onAddGroup={() => setShowGroupModal(true)}
            onAddFriend={() => setShowFriendModal(true)}
          />
        </div>

        {/* Dashboard Content split grid (Middle and Right columns) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Middle Column (Main dashboard items) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Dashboard Actions */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-xs text-gray-500 mt-0.5">Welcome back, {currentUser.username}!</p>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setShowSettleModal(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-white border border-gray-250 hover:bg-gray-50 text-gray-700 font-bold rounded-xl shadow-xs text-xs transition cursor-pointer"
                >
                  Settle Up
                </button>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-xs hover:shadow-emerald-600/10 transition cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>

            {/* Welcome vs Summary cards */}
            {!hasExpenses ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
                <Users className="h-12 w-12 text-emerald-600/30 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900 mb-1.5">Welcome to Splitwise!</h2>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
                  Splitwise helps you split bills with friends, flatmates, and trips. Click "Add an expense" above to get started, or invite some friends first.
                </p>
                <button
                  onClick={() => setShowFriendModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Add friends on Splitwise
                </button>
              </div>
            ) : (
              <>
                {/* Statistics panel */}
                <DashboardStats balances={balances} />

                {/* Recent Activity feed */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gray-400" />
                    <span>Recent Activity</span>
                  </h2>
                  <RecentActivity activities={activities} limit={10} />
                </div>
              </>
            )}
          </div>

          {/* Right Column (Widgets) */}
          <div className="space-y-6">
            {/* Net balance detail card */}
            {hasExpenses && (
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Account Balance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                    <span>You owe</span>
                    <span className="text-orange-500 font-bold">₹{parseFloat(balances.total_owe).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                    <span>You are owed</span>
                    <span className="text-emerald-600 font-bold">₹{parseFloat(balances.total_owed).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Net status</span>
                    <span className={netBal > 0 ? 'text-emerald-600' : netBal < 0 ? 'text-orange-500' : 'text-gray-500'}>
                      {netBal > 0 ? `+₹${netBal.toFixed(2)}` : netBal < 0 ? `-₹${Math.abs(netBal).toFixed(2)}` : '₹0.00'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Panel */}
            <QuickActions
              onAddExpense={() => setShowExpenseModal(true)}
              onSettleUp={() => setShowSettleModal(true)}
              onAddGroup={() => setShowGroupModal(true)}
              onAddFriend={() => setShowFriendModal(true)}
            />

            {/* Recent Groups list widget */}
            {groups.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5 px-1">
                  Recent Groups
                </h3>
                <ul className="divide-y divide-gray-50">
                  {groups.slice(0, 3).map((g) => (
                    <li key={g.id} className="py-2.5 first:pt-0 last:pb-0">
                      <Link
                        to={`/groups/${g.id}`}
                        className="flex justify-between items-center group/grp hover:text-emerald-600 transition"
                      >
                        <div className="min-w-0 pr-4">
                          <span className="text-xs font-bold text-gray-800 block truncate group-hover/grp:text-emerald-600">
                            {g.name}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {g.members.length} sharing members
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover/grp:translate-x-0.5 transition-transform" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1.5">
                <FolderPlus className="h-5 w-5 text-emerald-600" />
                <span>Create a Group</span>
              </h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setNewGroupName('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="modal-group-name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Group Name
                </label>
                <input
                  id="modal-group-name"
                  type="text"
                  required
                  placeholder="e.g. Ski Trip 2026, Rent split"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-xs text-gray-800 font-semibold"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-xs text-gray-700 font-semibold"
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                >
                  <option value="home">🏠 Home</option>
                  <option value="trip">✈️ Trip</option>
                  <option value="couple">💕 Couple</option>
                  <option value="other">🌟 Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowGroupModal(false);
                    setNewGroupName('');
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl text-gray-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !newGroupName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md transition cursor-pointer"
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showFriendModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl max-w-md w-full p-6" ref={searchDropdownRef}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1.5">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                <span>Add Friend</span>
              </h3>
              <button
                onClick={() => {
                  setShowFriendModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setFriendError('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {friendSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl">
                Friend added successfully! closing...
              </div>
            )}

            {friendError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{friendError}</span>
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
                  onChange={handleFriendSearch}
                  autoFocus
                />
              </div>

              {/* Autocomplete dropdown lists */}
              {searchResults.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-50 max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => handleAddFriendSubmit(u)}
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
              💡 Type a registered username or email to add them instantly as a friend.
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        groups={groups}
        onSuccess={fetchDashboardData}
      />

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        groups={groups}
        onSuccess={fetchDashboardData}
      />

    </div>
  );
};

export default Dashboard;
