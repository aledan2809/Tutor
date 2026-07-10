import { getTranslations } from "next-intl/server";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { TelegramConnectCard } from "@/components/notifications/telegram-connect-card";
import { PushSubscribeButton } from "@/components/push-subscribe";
import { PhoneCapture } from "@/components/phone-capture";

/**
 * A parent's OWN notification settings — the channels + priority order in which THEY
 * are reached when their child needs a nudge. (The child's own reminder channels are
 * set from the child's card in the Watcher view.)
 */
export default async function WatcherSettingsPage() {
  const t = await getTranslations("watcher");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">{t("settingsTitle")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("settingsIntro")}</p>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
        <div>
          <h3 className="text-sm font-medium text-white">{t("pushTitle")}</h3>
          <p className="text-xs text-gray-500">{t("pushHint")}</p>
        </div>
        <PushSubscribeButton />
      </div>

      <div className="mb-6">
        <PhoneCapture apiBase="/api/student/phone" label={t("phoneLabel")} hint={t("phoneHint")} />
      </div>

      <TelegramConnectCard />

      <NotificationPreferences />
    </div>
  );
}
