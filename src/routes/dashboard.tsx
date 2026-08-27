import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { CalculatorDashboard } from "./index";
export const Route = createFileRoute("/dashboard")({ component: DashboardPage });
function DashboardPage() {
  return (
    <AppShell>
      <CalculatorDashboard />
    </AppShell>
  );
}
