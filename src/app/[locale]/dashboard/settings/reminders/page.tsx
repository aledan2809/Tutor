import { ReminderManager } from "@/components/reminder-manager";
import { Link } from "@/i18n/navigation";

export default function RemindersSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/settings" className="text-sm text-gray-500 hover:text-gray-300">
          &larr; Setări
        </Link>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-white">Programul de studiu</h1>
      <p className="mb-6 text-sm text-gray-400">
        Setează zilele și ora la care primești mementouri (ex. 13:15 în loc de 8:00).
      </p>
      <ReminderManager />
    </div>
  );
}
