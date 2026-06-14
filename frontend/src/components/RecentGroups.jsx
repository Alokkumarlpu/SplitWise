import React from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import { Users, ArrowRight } from 'lucide-react';

const RecentGroups = ({ groups = [] }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const getUserGroupBalance = (group) => {
    if (!group.net_balances || !currentUser.id) return 0;
    const userBalanceStr = group.net_balances[String(currentUser.id)];
    return parseFloat(userBalanceStr || '0.00');
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
        Recent Groups
      </span>

      {groups.length === 0 ? (
        <div className="py-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-semibold">No active groups yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {groups.slice(0, 3).map((g) => {
            const balance = getUserGroupBalance(g);
            return (
              <li key={g.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  to={`/groups/${g.id}`}
                  className="flex justify-between items-center group/grp hover:text-emerald-600 transition"
                >
                  <div className="min-w-0 pr-4">
                    <span className="text-xs font-bold text-slate-800 block truncate group-hover/grp:text-emerald-600">
                      {g.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                      {g.members?.length || 0} sharing members
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {balance !== 0 ? (
                      <span
                        className={`text-xs font-bold ${
                          balance > 0 ? 'text-emerald-600' : 'text-orange-500'
                        }`}
                      >
                        {balance > 0 ? `+₹${balance.toFixed(0)}` : `-₹${Math.abs(balance).toFixed(0)}`}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded-md">
                        Settled
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover/grp:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default RecentGroups;
