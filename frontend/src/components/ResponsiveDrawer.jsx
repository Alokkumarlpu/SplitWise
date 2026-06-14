import React from 'react';
import { X } from 'lucide-react';

const ResponsiveDrawer = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer / Modal Container */}
      <div className="relative w-full sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-t-2xl sm:rounded-2xl p-6 flex flex-col max-h-[85vh] sm:max-h-[90vh] z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Top Handle for Touch Drag */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-base text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content scroll area */}
        <div className="flex-grow overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDrawer;
