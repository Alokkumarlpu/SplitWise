import React from 'react';

const Card = ({ children, className = '', onClick }) => {
  const isClickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 shadow-sm rounded-2xl p-5 transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
