'use client'; // Error components must be Client Components
 
import { useEffect } from 'react';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Next.js Error Boundary Caught:", error);
  }, [error]);
 
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '100%', overflowX: 'auto', color: 'red' }}>
      <h2>Something went wrong in the UI!</h2>
      <p style={{ fontWeight: 'bold' }}>{error.name}: {error.message}</p>
      <pre style={{ background: '#111', color: '#0f0', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
        {error.stack}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
