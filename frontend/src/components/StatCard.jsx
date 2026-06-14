import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, icon: Icon, color = 'slate', description }) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 border-emerald-100',
      text: 'text-emerald-600',
    },
    orange: {
      bg: 'bg-orange-50 border-orange-100',
      text: 'text-orange-500',
    },
    blue: {
      bg: 'bg-blue-50 border-blue-100',
      text: 'text-blue-600',
    },
    slate: {
      bg: 'bg-slate-50 border-slate-150',
      text: 'text-slate-700',
    },
    indigo: {
      bg: 'bg-indigo-50 border-indigo-100',
      text: 'text-indigo-600',
    }
  };

  const scheme = colorMap[color] || colorMap.slate;

  return (
    <Card className="flex flex-col justify-between h-28 hover:-translate-y-0.5 transition-all">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-1.5 rounded-xl border shrink-0 ${scheme.bg}`}>
            <Icon className={`h-3.5 w-3.5 ${scheme.text}`} />
          </div>
        )}
      </div>
      <div>
        <span className={`text-xl font-extrabold tracking-tight ${scheme.text} block`}>
          {value}
        </span>
        {description && (
          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 truncate">
            {description}
          </span>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
