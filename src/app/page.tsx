import { redirect } from 'next/navigation';
import { verifyAuth } from '@/lib/auth';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    redirect('/login');
  }

  return <DashboardClient />;
}
