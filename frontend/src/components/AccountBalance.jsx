import React from 'react';
import Card from './Card';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

const AccountBalance = ({ balances = {} }) => {
  const netBal = parseFloat(balances.net_balance || '0.00');
  const owe = parseFloat(balances.total_owe || '0.00');
  const owed = parseFloat(balances.total_owed || '0.00');

  // Calculate owed vs owe ratio for progress bar
  const total = owe + owed;
  const percentage = total > 0 ? (owed / total) * 100 : 50;

  return (
    <Card className="hover:shadow-md transition-all">
      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
        Account Balance
      </span>

      <div className="space-y-4">
        {/* Row 1: You owe */}
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-red-50 border border-red-100 rounded-lg text-red-500">
              <ArrowDownLeft className="h-3.5 w-3.5" />
            </div>
            <span>You owe</span>
          </div>
          <span className="text-red-500 font-extrabold text-sm">₹{owe.toFixed(2)}</span>
        </div>

        {/* Row 2: You are owed */}
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
            <span>You are owed</span>
          </div>
          <span className="text-emerald-600 font-extrabold text-sm">₹{owed.toFixed(2)}</span>
        </div>

        {/* Dynamic Progress Visualization */}
        <div className="space-y-1 pt-1">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {/* Owe section (red) */}
            <div 
              style={{ width: `${100 - percentage}%` }} 
              className="bg-red-400 h-full transition-all duration-300"
            />
            {/* Owed section (emerald) */}
            <div 
              style={{ width: `${percentage}%` }} 
              className="bg-emerald-500 h-full transition-all duration-300"
            />
          </div>
          <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider">
            <span>You Owe</span>
            <span>You Are Owed</span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Row 3: Net status */}
        <div className="flex justify-between items-center text-sm font-bold text-slate-900">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-slate-50 border border-slate-150 rounded-lg text-slate-500">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <span>Net status</span>
          </div>
          <span className={`font-black text-sm ${netBal > 0 ? 'text-emerald-600' : netBal < 0 ? 'text-red-500' : 'text-slate-500'}`}>
            {netBal > 0 ? `+₹${netBal.toFixed(2)}` : netBal < 0 ? `-₹${Math.abs(netBal).toFixed(2)}` : '₹0.00'}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default AccountBalance;
