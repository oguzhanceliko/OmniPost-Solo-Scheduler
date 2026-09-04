import { verifyAuth } from '@/lib/auth';
import DashboardClient from '@/components/DashboardClient';
import LoginPage from './login/page';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return <LoginPage />;
  }

  return <DashboardClient />;
}
