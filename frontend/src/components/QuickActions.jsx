import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, DollarSign, CheckCircle, UserPlus, Calculator } from 'lucide-react';

const QuickActions = ({ onAddExpense, onSettleUp, onAddGroup, onAddFriend }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
        Quick Actions
      </span>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={onAddExpense}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition cursor-pointer text-left focus:outline-none"
        >
          <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Add an Expense</span>
        </button>

        <button
          onClick={onSettleUp}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition cursor-pointer text-left focus:outline-none"
        >
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Settle Up</span>
        </button>

        <button
          onClick={onAddGroup}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition cursor-pointer text-left focus:outline-none"
        >
          <PlusCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Create a Group</span>
        </button>

        <button
          onClick={onAddFriend}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition cursor-pointer text-left focus:outline-none"
        >
          <UserPlus className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Invite / Add Friend</span>
        </button>

        <Link
          to="/calculators"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition text-left"
        >
          <Calculator className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Fairness Calculators</span>
        </Link>
      </div>
    </div>
  );
};

export default QuickActions;
