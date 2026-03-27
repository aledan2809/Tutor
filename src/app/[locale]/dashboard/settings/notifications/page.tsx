import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { Link } from "@/i18n/navigation";

export default function NotificationSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/settings"
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          &larr; Settings
        </Link>
      </div>
      <NotificationPreferences />
    </div>
  );
}
