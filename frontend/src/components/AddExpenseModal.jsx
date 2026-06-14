import React, { useState, useEffect } from 'react';
import api from '../api';
import { X, Wallet, AlertCircle } from 'lucide-react';

const AddExpenseModal = ({ isOpen, onClose, groups = [], onSuccess }) => {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [group, setGroup] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splitsValues, setSplitsValues] = useState({});
  const [participants, setParticipants] = useState({});

  // Reset form states on close/open
  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
      setSplitType('equal');
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

        // Default payer to logged-in user if in group, else first member
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isMember = res.data.members.some((m) => m.id === currentUser.id);
        setPayerId(isMember ? currentUser.id.toString() : res.data.members[0]?.id?.toString() || '');

        // Initialize splits values
        const initialParticipants = {};
        const initialValues = {};
        res.data.members.forEach((m) => {
          initialParticipants[m.id] = true;
          initialValues[m.id] = '';
        });
        setParticipants(initialParticipants);
        setSplitsValues(initialValues);
      } catch (err) {
        setError('Failed to fetch group members.');
      } finally {
        setMembersLoading(false);
      }
    };

    fetchGroupMembers();
  }, [selectedGroupId]);

  const handleToggleParticipant = (userId) => {
    setParticipants((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSplitValueChange = (userId, val) => {
    setSplitsValues((prev) => ({
      ...prev,
      [userId]: val,
    }));
  };

  const getSelectedCount = () => Object.values(participants).filter(Boolean).length;
  const getParsedAmount = () => parseFloat(amount) || 0;

  const getRunningTotal = () => {
    if (!group) return 0;
    let sum = 0;
    group.members.forEach((m) => {
      if (participants[m.id]) {
        sum += parseFloat(splitsValues[m.id]) || 0;
      }
    });
    return sum;
  };

  const getRunningSharesSum = () => {
    if (!group) return 1;
    let sum = 0;
    group.members.forEach((m) => {
      if (participants[m.id]) {
        sum += parseFloat(splitsValues[m.id]) || 0;
      }
    });
    return sum || 1;
  };

  const getValidationError = () => {
    const parsedAmount = getParsedAmount();
    if (parsedAmount <= 0) return 'Amount must be greater than zero.';
    if (getSelectedCount() === 0) return 'At least one member must participate.';

    if (splitType === 'unequal') {
      const totalAllocated = getRunningTotal();
      if (Math.abs(totalAllocated - parsedAmount) > 0.01) {
        return `Custom splits total (₹${totalAllocated.toFixed(2)}) must equal total amount (₹${parsedAmount.toFixed(2)}).`;
      }
    } else if (splitType === 'percentage') {
      const totalPercentage = getRunningTotal();
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return `Percentages total (${totalPercentage.toFixed(2)}%) must equal 100%.`;
      }
    } else if (splitType === 'shares') {
      let sharesError = '';
      group?.members.forEach((m) => {
        if (participants[m.id]) {
          const sh = parseFloat(splitsValues[m.id]);
          if (isNaN(sh) || sh <= 0) {
            sharesError = 'Shares weight must be positive for all participants.';
          }
        }
      });
      if (sharesError) return sharesError;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !group) {
      setError('Please select a group.');
      return;
    }

    const validationErr = getValidationError();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setLoading(true);
    setError('');

    const payloadSplits = [];
    group.members.forEach((m) => {
      if (participants[m.id]) {
        payloadSplits.push({
          user_id: m.id,
          split_type: splitType,
          split_value: splitType === 'equal' ? null : parseFloat(splitsValues[m.id]) || 0,
        });
      }
    });

    try {
      await api.post('/api/expenses/', {
        group: parseInt(selectedGroupId),
        description: description.trim(),
        amount: getParsedAmount(),
        payer_id: parseInt(payerId),
        splits: payloadSplits,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to create expense.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const parsedAmount = getParsedAmount();
  const selectedCount = getSelectedCount();
  const valError = getValidationError();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
          <div className="flex items-center gap-2 text-emerald-600">
            <Wallet className="h-5 w-5" />
            <h3 className="font-bold text-lg text-gray-900">Add an Expense</h3>
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
            <label htmlFor="modal-group-select" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Select Group
            </label>
            <select
              id="modal-group-select"
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-sm text-gray-700 font-semibold"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.length === 0 && <option value="">No groups available - create one first</option>}
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
              {/* Description & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-exp-description" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <input
                    id="modal-exp-description"
                    type="text"
                    required
                    placeholder="e.g. Dinner, Taxi"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-xs text-gray-800"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="modal-exp-amount" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Amount (₹)
                  </label>
                  <input
                    id="modal-exp-amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-xs text-gray-800 font-semibold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Payer Select */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label htmlFor="modal-exp-payer" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Paid By
                  </label>
                  <select
                    id="modal-exp-payer"
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Split Type
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-xs text-gray-700 font-semibold"
                    value={splitType}
                    onChange={(e) => setSplitType(e.target.value)}
                  >
                    <option value="equal">Equally</option>
                    <option value="unequal">Unequally</option>
                    <option value="percentage">Percentage</option>
                    <option value="shares">Shares</option>
                  </select>
                </div>
              </div>

              {/* Splits Breakdown */}
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Split shares</span>
                  {amount && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      valError ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                      {splitType === 'equal' && `₹${(parsedAmount / (selectedCount || 1)).toFixed(2)} each`}
                      {splitType === 'unequal' && `₹${getRunningTotal().toFixed(2)} of ₹${parsedAmount.toFixed(2)}`}
                      {splitType === 'percentage' && `${getRunningTotal().toFixed(2)}% of 100%`}
                      {splitType === 'shares' && `Total shares: ${getRunningSharesSum()}`}
                    </span>
                  )}
                </div>

                <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {group.members.map((m) => {
                    const isChecked = !!participants[m.id];
                    const shareVal = splitsValues[m.id] || '';

                    return (
                      <div key={m.id} className="p-3 flex items-center justify-between gap-4 bg-gray-50/20">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                            checked={isChecked}
                            onChange={() => handleToggleParticipant(m.id)}
                          />
                          <span className={`text-xs font-semibold ${isChecked ? 'text-gray-800' : 'text-gray-400'}`}>
                            {m.username}
                          </span>
                        </div>

                        {isChecked && (
                          <div className="flex items-center gap-1.5 max-w-[100px] w-full shrink-0">
                            {splitType === 'equal' && (
                              <span className="text-xs font-bold text-gray-700 text-right w-full block">
                                ₹{(parsedAmount / (selectedCount || 1)).toFixed(2)}
                              </span>
                            )}
                            {splitType === 'unequal' && (
                              <div className="relative w-full">
                                <span className="absolute inset-y-0 left-2 flex items-center text-gray-400 text-[10px] pointer-events-none">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full pl-5 pr-2 py-1 bg-white border border-gray-250 rounded-lg text-xs text-right font-medium outline-none focus:border-emerald-500"
                                  value={shareVal}
                                  onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                                />
                              </div>
                            )}
                            {splitType === 'percentage' && (
                              <div className="relative w-full">
                                <span className="absolute inset-y-0 right-2 flex items-center text-gray-400 text-[10px] pointer-events-none">%</span>
                                <input
                                  type="number"
                                  className="w-full pl-2 pr-5 py-1 bg-white border border-gray-250 rounded-lg text-xs text-right font-medium outline-none focus:border-emerald-500"
                                  value={shareVal}
                                  onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                                />
                              </div>
                            )}
                            {splitType === 'shares' && (
                              <div className="w-full">
                                <input
                                  type="number"
                                  className="w-full px-2 py-1 bg-white border border-gray-250 rounded-lg text-xs text-right font-medium outline-none focus:border-emerald-500"
                                  placeholder="shares"
                                  value={shareVal}
                                  onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded-xl">
              Select a sharing group above to load split members.
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
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
