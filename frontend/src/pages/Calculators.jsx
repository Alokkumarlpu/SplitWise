import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';
import { Calculator, ArrowRight, Home, Plane, ShieldAlert, Armchair, HelpCircle, History, Clock } from 'lucide-react';

const Calculators = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch calculator history if authenticated
  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const res = await api.get('/api/calculators/');
          setHistory(res.data);
        } catch (err) {
          console.error('Failed to fetch calculation history:', err);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [user]);

  const calculatorsList = [
    {
      id: 'rent',
      title: 'Rent Split Calculator',
      description: 'Split rent based on room size, private bathroom, and balcony weights.',
      path: '/calculators/rent',
      icon: Home,
      iconColor: 'text-blue-600 bg-blue-50',
      active: true,
    },
    {
      id: 'travel',
      title: 'Travel Split Calculator',
      description: 'Quickly divide hotels, transport, and meals equally among travelers.',
      path: '/calculators/travel',
      icon: Plane,
      iconColor: 'text-amber-600 bg-amber-50',
      active: true,
    },
    {
      id: 'insurance',
      title: 'Insurance Share',
      description: 'Split health or car insurance plans by premium weights.',
      icon: ShieldAlert,
      iconColor: 'text-purple-600 bg-purple-50',
      active: false,
    },
    {
      id: 'furniture',
      title: 'Furniture Calculator',
      description: 'Split shared furniture costs by usage or eventual ownership.',
      icon: Armchair,
      iconColor: 'text-indigo-600 bg-indigo-50',
      active: false,
    },
    {
      id: 'guest',
      title: 'Guest Split Calculator',
      description: 'Split utilities when guests visit for part of the month.',
      icon: HelpCircle,
      iconColor: 'text-teal-600 bg-teal-50',
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8 text-emerald-600" />
            <span>Fairness Calculators</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Determine fair splits for shared expenses using weighted dimensions and logic.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculators Cards (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {calculatorsList.map((calc, idx) => {
                const Icon = calc.icon;
                if (calc.active) {
                  return (
                    <Link
                      key={idx}
                      to={calc.path}
                      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition group flex flex-col justify-between"
                    >
                      <div>
                        <div className={`p-3 rounded-xl inline-block ${calc.iconColor} mb-4`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-emerald-600 transition">
                          {calc.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{calc.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-5 text-sm font-semibold text-emerald-600">
                        <span>Open Calculator</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                } else {
                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        <div className={`p-3 rounded-xl inline-block ${calc.iconColor} opacity-60 mb-4`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-400 mb-1.5">{calc.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{calc.description}</p>
                      </div>
                      <div className="mt-5">
                        <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Side panel: Calculation History (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-400" />
                <span>My History</span>
              </h2>

              {!user ? (
                <div className="text-center py-6 px-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500">
                    <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                      Log in
                    </Link>{' '}
                    to save and view your calculation history.
                  </p>
                </div>
              ) : historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No calculations logged yet.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {history.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {log.calculator_type === 'rent' ? '🏠 Rent' : '✈️ Travel'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Rent amount: </span>
                        <span>₹{parseFloat(log.input_data.total_amount).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Roommates: </span>
                        <span>{log.input_data.participants}</span>
                      </div>
                      <div className="text-xs border-t border-gray-50 pt-1.5 mt-0.5 flex flex-wrap gap-1">
                        {log.result_data.splits?.map((splitVal, index) => (
                          <span
                            key={index}
                            className="bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 text-[10px] text-gray-600"
                          >
                            Rm {index + 1}: ₹{parseFloat(splitVal).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calculators;
