import { getTranslations } from "next-intl/server";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { TelegramConnectCard } from "@/components/notifications/telegram-connect-card";
import { PushSubscribeButton } from "@/components/push-subscribe";
import { InstallAppButton } from "@/components/install-app-button";
import { PhoneCapture } from "@/components/phone-capture";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export default async function NotificationSettingsPage() {
  const session = await getSession();
  const tn = await getTranslations("familyNotif");
  let managedByParent = false;
  if (session?.user) {
    const setting = await prisma.setting.findUnique({
      where: { userId_key: { userId: session.user.id, key: "notifDelegation" } },
    });
    managedByParent = (setting?.value as { managedByParent?: boolean } | undefined)?.managedByParent === true;
  }
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

      <InstallAppButton />

      <div className="mb-6">
        <PhoneCapture
          apiBase="/api/student/phone"
          label="Numărul meu de telefon (WhatsApp)"
          hint="Adaugă un număr dacă vrei să primești remindere și pe WhatsApp (Meta)."
        />
      </div>

      <Link
        href="/dashboard/settings/reminders"
        className="mb-6 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 hover:border-gray-700"
      >
        <div>
          <h3 className="text-sm font-medium text-white">Programul de studiu</h3>
          <p className="text-xs text-gray-500">Zilele și ora mementourilor (ex. 13:15)</p>
        </div>
        <span className="text-gray-500">&rarr;</span>
      </Link>

      <TelegramConnectCard />

      {managedByParent ? (
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-4">
          <h3 className="text-sm font-medium text-amber-200">{tn("managedTitle")}</h3>
          <p className="mt-1 text-xs text-amber-300/80">{tn("managedBody")}</p>
        </div>
      ) : (
        <NotificationPreferences />
      )}
    </div>
  );
}
