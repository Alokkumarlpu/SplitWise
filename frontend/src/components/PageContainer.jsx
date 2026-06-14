import React from 'react';

const PageContainer = ({ 
  sidebar, 
  rightWidgets, 
  children, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}) => {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col xl:flex-row gap-6 relative">
      {/* Sidebar drawer overlay on Mobile/Tablet */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 xl:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar column (Drawer on Mobile/Tablet, Static on Desktop) */}
      <div className={`
        fixed top-0 bottom-0 left-0 w-[280px] bg-slate-50 border-r border-slate-200 z-50 p-6 overflow-y-auto transition-transform duration-300 transform xl:static xl:w-70 xl:bg-transparent xl:border-r-0 xl:p-0 xl:z-0 xl:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebar}
      </div>

      {/* Main Content & Right Sidebar wrapper */}
      <div className="flex-grow flex flex-col lg:flex-row gap-6 min-w-0">
        {/* Center column */}
        <div className="flex-grow min-w-0 space-y-6">
          {children}
        </div>

        {/* Right column (Widgets) */}
        {rightWidgets && (
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            {rightWidgets}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageContainer;
