"use client";

import { useState, useEffect, useRef } from "react";

interface Domain {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface DomainSwitcherProps {
  activeDomainId: string | null;
  onSwitch: (domainId: string) => void;
}

export function DomainSwitcher({ activeDomainId, onSwitch }: DomainSwitcherProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/student/domains")
      .then((r) => r.json())
      .then((d) => {
        if (d.enrolled) setDomains(d.enrolled);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const active = domains.find((d) => d.id === activeDomainId) || domains[0];

  if (domains.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white transition-colors hover:border-gray-600"
      >
        {active?.icon && <span>{active.icon}</span>}
        <span>{active?.name || "Select domain"}</span>
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                onSwitch(d.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-700 ${
                d.id === activeDomainId ? "bg-blue-600/10 text-blue-400" : "text-gray-300"
              }`}
            >
              {d.icon && <span>{d.icon}</span>}
              <span>{d.name}</span>
              {d.id === activeDomainId && (
                <svg className="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
