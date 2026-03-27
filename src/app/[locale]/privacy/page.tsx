import { Link } from "@/i18n/navigation";

export const metadata = {
  title: "Privacy Policy - Tutor",
  description: "Privacy Policy for Tutor adaptive learning platform.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-white">Privacy Policy</h1>
      <div className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300">
        <p>Last updated: March 2026</p>
        <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
        <p>
          We collect information you provide when creating an account (name, email address)
          and usage data related to your learning sessions and progress.
        </p>
        <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
        <p>
          Your data is used to personalize your learning experience, track progress, and
          improve our adaptive algorithms. We do not sell your personal data to third parties.
        </p>
        <h2 className="text-xl font-semibold text-white">3. Data Storage and Security</h2>
        <p>
          Your data is stored securely and encrypted in transit. We use industry-standard
          security measures to protect your information.
        </p>
        <h2 className="text-xl font-semibold text-white">4. Your Rights (GDPR)</h2>
        <p>
          You have the right to access, correct, or delete your personal data. You may also
          request data portability or object to processing. Contact us to exercise these rights.
        </p>
        <h2 className="text-xl font-semibold text-white">5. Cookies</h2>
        <p>
          We use essential cookies for authentication and session management. No tracking
          cookies are used without your consent.
        </p>
        <h2 className="text-xl font-semibold text-white">6. Contact</h2>
        <p>For privacy-related questions, contact us at privacy@knowbest.ro.</p>
      </div>
      <div className="mt-8">
        <Link href="/" className="text-blue-400 hover:text-blue-300 underline text-sm">
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
