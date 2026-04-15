import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { PushSubscribeButton } from "@/components/push-subscribe";
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

      <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
        <div>
          <h3 className="text-sm font-medium text-white">Browser Push Notifications</h3>
          <p className="text-xs text-gray-500">Receive real-time alerts even when the app is closed</p>
        </div>
        <PushSubscribeButton />
      </div>

      <NotificationPreferences />
    </div>
  );
}
