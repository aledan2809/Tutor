import { Link } from "@/i18n/navigation";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-600">404</h1>
        <p className="mt-2 text-lg text-gray-400">This page does not exist.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
