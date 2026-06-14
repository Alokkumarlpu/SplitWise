import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, Users, Receipt, Percent } from 'lucide-react';

const DashboardStats = ({ balances = {} }) => {
  const netBal = parseFloat(balances.net_balance || '0.00');
  const owe = parseFloat(balances.total_owe || '0.00');
  const owed = parseFloat(balances.total_owed || '0.00');
  const totalGroups = balances.total_groups || 0;
  const totalExpenses = balances.total_expenses || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Net Balance */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Net Balance</span>
        <span
          className={`text-xl font-extrabold tracking-tight ${
            netBal > 0 ? 'text-emerald-600' : netBal < 0 ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          {netBal > 0 ? `+₹${netBal.toFixed(2)}` : netBal < 0 ? `-₹${Math.abs(netBal).toFixed(2)}` : '₹0.00'}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold mt-1">
          <Wallet className="h-3.5 w-3.5 text-gray-400" />
          <span>Settlement sum</span>
        </div>
      </div>

      {/* You are owed */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24">
        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>You are owed</span>
        </div>
        <span className="text-xl font-extrabold text-emerald-600 tracking-tight">
          ₹{owed.toFixed(2)}
        </span>
        <span className="text-[10px] text-gray-400 font-semibold mt-1 block">To collect</span>
      </div>

      {/* You owe */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24">
        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <ArrowDownLeft className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <span>You owe</span>
        </div>
        <span className="text-xl font-extrabold text-orange-500 tracking-tight">
          ₹{owe.toFixed(2)}
        </span>
        <span className="text-[10px] text-gray-400 font-semibold mt-1 block">To pay back</span>
      </div>

      {/* Total Groups */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24 col-span-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Groups</span>
        <span className="text-xl font-extrabold text-gray-900 tracking-tight">{totalGroups}</span>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold mt-1">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          <span>Active sharing groups</span>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24 col-span-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Expenses</span>
        <span className="text-xl font-extrabold text-gray-900 tracking-tight">{totalExpenses}</span>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold mt-1">
          <Receipt className="h-3.5 w-3.5 text-gray-400" />
          <span>Total entries</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
