import { ExecutiveDashboard } from "@/components/executive/ExecutiveDashboard";
import { loadDashboardData } from "@/lib/dashboard/workbook";

export const dynamic = "force-dynamic";

export default async function ExecutiveSummaryPage() {
  const data = await loadDashboardData();
  return <ExecutiveDashboard data={data} />;
}
