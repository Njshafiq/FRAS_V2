import React from 'react';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="animate-fadeInFast w-full">
      {children}
    </div>
  );
};
