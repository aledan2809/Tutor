"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StudentDetail } from "@/components/instructor/student-detail";

export default function InstructorStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("instructor");

  return (
    <div>
      <Link
        href="/dashboard/instructor/students"
        className="mb-4 inline-block text-sm text-blue-400 hover:text-blue-300"
      >
        ← {t("backToStudents")}
      </Link>
      <StudentDetail studentId={id} />
    </div>
  );
}
