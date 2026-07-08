'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

const ADMIN_EMAILS = ['adarsh6455@gmail.com', 'akroy6455@gmail.com'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.push('/');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isAuthorized === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Authenticating...</div>;
  }

  if (isAuthorized === false) {
    return null;
  }

  return <>{children}</>;
}
