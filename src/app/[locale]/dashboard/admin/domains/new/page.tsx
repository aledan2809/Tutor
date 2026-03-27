import { DomainForm } from "@/components/admin/domain-form";

export default function NewDomainPage() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Create Domain</h2>
      <DomainForm />
    </div>
  );
}
