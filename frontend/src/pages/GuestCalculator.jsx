import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, HelpCircle, Calculator, Check, Copy } from 'lucide-react';

const GuestCalculator = () => {
  const [totalAmount, setTotalAmount] = useState('');
  const [daysInMonth, setDaysInMonth] = useState('30');
  const [participants, setParticipants] = useState(3);
  const [guestDays, setGuestDays] = useState(['10', '0', '0']); // Default guest days
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleParticipantsChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    setParticipants(count);

    // Sync guest days list length
    const updated = [...guestDays];
    if (updated.length < count) {
      while (updated.length < count) {
        updated.push('0');
      }
    } else if (updated.length > count) {
      updated.splice(count);
    }
    setGuestDays(updated);
  };

  const handleGuestDaysChange = (index, value) => {
    const updated = [...guestDays];
    updated[index] = value;
    setGuestDays(updated);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Please enter a valid bill amount.');
      return;
    }
    const days = parseInt(daysInMonth);
    if (isNaN(days) || days <= 0) {
      setError('Please enter a valid number of days in the month.');
      return;
    }

    setError('');
    setLoading(true);
    setResults(null);

    const parsedGuestDays = guestDays.map((d) => parseInt(d) || 0);
    if (parsedGuestDays.some((d) => d < 0)) {
      setError('Guest days cannot be negative numbers.');
      setLoading(false);
      return;
    }

    const payload = {
      total_amount: parseFloat(totalAmount),
      days_in_month: days,
      participants: participants,
      guest_days: parsedGuestDays,
    };

    try {
      const res = await api.post('/api/calculators/guest/', payload);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compute splits. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!results) return;
    const splitText = results.splits
      .map((val, idx) => `Roommate ${idx + 1}: ₹${parseFloat(val).toFixed(2)}`)
      .join('\n');
    const fullText = `Guest Utility Split Breakdown (Total Bill: ₹${parseFloat(totalAmount).toFixed(2)})\n${splitText}\nAverage Share: ₹${parseFloat(
      results.per_person
    ).toFixed(2)}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/calculators"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 font-medium transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Calculators</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guest Split Calculator</h1>
            <p className="text-sm text-gray-500">Fairly split utilities when roommates host temporary guests for a part of the month.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inputs Form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-1.5">
              <Calculator className="h-5 w-5 text-gray-400" />
              <span>Calculation Details</span>
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCalculate} className="space-y-5">
              {/* Total Bill */}
              <div>
                <label htmlFor="total-bill" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Total Utility Bill (₹)
                </label>
                <input
                  id="total-bill"
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-gray-900"
                  placeholder="e.g. 3000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Days in Month */}
                <div>
                  <label htmlFor="days-in-month" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Days in Month
                  </label>
                  <input
                    id="days-in-month"
                    type="number"
                    min="1"
                    max="31"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-gray-900"
                    value={daysInMonth}
                    onChange={(e) => setDaysInMonth(e.target.value)}
                    required
                  />
                </div>

                {/* Number of Roommates */}
                <div>
                  <label htmlFor="roommates-count" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Roommates Count
                  </label>
                  <input
                    id="roommates-count"
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition text-gray-900"
                    value={participants}
                    onChange={handleParticipantsChange}
                    required
                  />
                </div>
              </div>

              {/* Guest Days inputs */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roommate Guest Days</span>
                  <div className="relative group">
                    <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 leading-relaxed">
                      Enter the total number of days a roommate hosted a guest (e.g. Roommate 1 hosted a guest for 10 days). Enter 0 if no guest.
                    </div>
                  </div>
                </div>
                {guestDays.map((val, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-gray-150">
                    <span className="text-xs font-semibold text-gray-600">Roommate {index + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        className="w-20 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right font-medium outline-none focus:bg-white focus:border-emerald-500 transition"
                        value={val}
                        onChange={(e) => handleGuestDaysChange(index, e.target.value)}
                        required
                      />
                      <span className="text-xs text-gray-400 font-semibold">days</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Computing...' : 'Calculate Guest Utility Share'}
              </button>
            </form>
          </div>

          {/* Results Output */}
          <div className="flex flex-col gap-6">
            {results ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Split Breakdown</h2>
                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50 cursor-pointer transition"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Results'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50/70 p-4 border border-gray-100 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Total Utility Bill</span>
                      <span className="text-xl font-extrabold text-gray-900">₹{parseFloat(totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="bg-gray-50/70 p-4 border border-gray-100 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Average Share</span>
                      <span className="text-xl font-extrabold text-gray-900">₹{parseFloat(results.per_person).toFixed(2)}</span>
                    </div>
                  </div>

                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Roommate Breakdown</span>
                  <div className="space-y-3">
                    {results.splits.map((splitVal, idx) => {
                      const shareDays = parseInt(daysInMonth) + (parseInt(guestDays[idx]) || 0);
                      return (
                        <div key={idx} className="flex justify-between items-center p-3.5 bg-gray-50/30 border border-gray-100 rounded-xl hover:bg-gray-50/75 transition">
                          <div>
                            <span className="text-sm font-semibold text-gray-700 block">Roommate {idx + 1}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {daysInMonth} room days + {guestDays[idx]} guest days = {shareDays} total days
                            </span>
                          </div>
                          <span className="text-base font-extrabold text-gray-900">₹{parseFloat(splitVal).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-5 mt-6 text-center text-xs text-gray-400">
                  ✨ Logged into your account history for future reference.
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center flex-1 flex flex-col justify-center items-center bg-white">
                <Calculator className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-700 text-lg mb-1">Awaiting calculation</h3>
                <p className="text-sm text-gray-400 max-w-[280px]">
                  Fill in utility bill amount, days in month, and roommate guest days on the left to see the breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GuestCalculator;
