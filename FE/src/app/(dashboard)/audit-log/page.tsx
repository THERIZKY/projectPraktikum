import { AuditLogView } from "@/components/views/audit-log-view";

export const metadata = {
  title: "Audit Trail — Practicum Management System",
  description: "Security audit logs of administrative actions, grade changes, and system events",
};

export default function AuditLogPage() {
  return <AuditLogView />;
}
