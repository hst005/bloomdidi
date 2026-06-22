/** Centered content column — every customer page sits inside this (max ~1100px). */
export function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`max-w-[1100px] mx-auto px-5 ${className}`}>{children}</div>;
}

/** Responsive florist / product grid: 1 col mobile → 2–3+ on desktop. */
export function FeedGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid gap-4 py-3.5 pb-8"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
    >
      {children}
    </div>
  );
}
