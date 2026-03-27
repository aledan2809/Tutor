import { Link } from "@/i18n/navigation";

export const metadata = {
  title: "Terms of Service - Tutor",
  description: "Terms of Service for Tutor adaptive learning platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-white">Terms of Service</h1>
      <div className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300">
        <p>Last updated: March 2026</p>
        <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Tutor (&quot;the Platform&quot;), you agree to be bound by these
          Terms of Service. If you do not agree, please do not use the Platform.
        </p>
        <h2 className="text-xl font-semibold text-white">2. Use of Service</h2>
        <p>
          Tutor provides AI-driven adaptive learning tools. You must be at least 16 years old
          to create an account. You are responsible for maintaining the security of your account.
        </p>
        <h2 className="text-xl font-semibold text-white">3. Intellectual Property</h2>
        <p>
          All content, features, and functionality of the Platform are owned by Tutor and are
          protected by intellectual property laws.
        </p>
        <h2 className="text-xl font-semibold text-white">4. Limitation of Liability</h2>
        <p>
          The Platform is provided &quot;as is&quot; without warranties of any kind. We are not
          liable for any damages arising from your use of the Platform.
        </p>
        <h2 className="text-xl font-semibold text-white">5. Contact</h2>
        <p>For questions about these terms, contact us at support@knowbest.ro.</p>
      </div>
      <div className="mt-8">
        <Link href="/" className="text-blue-400 hover:text-blue-300 underline text-sm">
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
