import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Wallet, AlertCircle, CheckCircle, Info } from 'lucide-react';

const AddExpense = () => {
  const { id } = useParams(); // Group ID
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState('equal');
  
  // Splits values state: { [user_id]: value } (e.g. percent, custom amount, or shares weight)
  const [splitsValues, setSplitsValues] = useState({});
  // Which group members are participating (mostly for equal splits, but useful for all)
  const [participants, setParticipants] = useState({});

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await api.get(`/api/groups/${id}/`);
        setGroup(res.data);
        
        // Default payer to logged-in user if they are in the group
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isMember = res.data.members.some(m => m.id === currentUser.id);
        setPayerId(isMember ? currentUser.id : res.data.members[0]?.id || '');

        // Initialize participants and split values
        const initialParticipants = {};
        const initialValues = {};
        res.data.members.forEach((m) => {
          initialParticipants[m.id] = true; // default all members participate
          initialValues[m.id] = '';
        });
        setParticipants(initialParticipants);
        setSplitsValues(initialValues);
      } catch (err) {
        console.error("Error fetching group for expense", err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  const handleToggleParticipant = (userId) => {
    setParticipants(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleSplitValueChange = (userId, val) => {
    setSplitsValues(prev => ({
      ...prev,
      [userId]: val
    }));
  };

  // Helper selectors to compute sum and validate splits before submitting
  const getSelectedCount = () => Object.values(participants).filter(Boolean).length;
  const getParsedAmount = () => parseFloat(amount) || 0;
  
  const getRunningTotal = () => {
    let sum = 0;
    group.members.forEach((m) => {
      if (participants[m.id]) {
        sum += parseFloat(splitsValues[m.id]) || 0;
      }
    });
    return sum;
  };

  const getRunningSharesSum = () => {
    let sum = 0;
    group.members.forEach((m) => {
      if (participants[m.id]) {
        sum += parseFloat(splitsValues[m.id]) || 0;
      }
    });
    return sum || 1; // avoid division by zero
  };

  const getValidationError = () => {
    const parsedAmount = getParsedAmount();
    if (parsedAmount <= 0) return 'Amount must be greater than zero.';
    if (getSelectedCount() === 0) return 'At least one group member must participate in the split.';

    if (splitType === 'unequal') {
      const totalAllocated = getRunningTotal();
      if (Math.abs(totalAllocated - parsedAmount) > 0.01) {
        return `Custom splits total is ₹${totalAllocated.toFixed(2)}. It must equal the total amount ₹${parsedAmount.toFixed(2)}.`;
      }
    } else if (splitType === 'percentage') {
      const totalPercentage = getRunningTotal();
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return `Percentages total is ${totalPercentage.toFixed(2)}%. It must sum to exactly 100%.`;
      }
    } else if (splitType === 'shares') {
      let sharesError = '';
      group.members.forEach((m) => {
        if (participants[m.id]) {
          const sh = parseFloat(splitsValues[m.id]);
          if (isNaN(sh) || sh <= 0) {
            sharesError = 'Shares weight must be a positive number for all participants.';
          }
        }
      });
      if (sharesError) return sharesError;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErr = getValidationError();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    const payloadSplits = [];
    group.members.forEach((m) => {
      if (participants[m.id]) {
        payloadSplits.push({
          user_id: m.id,
          split_type: splitType,
          split_value: splitType === 'equal' ? null : splitsValues[m.id] || 0
        });
      }
    });

    try {
      await api.post('/api/expenses/', {
        group: parseInt(id),
        description,
        amount: parseFloat(amount),
        payer_id: parseInt(payerId),
        splits: payloadSplits
      });
      navigate(`/groups/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to create expense.');
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

  const parsedAmount = getParsedAmount();
  const selectedCount = getSelectedCount();
  const validationError = getValidationError();

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        
        {/* Back Link */}
        <Link to={`/groups/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium transition mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {group.name}</span>
        </Link>

        {/* Card Form container */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add an Expense</h1>
              <p className="text-sm text-gray-500 mt-0.5">Split bills with members in {group.name}.</p>
            </div>
          </div>

          {/* Validation/API error reporting */}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-2.5 mb-6">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Description & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="description">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  required
                  placeholder="e.g. Taxi ride, groceries"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="amount">
                  Total Amount (₹)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition font-medium"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Payer Select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="payer">
                Paid By
              </label>
              <select
                id="payer"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition font-medium text-gray-700"
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
              >
                {group.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Type Tabs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Splitting Method
              </label>
              <div className="grid grid-cols-4 bg-gray-50 p-1.5 rounded-xl border border-gray-100 gap-1.5 text-center">
                {['equal', 'unequal', 'percentage', 'shares'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSplitType(t)}
                    className={`py-2 text-xs font-bold capitalize rounded-lg transition-all cursor-pointer ${
                      splitType === t
                        ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Participants split breakdown list */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Splits Breakdown
                </label>
                
                {/* Real-time split status indicator helper */}
                {amount && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    validationError 
                      ? 'bg-red-50 border-red-100 text-red-600' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  }`}>
                    {splitType === 'equal' && `₹${(parsedAmount / (selectedCount || 1)).toFixed(2)} each`}
                    {splitType === 'unequal' && `₹${getRunningTotal().toFixed(2)} of ₹${parsedAmount.toFixed(2)}`}
                    {splitType === 'percentage' && `${getRunningTotal().toFixed(2)}% of 100%`}
                    {splitType === 'shares' && `Total shares: ${getRunningSharesSum()}`}
                  </span>
                )}
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-150 bg-gray-50/30">
                {group.members.map((member) => {
                  const isChecked = !!participants[member.id];
                  const shareVal = splitsValues[member.id] || '';

                  return (
                    <div key={member.id} className="p-4 flex items-center justify-between gap-4">
                      
                      {/* Checkbox trigger to include/exclude */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4.5 w-4.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                          checked={isChecked}
                          onChange={() => handleToggleParticipant(member.id)}
                        />
                        <span className={`text-sm font-semibold transition ${
                          isChecked ? 'text-gray-800 font-bold' : 'text-gray-400'
                        }`}>
                          {member.username}
                        </span>
                      </div>

                      {/* Right action inputs depending on split type */}
                      {isChecked && (
                        <div className="flex items-center gap-2 max-w-[140px] w-full shrink-0">
                          {splitType === 'equal' && (
                            <span className="text-sm font-bold text-gray-700 text-right w-full block">
                              ₹{(parsedAmount / (selectedCount || 1)).toFixed(2)}
                            </span>
                          )}

                          {splitType === 'unequal' && (
                            <div className="relative w-full">
                              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 font-medium text-sm pointer-events-none">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full pl-7 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-right font-medium outline-none focus:border-emerald-500"
                                placeholder="0.00"
                                value={shareVal}
                                onChange={(e) => handleSplitValueChange(member.id, e.target.value)}
                              />
                            </div>
                          )}

                          {splitType === 'percentage' && (
                            <div className="relative w-full">
                              <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 font-semibold text-sm pointer-events-none">%</span>
                              <input
                                type="number"
                                className="w-full pl-3 pr-7 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-right font-medium outline-none focus:border-emerald-500"
                                placeholder="0"
                                value={shareVal}
                                onChange={(e) => handleSplitValueChange(member.id, e.target.value)}
                              />
                            </div>
                          )}

                          {splitType === 'shares' && (
                            <div className="w-full flex flex-col items-end">
                              <input
                                type="number"
                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-right font-medium outline-none focus:border-emerald-500"
                                placeholder="shares"
                                value={shareVal}
                                onChange={(e) => handleSplitValueChange(member.id, e.target.value)}
                              />
                              
                              {/* Real-time share preview */}
                              {amount && splitsValues[member.id] && (
                                <span className="text-[10px] font-bold text-gray-400 block mt-0.5">
                                  ₹{((parsedAmount * (parseFloat(splitsValues[member.id]) || 0)) / getRunningSharesSum()).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
              <Link
                to={`/groups/${id}`}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-emerald-600/10 active:scale-[0.98] transition cursor-pointer"
              >
                Save Expense
              </button>
            </div>

          </form>
        </div>

      </main>
    </div>
  );
};

export default AddExpense;
