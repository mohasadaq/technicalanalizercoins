import { DashboardClient } from '@/components/dashboard-client';
import { getCoins } from '@/lib/data';

export default async function Home() {
  const coins = getCoins();
  return <DashboardClient coins={coins} />;
}
