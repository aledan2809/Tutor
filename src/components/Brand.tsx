// Single source of truth for the brand wordmark: a small "e", "TUTOR" in caps
// for focus, and a small ".ro". Scales with the parent font-size (em units), so
// callers just set the overall size via className (e.g. text-xl).
export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight text-blue-500 ${className}`}>
      <span className="align-top text-[0.55em] font-semibold">e</span>
      TUTOR
      <span className="text-[0.55em] font-semibold text-blue-400">.ro</span>
    </span>
  );
}
