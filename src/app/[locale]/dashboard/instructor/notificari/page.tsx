import { getTranslations } from "next-intl/server";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { TelegramConnectCard } from "@/components/notifications/telegram-connect-card";
import { PushSubscribeButton } from "@/components/push-subscribe";
import { PhoneCapture } from "@/components/phone-capture";

/**
 * The instructor's OWN notification settings — the channels + priority order in
 * which THEY are reached when a student breaches one of their alert thresholds.
 * (The thresholds themselves are configured under Instructor → Settings.)
 */
export default async function InstructorNotificationsPage() {
  const t = await getTranslations("instructor");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">{t("notifTitle")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("notifIntro")}</p>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
        <div>
          <h3 className="text-sm font-medium text-white">{t("notifPushTitle")}</h3>
          <p className="text-xs text-gray-500">{t("notifPushHint")}</p>
        </div>
        <PushSubscribeButton />
      </div>

      <div className="mb-6">
        <PhoneCapture apiBase="/api/student/phone" label={t("notifPhoneLabel")} hint={t("notifPhoneHint")} />
      </div>

      <TelegramConnectCard />

      <NotificationPreferences />
    </div>
  );
}
