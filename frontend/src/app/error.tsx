'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-6 rounded-3xl bg-orange-50 p-6 shadow-xl shadow-orange-100/50">
        <AlertCircle className="h-16 w-16 text-orange-500" />
      </div>
      <h2 className="mb-4 text-2xl font-black text-gray-800 uppercase tracking-tight">Something went wrong!</h2>
      <p className="mb-10 max-w-md text-sm font-medium text-gray-400 leading-relaxed">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex space-x-4">
        <Button 
          onClick={() => reset()}
          className="px-8 py-3 h-auto text-[10px] uppercase tracking-[0.2em] font-black"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button 
          variant="secondary"
          onClick={() => window.location.href = '/dashboard'}
          className="px-8 py-3 h-auto text-[10px] uppercase tracking-[0.2em] font-black"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
