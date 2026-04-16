"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface BibItem {
  id: string;
  title: string;
  authors: string;
  publisher: string | null;
  year: number | null;
  edition: string | null;
  city: string | null;
  isbn: string | null;
  url: string | null;
  notes: string | null;
}

interface Domain { slug: string; name: string; }

export default function StudentBibliographyPage() {
  const searchParams = useSearchParams();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domain, setDomain] = useState(searchParams?.get("domain") || "");
  const [items, setItems] = useState<BibItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/domains")
      .then(r => r.json())
      .then(d => {
        if (d.enrolled?.length) {
          setDomains(d.enrolled);
          if (!domain) setDomain(d.enrolled[0].slug);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetch(`/api/${domain}/bibliography`)
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [domain]);

  const formatCitation = (item: BibItem) => {
    const parts: string[] = [];
    parts.push(item.authors);
    parts.push(`<em>${item.title}</em>`);
    if (item.edition) parts.push(item.edition);
    if (item.publisher) parts.push(item.publisher);
    if (item.city) parts.push(item.city);
    if (item.year) parts.push(String(item.year));
    return parts.join(", ");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bibliografie</h1>
          <p className="mt-1 text-sm text-gray-400">Surse bibliografice pentru acest domeniu</p>
        </div>
        {domains.length > 1 && (
          <select value={domain} onChange={e => setDomain(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
            {domains.map(d => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-8 text-center text-gray-500">
          Nu există bibliografie publicată pentru acest domeniu.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, idx) => (
            <li key={item.id} className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-sm font-semibold text-gray-500">{idx + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm text-white" dangerouslySetInnerHTML={{ __html: formatCitation(item) }} />
                  {item.isbn && <p className="mt-1 text-xs text-gray-500">ISBN: {item.isbn}</p>}
                  {item.url && (
                    <p className="mt-1 text-xs">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                        {item.url}
                      </a>
                    </p>
                  )}
                  {item.notes && <p className="mt-1 text-xs text-gray-400 italic">{item.notes}</p>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
