import React from 'react';

export function Loading({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600`}></div>
      {text && (
        <p className="mt-4 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-white rounded-2xl p-10 text-center w-80 h-48 flex flex-col justify-center animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <Loading size="xl" text="Loading dashboard..." />
    </div>
  );
}
