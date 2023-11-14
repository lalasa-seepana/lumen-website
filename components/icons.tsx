export function Arrow({ diagonal = false, className = "" }: { diagonal?: boolean; className?: string }) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sun({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, index) => (
        <path key={index} d="M24 3v7" stroke="currentColor" strokeWidth="1" transform={`rotate(${index * 30} 24 24)`} />
      ))}
    </svg>
  );
}
