export function Footer() {
  return (
    <footer className="border-t border-line mt-20 py-8 bg-ink text-dim text-xs">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="label">Encrypted Anonymity</span>
          <span>·</span>
          <span>Zero PII Linked</span>
          <span>·</span>
          <span>ThinkCentre M710q</span>
        </div>
        <div className="label">SYS_VER 0.1.0 // NO ADVERTISING // NO REAL NAMES</div>
      </div>
    </footer>
  );
}