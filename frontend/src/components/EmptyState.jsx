import React from 'react';
import { HelpCircle } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = HelpCircle, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="text-center py-10 px-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <Icon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-emerald-600/10 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
