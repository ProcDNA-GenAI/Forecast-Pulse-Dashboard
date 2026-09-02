import { MarketIndicatorsDashboard } from "@/components/indicators/MarketIndicatorsDashboard";
import { loadDashboardData } from "@/utils/dashboard/workbook";

export const dynamic = "force-dynamic";

export default async function KeyMarketIndicatorsPage() {
  const data = await loadDashboardData();
  return <MarketIndicatorsDashboard data={data} />;
}
