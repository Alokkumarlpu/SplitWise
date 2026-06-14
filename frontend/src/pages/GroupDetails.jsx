import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { 
  ArrowLeft, Plus, DollarSign, MessageCircle, Trash2, Edit3, 
  Check, X, UserPlus, AlertCircle, ArrowUpRight, ArrowDownLeft, 
  HelpCircle, Receipt, UserMinus
} from 'lucide-react';

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Group editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  // Member invite search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const inviteDropdownRef = useRef(null);

  const fetchGroupDetails = async () => {
    try {
      const groupRes = await api.get(`/api/groups/${id}/`);
      setGroup(groupRes.data);
      setEditedName(groupRes.data.name);

      // Fetch expenses for this group
      const expensesRes = await api.get(`/api/expenses/?group=${id}`);
      // Filter expenses to only include the ones belonging to this group
      const filteredExpenses = expensesRes.data.filter(e => e.group === parseInt(id));
      setExpenses(filteredExpenses);
    } catch (err) {
      console.error("Error fetching group details", err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  // Click outside invite dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inviteDropdownRef.current && !inviteDropdownRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle User Autocomplete search
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setInviteError('');

    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/api/users/?search=${val}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Error searching users", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Invite user to group
  const handleInviteUser = async (user) => {
    setInviteError('');
    try {
      await api.post(`/api/groups/${id}/add-member/`, { identifier: user.username });
      setSearchQuery('');
      setSearchResults([]);
      fetchGroupDetails();
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to add member.');
    }
  };

  // Remove user from group
  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member from the group?")) return;
    try {
      await api.post(`/api/groups/${id}/remove-member/`, { user_id: userId });
      fetchGroupDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  // Delete an expense
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/api/expenses/${expenseId}/`);
      fetchGroupDetails();
    } catch (err) {
      console.error("Error deleting expense", err);
    }
  };

  // Save edited group name
  const handleSaveGroupName = async () => {
    if (!editedName.trim() || editedName === group.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await api.patch(`/api/groups/${id}/`, { name: editedName });
      setGroup({ ...group, name: res.data.name });
      setIsEditingName(false);
    } catch (err) {
      console.error("Error updating group name", err);
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

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Link */}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium transition mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Group Header Info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Group Name Display / Form */}
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-emerald-500 font-bold text-2xl text-gray-800"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleSaveGroupName} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition cursor-pointer">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setIsEditingName(false); setEditedName(group.name); }} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-lg transition cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{group.name}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                    title="Edit group name"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions (Add Expense / Settle Up) */}
            <div className="flex items-center gap-3">
              <Link
                to={`/groups/${id}/settle`}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl shadow-sm transition"
              >
                Settle Up
              </Link>
              <Link
                to={`/groups/${id}/expense/new`}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-emerald-600/10 transition"
              >
                <Plus className="h-5 w-5" />
                <span>Add Expense</span>
              </Link>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Expenses List (2 columns width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-400" />
                <span>Expenses</span>
              </h2>

              {expenses.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                  <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">No expenses recorded yet.</p>
                  <Link
                    to={`/groups/${id}/expense/new`}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg transition"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Create Expense</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {expenses.map((expense) => {
                    // Check if current user is involved in this expense
                    const userSplit = expense.splits.find(s => s.user.id === currentUser.id);
                    const owes = userSplit ? parseFloat(userSplit.amount) : 0;
                    const paidByMe = expense.payer.id === currentUser.id;

                    return (
                      <div
                        key={expense.id}
                        className="py-4 flex justify-between items-center group/exp transition hover:bg-gray-50/50 px-2 rounded-xl -mx-2"
                      >
                        <div 
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => navigate(`/expenses/${expense.id}`)}
                        >
                          {/* Calendar date icon representation */}
                          <div className="bg-gray-50 border border-gray-100 text-gray-400 px-3 py-2 rounded-xl text-center shrink-0">
                            <span className="text-[10px] uppercase font-bold tracking-wider block">
                              {new Date(expense.created_at).toLocaleDateString(undefined, { month: 'short' })}
                            </span>
                            <span className="text-lg font-extrabold text-gray-800 leading-none">
                              {new Date(expense.created_at).toLocaleDateString(undefined, { day: '2-digit' })}
                            </span>
                          </div>

                          <div className="truncate pr-4">
                            <h3 className="font-bold text-gray-800 group-hover/exp:text-emerald-600 transition truncate">
                              {expense.description}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Paid by <span className="font-semibold text-gray-500">{expense.payer.username}</span> • ₹{parseFloat(expense.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Balance display relative to current user */}
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right">
                            {paidByMe ? (
                              <>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">You lent</span>
                                <span className="text-sm font-bold text-emerald-600">
                                  ₹{(parseFloat(expense.amount) - (userSplit ? parseFloat(userSplit.amount) : 0)).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">You borrowed</span>
                                <span className="text-sm font-bold text-orange-500">
                                  {owes > 0 ? `₹${owes.toFixed(2)}` : 'None'}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Quick chat indicator & delete action */}
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/expenses/${expense.id}`}
                              className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Join discussion"
                            >
                              <MessageCircle className="h-4.5 w-4.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete expense"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Members, Balances & Simplified Debts (1 column width) */}
          <div className="space-y-6">
            
            {/* Members Section */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Group Members</span>
                <span className="text-xs text-gray-400 font-medium">{group.members.length} total</span>
              </h2>

              {/* Add Member autocomplete search */}
              <div className="relative mb-5" ref={inviteDropdownRef}>
                <div className="relative">
                  <UserPlus className="absolute inset-y-0 left-3 h-5 w-5 text-gray-400 flex items-center pointer-events-none mt-2.5" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 transition"
                    placeholder="Search username or email..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                
                {/* Search error display */}
                {inviteError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{inviteError}</span>
                  </p>
                )}

                {/* Dropdown search results */}
                {searchResults.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-50 max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <li key={user.id}>
                        <button
                          onClick={() => handleInviteUser(user)}
                          className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm flex justify-between items-center transition cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-gray-700 block">{user.username}</span>
                            <span className="text-xs text-gray-400 block">{user.email}</span>
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

              {/* Members listing */}
              <ul className="space-y-3">
                {group.members.map((member) => {
                  const isSelf = member.id === currentUser.id;
                  const netVal = parseFloat(group.net_balances?.[member.id] || '0.00');

                  return (
                    <li key={member.id} className="flex justify-between items-center group/member">
                      <div className="truncate pr-3">
                        <span className="text-sm font-semibold text-gray-800 block truncate">
                          {member.username} {isSelf && <span className="text-xs text-emerald-600 font-medium">(You)</span>}
                        </span>
                        
                        {/* Member balance info */}
                        <span className={`text-xs font-bold ${
                          netVal > 0 ? 'text-emerald-600' : netVal < 0 ? 'text-orange-500' : 'text-gray-400'
                        }`}>
                          {netVal > 0 ? `Is owed ₹${netVal.toFixed(2)}` : netVal < 0 ? `Owes ₹${Math.abs(netVal).toFixed(2)}` : 'Settled'}
                        </span>
                      </div>

                      {/* Remove member control */}
                      {!isSelf && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover/member:opacity-100 transition cursor-pointer shrink-0"
                          title="Remove from group"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Simplified Balances Recommendation Box */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                <HelpCircle className="h-5 w-5 text-gray-400" />
                <span>Simplified Debts</span>
              </h2>

              {group.simplified_debts.length === 0 ? (
                <p className="text-sm text-gray-400 italic">This group is fully settled up.</p>
              ) : (
                <ul className="space-y-3">
                  {group.simplified_debts.map((debt, idx) => {
                    const involvesMe = debt.from_user_id === currentUser.id || debt.to_user_id === currentUser.id;

                    return (
                      <li key={idx} className={`text-sm p-3.5 border rounded-xl flex flex-col justify-between gap-2.5 ${
                        involvesMe ? 'bg-emerald-50/20 border-emerald-100/50' : 'bg-gray-50/30 border-gray-100'
                      }`}>
                        <div>
                          <span className="font-semibold text-gray-700">{debt.from_username}</span>
                          <span className="text-gray-400 text-xs mx-1.5">owes</span>
                          <span className="font-semibold text-gray-700">{debt.to_username}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-base font-extrabold text-gray-900">₹{parseFloat(debt.amount).toFixed(2)}</span>
                          
                          {/* If current user is the debtor, show inline settle button */}
                          {debt.from_user_id === currentUser.id && (
                            <Link
                              to={`/groups/${id}/settle?payer=${debt.from_user_id}&payee=${debt.to_user_id}&amount=${debt.amount}`}
                              className="text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition"
                            >
                              Pay Now
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};

export default GroupDetails;
