import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { Plus, Users, ArrowUpRight, ArrowDownLeft, DollarSign, PlusCircle, FolderPlus, ArrowRight, UserCheck } from 'lucide-react';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({
    total_net_balance: '0.00',
    total_owed: '0.00',
    total_owe: '0.00',
    debts_to_receive: [],
    debts_to_pay: [],
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [groupsRes, balancesRes] = await Promise.all([
        api.get('/api/groups/'),
        api.get('/api/balances/'),
      ]);
      setGroups(groupsRes.data);
      setBalances(balancesRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreating(true);
    try {
      const res = await api.post('/api/groups/', { name: newGroupName, member_ids: [] });
      setNewGroupName('');
      setShowModal(false);
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      console.error("Error creating group", err);
    } finally {
      setCreating(false);
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

  const netBal = parseFloat(balances.total_net_balance);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Keep track of your group expenses and balances.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-emerald-600/10 active:scale-[0.98] transition cursor-pointer"
          >
            <FolderPlus className="h-5 w-5" />
            <span>New Group</span>
          </button>
        </div>

        {/* Global Balance Board Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 text-center">
            
            {/* Total Balance */}
            <div className="p-6 flex flex-col justify-center items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Balance</span>
              <span className={`text-3xl font-bold tracking-tight ${
                netBal > 0 ? 'text-emerald-600' : netBal < 0 ? 'text-orange-500' : 'text-gray-500'
              }`}>
                {netBal > 0 ? `+₹${netBal.toFixed(2)}` : netBal < 0 ? `-₹${Math.abs(netBal).toFixed(2)}` : '₹0.00'}
              </span>
            </div>

            {/* You are owed */}
            <div className="p-6 flex flex-col justify-center items-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                <span>You are owed</span>
              </div>
              <span className="text-3xl font-bold text-emerald-600 tracking-tight">
                ₹{parseFloat(balances.total_owed).toFixed(2)}
              </span>
            </div>

            {/* You owe */}
            <div className="p-6 flex flex-col justify-center items-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                <ArrowDownLeft className="h-4 w-4 text-orange-500" />
                <span>You owe</span>
              </div>
              <span className="text-3xl font-bold text-orange-500 tracking-tight">
                ₹{parseFloat(balances.total_owe).toFixed(2)}
              </span>
            </div>

          </div>
        </div>

        {/* Simplified Debt Dashboard Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Debts you need to collect */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>People who owe you</span>
            </h2>
            {balances.debts_to_receive.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No one owes you money right now.</p>
            ) : (
              <ul className="space-y-3">
                {balances.debts_to_receive.map((debt, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-emerald-50/30 border border-emerald-50 px-4 py-3 rounded-xl">
                    <div>
                      <span className="font-semibold text-gray-800">{debt.from_username}</span>
                      <span className="text-xs text-gray-400 block mt-0.5">Owes you in {debt.group_name}</span>
                    </div>
                    <span className="text-emerald-600 font-bold">₹{parseFloat(debt.amount).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Debts you need to pay */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span>
              <span>People you owe</span>
            </h2>
            {balances.debts_to_pay.length === 0 ? (
              <p className="text-sm text-gray-400 italic">You don't owe money to anyone.</p>
            ) : (
              <ul className="space-y-3">
                {balances.debts_to_pay.map((debt, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-orange-50/30 border border-orange-50 px-4 py-3 rounded-xl">
                    <div>
                      <span className="font-semibold text-gray-800">{debt.to_username}</span>
                      <span className="text-xs text-gray-400 block mt-0.5">You owe in {debt.group_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-500 font-bold">₹{parseFloat(debt.amount).toFixed(2)}</span>
                      <Link
                        to={`/groups/${debt.group_id}/settle`}
                        className="text-xs px-2.5 py-1 bg-white hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-200 rounded-md font-semibold transition"
                      >
                        Settle
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Groups Listing Area */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span>Your Groups</span>
          </h2>
          {groups.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-12 px-6 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-md font-bold text-gray-700">No Groups Found</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">Create a group to split house rent, bills, trip expenses or restaurant charges with friends.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Group</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const grpBal = parseFloat(group.net_balances?.[group.id] || '0.00'); // wait, net_balances is map of {user_id: balance}
                // Let's retrieve current user balance in this group
                // Net balances are keyed by user ID strings in GroupSerializer
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const grpUserBal = parseFloat(group.net_balances?.[user.id] || '0.00');

                return (
                  <div
                    key={group.id}
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="bg-white border border-gray-100 hover:border-emerald-500/30 rounded-2xl p-6 shadow-sm hover:shadow-md active:scale-[0.99] transition duration-200 cursor-pointer flex flex-col justify-between group h-48"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition truncate pr-4">
                          {group.name}
                        </h3>
                        <span className="text-xs text-gray-400 font-medium shrink-0">
                          {group.members.length} members
                        </span>
                      </div>
                      
                      {/* List names of a few members */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {group.members.slice(0, 3).map((m, idx) => (
                          <span key={m.id} className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {m.username}
                          </span>
                        ))}
                        {group.members.length > 3 && (
                          <span className="text-xs text-gray-400">+{group.members.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-50 pt-4 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Your Balance</span>
                        <span className={`text-sm font-bold ${
                          grpUserBal > 0 ? 'text-emerald-600' : grpUserBal < 0 ? 'text-orange-500' : 'text-gray-500'
                        }`}>
                          {grpUserBal > 0 ? `Owed: +₹${grpUserBal.toFixed(2)}` : grpUserBal < 0 ? `You owe: -₹${Math.abs(grpUserBal).toFixed(2)}` : 'Settle Up'}
                        </span>
                      </div>
                      <span className="text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition duration-200">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Modal for Group Creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Create a New Group</h3>
            <p className="text-sm text-gray-500 mb-4">Enter a descriptive name like "Flat 202 Bills" or "Summer Trip 2026".</p>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                placeholder="Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewGroupName('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newGroupName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
