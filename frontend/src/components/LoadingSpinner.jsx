/**
 * components/LoadingSpinner.jsx
 */

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={`animate-spin rounded-full border-indigo-600 border-t-transparent ${sizes[size]} ${className}`} />
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Default export for simpler imports
export default LoadingSpinner;
