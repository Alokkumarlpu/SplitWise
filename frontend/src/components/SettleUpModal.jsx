import React, { useState, useEffect } from 'react';
import api from '../api';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const SettleUpModal = ({ isOpen, onClose, groups = [], onSuccess }) => {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [group, setGroup] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [payerId, setPayerId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form states on close/open
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNotes('');
      setError('');
      setGroup(null);
      if (groups.length > 0) {
        setSelectedGroupId(groups[0].id.toString());
      } else {
        setSelectedGroupId('');
      }
    }
  }, [isOpen, groups]);

  // Fetch group details to get members list when group selection changes
  useEffect(() => {
    if (!selectedGroupId) {
      setGroup(null);
      return;
    }

    const fetchGroupMembers = async () => {
      setMembersLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/groups/${selectedGroupId}/`);
        setGroup(res.data);

        // Prepopulate based on simplified debts
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const debts = res.data.simplified_debts || [];
        
        // 1. Current user owes someone
        const userOwes = debts.find(d => d.from_user_id === currentUser.id);
        // 2. Someone owes current user
        const userIsOwed = debts.find(d => d.to_user_id === currentUser.id);
        // 3. Any other debt
        const anyDebt = debts[0];

        if (userOwes) {
          setPayerId(userOwes.from_user_id.toString());
          setReceiverId(userOwes.to_user_id.toString());
          setAmount(userOwes.amount);
        } else if (userIsOwed) {
          setPayerId(userIsOwed.from_user_id.toString());
          setReceiverId(userIsOwed.to_user_id.toString());
          setAmount(userIsOwed.amount);
        } else if (anyDebt) {
          setPayerId(anyDebt.from_user_id.toString());
          setReceiverId(anyDebt.to_user_id.toString());
          setAmount(anyDebt.amount);
        } else {
          // Default fallback
          const isMember = res.data.members.some((m) => m.id === currentUser.id);
          setPayerId(isMember ? currentUser.id.toString() : res.data.members[0]?.id?.toString() || '');
          const otherMembers = res.data.members.filter((m) => m.id !== (isMember ? currentUser.id : res.data.members[0]?.id));
          setReceiverId(otherMembers[0]?.id?.toString() || res.data.members[0]?.id?.toString() || '');
          setAmount('');
        }
      } catch (err) {
        setError('Failed to fetch group members.');
      } finally {
        setMembersLoading(false);
      }
    };

    fetchGroupMembers();
  }, [selectedGroupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !group) {
      setError('Please select a group.');
      return;
    }
    if (!payerId || !receiverId) {
      setError('Payer and receiver are required.');
      return;
    }
    if (payerId === receiverId) {
      setError('Payer and receiver cannot be the same person.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/api/settlements/', {
        group: parseInt(selectedGroupId),
        payer_id: parseInt(payerId),
        payee_id: parseInt(receiverId),
        amount: parseFloat(amount),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to record settlement.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <h3 className="font-bold text-lg text-gray-900">Record a Settlement</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Group */}
          <div>
            <label htmlFor="modal-settle-group-select" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Select Group
            </label>
            <select
              id="modal-settle-group-select"
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-sm text-gray-700 font-semibold"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.length === 0 && <option value="">No groups available</option>}
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {membersLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          ) : group ? (
            <>
              {/* Payer & Payee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-settle-payer" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Who paid?
                  </label>
                  <select
                    id="modal-settle-payer"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-xs text-gray-700 font-semibold"
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                  >
                    {group.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="modal-settle-receiver" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Who received?
                  </label>
                  <select
                    id="modal-settle-receiver"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-xs text-gray-700 font-semibold"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                  >
                    {group.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="modal-settle-amount" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Settlement Amount (₹)
                </label>
                <input
                  id="modal-settle-amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-sm text-gray-800 font-bold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="modal-settle-notes" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <input
                  id="modal-settle-notes"
                  type="text"
                  placeholder="e.g. Settle up balance"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-xs text-gray-850"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded-xl">
              Select a group above to load members.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl text-gray-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !group}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-xs font-bold text-white rounded-xl shadow-md transition cursor-pointer"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettleUpModal;
