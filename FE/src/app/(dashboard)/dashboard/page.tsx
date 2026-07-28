import { DashboardView } from "@/components/views/dashboard-view";

export const metadata = {
  title: "Dashboard — Practicum Management System",
  description: "Role-specific statistics, assigned classes, enrolled courses, and upcoming assignment deadlines",
};

export default function DashboardPage() {
  return <DashboardView />;
}
