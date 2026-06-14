import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, ArrowRight, DollarSign, Wallet, AlertCircle } from 'lucide-react';

const SettleUp = () => {
  const { id } = useParams(); // Group ID
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [payerId, setPayerId] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await api.get(`/api/groups/${id}/`);
        setGroup(res.data);

        // Prepopulate based on query parameters if available
        const qPayer = searchParams.get('payer');
        const qPayee = searchParams.get('payee');
        const qAmount = searchParams.get('amount');

        // Verify query users are actually group members
        const qPayerValid = qPayer && res.data.members.some(m => m.id === parseInt(qPayer));
        const qPayeeValid = qPayee && res.data.members.some(m => m.id === parseInt(qPayee));

        if (qPayerValid && qPayeeValid) {
          setPayerId(qPayer);
          setPayeeId(qPayee);
          setAmount(qAmount || '');
        } else {
          // Default: payer is current logged-in user, payee is the first other member
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          setPayerId(currentUser.id || res.data.members[0]?.id || '');
          const otherMember = res.data.members.find(m => m.id !== currentUser.id);
          setPayeeId(otherMember?.id || res.data.members[1]?.id || '');
        }

      } catch (err) {
        console.error("Error loading group for settlement", err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (parseInt(payerId) === parseInt(payeeId)) {
      setError('Payer and Payee cannot be the same user.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/settlements/', {
        group: parseInt(id),
        payer_id: parseInt(payerId),
        payee_id: parseInt(payeeId),
        amount: parsedAmount
      });
      navigate(`/groups/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record settlement.');
    } finally {
      setSubmitting(false);
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

  const selectedPayer = group.members.find(m => m.id === parseInt(payerId));
  const selectedPayee = group.members.find(m => m.id === parseInt(payeeId));

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        
        {/* Back Link */}
        <Link to={`/groups/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium transition mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {group.name}</span>
        </Link>

        {/* Card Form */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Record a Settlement</h1>
              <p className="text-sm text-gray-500 mt-0.5">Log an external cash or online transfer in {group.name}.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-2.5 mb-6">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Visual payment flow representation */}
            {selectedPayer && selectedPayee && (
              <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 text-center flex items-center justify-center gap-4">
                <div className="text-center truncate max-w-[120px]">
                  <span className="font-bold text-gray-800 text-sm block truncate">{selectedPayer.username}</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block mt-0.5">Payer</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-emerald-600 animate-pulse" />
                  {amount && (
                    <span className="text-xs font-extrabold text-emerald-700 mt-0.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      ₹{parseFloat(amount || 0).toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="text-center truncate max-w-[120px]">
                  <span className="font-bold text-gray-800 text-sm block truncate">{selectedPayee.username}</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block mt-0.5">Receiver</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payer field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="payer">
                  Who Paid?
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

              {/* Payee field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="payee">
                  Who Received?
                </label>
                <select
                  id="payee"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition font-medium text-gray-700"
                  value={payeeId}
                  onChange={(e) => setPayeeId(e.target.value)}
                >
                  {group.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="amount">
                Amount Paid (₹)
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition font-semibold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
              <Link
                to={`/groups/${id}`}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-emerald-600/10 active:scale-[0.98] transition cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Recording...</span>
                  </>
                ) : (
                  'Record Settlement'
                )}
              </button>
            </div>

          </form>
        </div>

      </main>
    </div>
  );
};

export default SettleUp;
