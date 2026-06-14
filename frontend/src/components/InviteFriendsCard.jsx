import React, { useState } from 'react';
import api from '../api';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

const InviteFriendsCard = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/api/friends/invite/', { email: email.trim() });
      setSuccess(true);
      setEmail('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
      <h3 className="text-sm font-bold text-emerald-950 mb-1">Invite friends</h3>
      <p className="text-xs text-emerald-700/80 mb-3 leading-relaxed">
        Enter an email address to invite friends to join your Splitwise clone.
      </p>

      {success && (
        <div className="mb-2.5 p-2 bg-emerald-100 border border-emerald-250 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 animate-in fade-in duration-200">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Invite sent successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-2.5 p-2 bg-red-50 border border-red-100 text-red-700 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 animate-in fade-in duration-200">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleInvite} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="friend@email.com"
          className="flex-1 px-3 py-1.5 bg-white border border-emerald-100 focus:border-emerald-500 rounded-xl text-xs outline-none transition text-emerald-950 placeholder-emerald-700/40 font-medium"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer shadow-sm hover:shadow-emerald-600/10"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};

export default InviteFriendsCard;
