type Portal = 'customer' | 'vendor' | 'admin';

const SUB: Record<Portal, string | null> = {
  customer: null,
  vendor: 'Vendor',
  admin: 'Admin',
};

export function BrandMark({
  portal = 'customer',
  size = 'md',
}: {
  portal?: Portal;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sub = SUB[portal];
  const scale = size === 'sm' ? 16 : size === 'lg' ? 26 : 20;

  return (
    <span className="bd-brand" style={{ fontSize: scale }} aria-label="BloomDidi">
      <span className="bd-brand-mark" aria-hidden />
      <span className="bd-brand-text">
        Bloom<span className="bd-brand-accent">Didi</span>
        {sub && <span className="bd-brand-sub">{sub}</span>}
      </span>
    </span>
  );
}
