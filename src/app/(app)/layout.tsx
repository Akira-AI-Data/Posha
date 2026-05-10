import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { auth } from '@/lib/auth';

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return <AppLayout>{children}</AppLayout>;
}
