import { NotificationsView } from "@/components/views/notifications-view";

export const metadata = {
  title: "Notifications — Practicum Management System",
  description: "View in-app alerts for grade releases, assignment deadlines, and system updates",
};

export default function NotificationsPage() {
  return <NotificationsView />;
}
