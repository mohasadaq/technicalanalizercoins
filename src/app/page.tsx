import { DashboardClient } from '@/components/dashboard-client';
import { getCoins } from '@/lib/data';

export default async function Home() {
  const coins = await getCoins();
  return <DashboardClient coins={coins} />;
}
