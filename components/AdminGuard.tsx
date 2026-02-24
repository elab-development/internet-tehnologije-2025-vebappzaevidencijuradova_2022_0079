'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from './Loading';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'admin' | 'unauthorized'>('loading');

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/');
        } else if (data.user.role !== 'ADMIN') {
          setStatus('unauthorized');
        } else {
          setStatus('admin');
        }
      });
  }, []);

  if (status === 'loading') return <Loading />;

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-12 text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Niste admin</h1>
          <p className="text-gray-600 mb-6">
            Nemate ovlašćenje za pristup ovoj stranici.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Nazad na Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
