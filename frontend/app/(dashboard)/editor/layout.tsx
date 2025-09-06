'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EditorNavigation from '@/components/editor/EditorNavigation';
import { Loader2 } from 'lucide-react';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const loading = false; // TODO: Add loading state to useAuth
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'EDITOR' && user.role !== 'ADMIN'))) {
      router.push('/login?redirect=/editor');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || (user.role !== 'EDITOR' && user.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EditorNavigation />
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  );
}