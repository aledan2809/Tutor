"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getFamilyPlan,
  canAddParent,
  canAddChild,
  canAddTutor,
  INVITE_TARGET_ROLE,
  INVITE_CHANNEL,
  type FamilyPlanKey,
  type InviteTargetRole,
  type InviteChannel,
  type SeatCheck,
} from "@/lib/family";
import { ChildToneControl } from "@/components/gamification/child-tone-control";
import { ChildNotifControl } from "@/components/gamification/child-notif-control";

interface Member {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  status: string;
}
interface Overview {
  planKey: FamilyPlanKey | null;
  planLabel: string | null;
  isSuperAdmin: boolean;
  paidExtraChildSeats: number;
  children: Member[];
  coParents: Member[];
  tutors: Member[];
  seats: {
    parents: { used: number; max: number };
    children: { used: number; max: number };
    tutors: { used: number; max: number };
  };
  pendingInvites: {
    id: string;
    targetRole: string;
    channel: string;
    email: string | null;
    phone: string | null;
    code: string | null;
    expiresAt: string;
    createdAt: string;
  }[];
}

const ROLE_RO: Record<string, string> = {
  CHILD: "copil",
  PARENT: "părinte",
  TUTOR: "meditator",
};

export default function FamilyPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<InviteTargetRole | null>(null);
  const [addonBusy, setAddonBusy] = useState(false);
  const [addonError, setAddonError] = useState<string | null>(null);

  const buyChildAddon = useCallback(async () => {
    setAddonBusy(true);
    setAddonError(null);
    try {
      const r = await fetch("/api/dashboard/family/addon-checkout", { method: "POST" });
      const d = await r.json();
      if (r.ok && d.url) {
        window.location.href = d.url;
        return;
      }
      setAddonError(d.error || "Nu am putut porni plata. Încearcă din nou.");
    } catch {
      setAddonError("Nu am putut porni plata. Încearcă din nou.");
    } finally {
      setAddonBusy(false);
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/dashboard/family")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-gray-500">Se încarcă…</p>;
  if (!data)
    return <p className="text-gray-500">Nu am putut încărca familia.</p>;

  const plan = data.planKey ? getFamilyPlan(data.planKey) : null;
  const admin = data.isSuperAdmin;

  // Pure seat checks (admin bypasses everything). Paid add-on seats extend the base
  // child entitlement, so a child linked into an already-paid seat is a free invite.
  const effectiveChildPlan = plan
    ? { ...plan, maxChildren: plan.maxChildren + data.paidExtraChildSeats }
    : plan;
  const childCheck: SeatCheck = admin
    ? { allowed: true }
    : canAddChild(effectiveChildPlan, data.children.length);
  const parentCheck: SeatCheck = admin
    ? { allowed: true }
    : canAddParent(plan, data.seats.parents.used);
  const tutorCheck: SeatCheck = admin
    ? { allowed: true }
    : canAddTutor(plan, data.tutors.length);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Familia mea</h1>
      <p className="mb-6 text-sm text-gray-400">
        Adaugă copilul, al doilea părinte sau meditatorul. Fiecare are cont
        propriu și vede doar ce i se cuvine.
      </p>

      {/* Plan + seats */}
      <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-gray-300">
            Pachet:{" "}
            <strong className="text-white">
              {admin ? "Administrator" : data.planLabel ?? "Fără pachet de familie"}
            </strong>
          </span>
          <Seat label="Părinți" used={data.seats.parents.used} max={data.seats.parents.max} admin={admin} />
          <Seat label="Copii" used={data.seats.children.used} max={data.seats.children.max} admin={admin} />
          <Seat label="Meditatori" used={data.seats.tutors.used} max={data.seats.tutors.max} admin={admin} />
        </div>
        {!plan && !admin && (
          <p className="mt-3 text-sm text-amber-400">
            Nu ai un pachet de familie activ.{" "}
            <Link href="/parinte" className="underline">
              Vezi pachetele
            </Link>{" "}
            ca să adaugi membri.
          </p>
        )}
      </div>

      {/* Add buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <AddButton
          label="Adaugă copil"
          check={childCheck}
          onClick={() => setAdding(INVITE_TARGET_ROLE.CHILD)}
          onAddon={buyChildAddon}
          addonBusy={addonBusy}
        />
        <AddButton
          label="Adaugă al 2-lea părinte"
          check={parentCheck}
          onClick={() => setAdding(INVITE_TARGET_ROLE.PARENT)}
        />
        <AddButton
          label="Adaugă meditator"
          check={tutorCheck}
          onClick={() => setAdding(INVITE_TARGET_ROLE.TUTOR)}
        />
      </div>
      {addonError && (
        <p className="-mt-6 mb-8 text-sm text-red-400">{addonError}</p>
      )}

      {adding && (
        <AddMember
          target={adding}
          onClose={() => setAdding(null)}
          onDone={() => {
            setAdding(null);
            load();
          }}
        />
      )}

      <MemberSection title="Copii" members={data.children} onRemove={load} showToneControl />
      <MemberSection title="Părinți" members={data.coParents} onRemove={load} />
      <MemberSection title="Meditatori" members={data.tutors} onRemove={load} />

      <PendingInvites invites={data.pendingInvites} onChange={load} />
    </div>
  );
}

function Seat({
  label,
  used,
  max,
  admin,
}: {
  label: string;
  used: number;
  max: number;
  admin: boolean;
}) {
  return (
    <span className="text-sm text-gray-400">
      {label}:{" "}
      <strong className="text-white">
        {used}
        {admin ? "" : `/${max}`}
      </strong>
    </span>
  );
}

function AddButton({
  label,
  check,
  onClick,
  onAddon,
  addonBusy = false,
}: {
  label: string;
  check: SeatCheck;
  onClick: () => void;
  /** Extra-child add-on path: buy a seat first, then link the child. */
  onAddon?: () => void;
  addonBusy?: boolean;
}) {
  // Over the base seat, an extra child is a paid add-on (checkout, not the free
  // invite modal); an extra parent/tutor is a plan upgrade (link to packages).
  const isAddon = !check.allowed && !!check.addon && !!onAddon;
  const upgradeTo = !check.allowed && !check.addon ? check.upgradeTo : undefined;
  const blocked = !check.allowed && !isAddon && !upgradeTo;

  const btnClass =
    "rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-500";

  return (
    <div className="flex flex-col">
      {isAddon ? (
        <button onClick={onAddon} disabled={addonBusy} className={`${btnClass} disabled:opacity-60`}>
          {addonBusy ? "Se pregătește plata…" : label}
        </button>
      ) : upgradeTo ? (
        <Link href={`/dashboard/packages?plan=${upgradeTo}`} className={`${btnClass} inline-block`}>
          {label}
        </Link>
      ) : (
        <button
          onClick={onClick}
          disabled={blocked}
          className={
            blocked
              ? "cursor-not-allowed rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-500"
              : btnClass
          }
        >
          {label}
        </button>
      )}
      {!check.allowed && check.message && (
        <span className="mt-1 max-w-xs text-xs text-amber-400">{check.message}</span>
      )}
    </div>
  );
}

function MemberSection({
  title,
  members,
  onRemove,
  showToneControl = false,
}: {
  title: string;
  members: Member[];
  onRemove: () => void;
  showToneControl?: boolean;
}) {
  if (members.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.userId}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">{m.name ?? "(fără nume)"}</p>
                {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
              </div>
              <RemoveButton memberId={m.userId} onDone={onRemove} />
            </div>
            {showToneControl && <ChildToneControl childId={m.userId} />}
            {showToneControl && <ChildNotifControl childId={m.userId} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function RemoveButton({
  memberId,
  onDone,
}: {
  memberId: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm("Scoți acest membru din familie?")) return;
        setBusy(true);
        const r = await fetch(`/api/dashboard/family/member/${memberId}`, {
          method: "DELETE",
        });
        setBusy(false);
        if (r.ok) onDone();
        else alert("Nu am putut scoate membrul.");
      }}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      Scoate
    </button>
  );
}

function AddMember({
  target,
  onClose,
  onDone,
}: {
  target: InviteTargetRole;
  onClose: () => void;
  onDone: () => void;
}) {
  const canDirect = target === INVITE_TARGET_ROLE.CHILD;
  const [method, setMethod] = useState<"invite" | "direct">("invite");
  const roleRo = ROLE_RO[target] ?? "membru";

  return (
    <div className="mb-8 rounded-lg border border-blue-700 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-white">Adaugă {roleRo}</h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-white">
          Închide
        </button>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        <button
          onClick={() => setMethod("invite")}
          className={`rounded px-3 py-1 ${
            method === "invite" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          Invitație
        </button>
        {canDirect && (
          <button
            onClick={() => setMethod("direct")}
            className={`rounded px-3 py-1 ${
              method === "direct" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            Creează contul direct
          </button>
        )}
      </div>

      {method === "invite" ? (
        <InviteForm target={target} onDone={onDone} />
      ) : (
        <DirectChildForm onDone={onDone} />
      )}
    </div>
  );
}

function InviteForm({
  target,
  onDone,
}: {
  target: InviteTargetRole;
  onDone: () => void;
}) {
  const [channel, setChannel] = useState<InviteChannel>(INVITE_CHANNEL.EMAIL);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    acceptUrl?: string;
    code?: string | null;
    delivery?: { delivered: boolean; reason?: string };
    error?: string;
  } | null>(null);

  const submit = async () => {
    setBusy(true);
    setResult(null);
    const r = await fetch("/api/dashboard/family/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target,
        channel,
        email: channel === INVITE_CHANNEL.EMAIL ? email : undefined,
        phone: channel === INVITE_CHANNEL.WHATSAPP ? phone : undefined,
      }),
    });
    const d = await r.json();
    setBusy(false);
    if (r.ok) {
      setResult(d);
      onDone(); // refresh list (pending invite appears) but keep result visible
    } else {
      setResult({ error: d.seat?.message ?? d.error ?? "Eroare" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          [INVITE_CHANNEL.EMAIL, "Email"],
          [INVITE_CHANNEL.WHATSAPP, "WhatsApp"],
          [INVITE_CHANNEL.CODE, "Cod de familie"],
        ].map(([c, lbl]) => (
          <button
            key={c}
            onClick={() => setChannel(c as InviteChannel)}
            className={`rounded px-3 py-1 ${
              channel === c ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {channel === INVITE_CHANNEL.EMAIL && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplu.ro"
          className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
        />
      )}
      {channel === INVITE_CHANNEL.WHATSAPP && (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+407…"
          className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
        />
      )}
      {channel === INVITE_CHANNEL.CODE && (
        <p className="text-xs text-gray-400">
          Generăm un cod scurt pe care îl dai persoanei. Îl introduce la{" "}
          <strong>/family/join</strong> ca să se lege de familie.
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {busy ? "Se trimite…" : "Trimite invitația"}
      </button>

      {result?.error && <p className="text-sm text-amber-400">{result.error}</p>}
      {result && !result.error && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm">
          {result.delivery?.delivered ? (
            <p className="text-green-400">Invitație trimisă.</p>
          ) : (
            <p className="text-gray-300">
              Trimite tu linkul de mai jos persoanei (canalul direct nu a putut
              livra automat).
            </p>
          )}
          {result.code && (
            <p className="mt-2 text-white">
              Cod de familie: <strong className="font-mono">{result.code}</strong>
            </p>
          )}
          {result.acceptUrl && (
            <p className="mt-2 break-all text-blue-300">{result.acceptUrl}</p>
          )}
        </div>
      )}
    </div>
  );
}

function DirectChildForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/dashboard/family/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const d = await r.json();
    setBusy(false);
    if (r.ok) onDone();
    else setError(d.seat?.message ?? d.error ?? "Eroare");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Creezi tu contul copilului. Îi dai apoi emailul și parola ca să se poată
        loga.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Numele copilului"
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@exemplu.ro"
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Parolă (min. 8 caractere)"
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500"
      />
      <button
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {busy ? "Se creează…" : "Creează contul copilului"}
      </button>
      {error && <p className="text-sm text-amber-400">{error}</p>}
    </div>
  );
}

function PendingInvites({
  invites,
  onChange,
}: {
  invites: Overview["pendingInvites"];
  onChange: () => void;
}) {
  if (invites.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-lg font-semibold text-white">Invitații în așteptare</h2>
      <div className="space-y-2">
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm"
          >
            <div>
              <p className="text-white">
                {ROLE_RO[inv.targetRole] ?? inv.targetRole} ·{" "}
                <span className="text-gray-400">{inv.email ?? inv.phone ?? inv.channel}</span>
              </p>
              {inv.code && (
                <p className="text-gray-400">
                  Cod: <span className="font-mono text-white">{inv.code}</span>
                </p>
              )}
            </div>
            <button
              onClick={async () => {
                const r = await fetch(`/api/dashboard/family/invite/${inv.id}`, {
                  method: "DELETE",
                });
                if (r.ok) onChange();
              }}
              className="text-red-400 hover:text-red-300"
            >
              Anulează
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
