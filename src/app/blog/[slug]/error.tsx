'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Blog Post Error:", error);
  }, [error]);

  return (
    <main className="app-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', padding: '3rem', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-cormorant), serif', color: '#ff6b6b', margin: '0 0 1rem' }}>
          Error Rendering Post
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
          We encountered a problem while formatting this blog post. This usually happens when the post contains invalid MDX syntax (like an unclosed HTML tag or unescaped braces).
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{ background: 'var(--primary)', color: '#000', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
          <Link
            href="/blog"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
          >
            Return to Blog
          </Link>
        </div>
      </div>
    </main>
  );
}
