import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Please try refreshing the page.
        </p>
        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700 font-mono">
            {error.message}
          </p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function logErrorToService(error, errorInfo) {
  // In production, you would send this to your error tracking service
  console.error('Error caught by boundary:', error, errorInfo);
  
  if (import.meta.env.PROD) {
    // Send to error tracking service (e.g., Sentry, LogRocket)
    // errorTrackingService.captureException(error, errorInfo);
  }
}

export function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logErrorToService}
      onReset={() => {
        // Reset the state of your app here
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
