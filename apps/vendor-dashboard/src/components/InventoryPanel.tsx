import { useEffect, useState } from 'react';
import type { Product } from '@bloomdidi/shared';
import { api, formatPrice } from '../lib/api';
import { SmartImage } from './SmartImage';

/** Controlled categories — prevents miscategorisation */
export const PRODUCT_CATEGORIES = [
  'Bouquets',
  'Roses',
  'Lilies',
  'Plants',
  'Gifting',
  'Mixed',
] as const;

interface InventoryPanelProps {
  shopId: string;
  products: Product[];
  loading?: boolean;
  onRefresh: () => Promise<void>;
}

type FormState = {
  name: string;
  category: string;
  basePriceRupees: string;
  stockQty: string;
  imageUrl: string;
};

const emptyForm = (): FormState => ({
  name: '',
  category: PRODUCT_CATEGORIES[0],
  basePriceRupees: '',
  stockQty: '10',
  imageUrl: '',
});

function stockLabel(qty: number, available: boolean) {
  if (!available) return 'unavailable';
  if (qty <= 0) return 'out of stock';
  return `${qty} in stock`;
}

export function InventoryPanel({ shopId, products, loading = false, onRefresh }: InventoryPanelProps) {
  const [localProducts, setLocalProducts] = useState(products);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setError('');
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const readPhoto = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) reject(new Error('Choose a JPG or PNG image.'));
      else if (file.size > 2 * 1024 * 1024) reject(new Error('Image must be under 2 MB.'));
      else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read image.'));
        reader.readAsDataURL(file);
      }
    });

  const toggleAvailability = async (product: Product) => {
    const next = !product.isAvailable;
    const backup = localProducts;
    setLocalProducts((p) =>
      p.map((x) => (x.id === product.id ? { ...x, isAvailable: next } : x)),
    );
    setError('');
    setBusy(`avail-${product.id}`);
    try {
      await api.fetch(`/catalog/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: next }),
      });
      await onRefresh();
    } catch (e) {
      setLocalProducts(backup);
      setError(e instanceof Error ? e.message : 'Could not update availability');
    } finally {
      setBusy(null);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    const backup = localProducts;
    setLocalProducts((p) => p.filter((x) => x.id !== product.id));
    setError('');
    setBusy(`del-${product.id}`);
    try {
      await api.fetch(`/catalog/products/${product.id}`, { method: 'DELETE' });
      await onRefresh();
    } catch (e) {
      setLocalProducts(backup);
      setError(e instanceof Error ? e.message : 'Could not delete product');
    } finally {
      setBusy(null);
    }
  };

  const startEdit = (product: Product) => {
    setEditId(product.id);
    setEditForm({
      name: product.name,
      category: PRODUCT_CATEGORIES.includes(product.category as (typeof PRODUCT_CATEGORIES)[number])
        ? product.category
        : PRODUCT_CATEGORIES[0],
      basePriceRupees: String(product.basePrice / 100),
      stockQty: String(product.stockQty),
      imageUrl: product.imageUrl ?? '',
    });
    setShowAddForm(false);
  };

  const saveEdit = (productId: string) => {
    const basePrice = Math.round(Number(editForm.basePriceRupees) * 100);
    if (!editForm.name.trim() || !basePrice) {
      setError('Name and price are required.');
      return;
    }
    run(`edit-${productId}`, async () => {
      await api.fetch(`/catalog/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          category: editForm.category,
          basePrice,
          stockQty: Number(editForm.stockQty) || 0,
          ...(editForm.imageUrl ? { imageUrl: editForm.imageUrl } : {}),
        }),
      });
      setEditId(null);
      await onRefresh();
    });
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const basePrice = Math.round(Number(form.basePriceRupees) * 100);
    if (!form.name.trim() || !basePrice) {
      setError('Name and price are required.');
      return;
    }
    run('add', async () => {
      await api.fetch(`/catalog/shops/${shopId}/products`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          basePrice,
          stockQty: Number(form.stockQty) || 0,
          ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
        }),
      });
      setForm(emptyForm());
      setShowAddForm(false);
      await onRefresh();
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--bd-ink)' }}>
          Inventory
        </h2>
        <button
          type="button"
          className="bd-btn bd-btn-primary"
          onClick={() => {
            setShowAddForm((v) => !v);
            setEditId(null);
            setError('');
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add product'}
        </button>
      </div>
      <p style={{ color: 'var(--bd-ink-soft)', marginTop: 4, marginBottom: 20, fontSize: 14 }}>
        Update stock in real time. Low stock shows on the customer app.
      </p>

      {error && <div className="bd-error" style={{ marginBottom: 16 }}>{error}</div>}

      {showAddForm && (
        <form
          onSubmit={addProduct}
          className="bd-card bd-rise bd-card-static"
          style={{ padding: 16, marginBottom: 18, background: 'var(--bd-surface-alt)' }}
        >
          <div style={{ fontWeight: 500, marginBottom: 10 }}>New product</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
            }}
          >
            <div>
              <label className="bd-label">Product name</label>
              <input
                className="bd-input"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="bd-label">Category</label>
              <select
                className="bd-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="bd-label">Price ₹</label>
              <input
                className="bd-input"
                placeholder="Price ₹"
                value={form.basePriceRupees}
                onChange={(e) =>
                  setForm({ ...form, basePriceRupees: e.target.value.replace(/\D/g, '') })
                }
                required
              />
            </div>
            <div>
              <label className="bd-label">Stock qty</label>
              <input
                className="bd-input"
                placeholder="Stock qty"
                value={form.stockQty}
                onChange={(e) =>
                  setForm({ ...form, stockQty: e.target.value.replace(/\D/g, '') })
                }
                required
              />
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--bd-ink-soft)', marginTop: 12, marginBottom: 0 }}>
            Photo guidelines: use a clear bouquet or product shot on a neutral background. Avoid
            event setup photos (chairs, venues, signage).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <label className="bd-btn" style={{ cursor: 'pointer' }}>
              ↑ Upload photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  readPhoto(file)
                    .then((imageUrl) => setForm((f) => ({ ...f, imageUrl })))
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : 'Invalid image'),
                    );
                  e.target.value = '';
                }}
              />
            </label>
            {form.imageUrl && (
              <SmartImage src={form.imageUrl} alt="Preview" style={{ width: 40, height: 40 }} />
            )}
            <button
              type="submit"
              className="bd-btn bd-btn-primary"
              disabled={busy === 'add' || !form.name || !form.basePriceRupees}
            >
              {busy === 'add' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bd-skeleton"
              style={{ height: 68, marginBottom: 8 }}
            />
          ))
        : localProducts.map((product, index) => {
            const available = product.isAvailable;
            const isEditing = editId === product.id;

            if (isEditing) {
              return (
                <form
                  key={product.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit(product.id);
                  }}
                  className="bd-card bd-rise bd-card-static"
                  style={{
                    padding: 16,
                    marginBottom: 8,
                    background: 'var(--bd-rose-soft)',
                    animationDelay: `${index * 40}ms`,
                  }}
                >
                  <p style={{ fontWeight: 500, marginBottom: 10 }}>Edit product</p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 10,
                    }}
                  >
                    <input
                      className="bd-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Name"
                    />
                    <select
                      className="bd-select"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      className="bd-input"
                      value={editForm.basePriceRupees}
                      onChange={(e) =>
                        setEditForm({ ...editForm, basePriceRupees: e.target.value })
                      }
                      placeholder="Price ₹"
                    />
                    <input
                      className="bd-input"
                      value={editForm.stockQty}
                      onChange={(e) => setEditForm({ ...editForm, stockQty: e.target.value })}
                      placeholder="Stock"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      type="submit"
                      className="bd-btn bd-btn-primary"
                      disabled={busy === `edit-${product.id}`}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="bd-btn bd-btn-ghost"
                      onClick={() => setEditId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <ProductRow
                key={product.id}
                product={product}
                index={index}
                available={available}
                busy={busy}
                onToggle={() => toggleAvailability(product)}
                onEdit={() => startEdit(product)}
                onDelete={() => deleteProduct(product)}
              />
            );
          })}

      {!loading && localProducts.length === 0 && !showAddForm && (
        <div className="bd-empty">
          No products yet. Tap <strong>+ Add product</strong> to create your first item.
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  index,
  available,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  product: Product;
  index: number;
  available: boolean;
  busy: string | null;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="bd-card bd-rise"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        marginBottom: 8,
        opacity: available ? 1 : 0.7,
        animationDelay: `${index * 40}ms`,
      }}
    >
      <SmartImage src={product.imageUrl} alt={product.name} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>{product.name}</div>
        <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)' }}>
          {formatPrice(product.basePrice)} · {product.category} ·{' '}
          {stockLabel(product.stockQty, available)}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={busy === `avail-${product.id}`}
        className={`bd-avail-pill ${available ? 'is-on' : 'is-off'}`}
      >
        <span className={`bd-avail-dot ${available ? 'is-on' : 'is-off'}`} />
        {available ? 'Available' : 'Unavailable'}
      </button>

      <button
        type="button"
        className="bd-btn bd-btn-ghost"
        aria-label="Edit"
        onClick={onEdit}
        style={{ padding: '8px 10px' }}
      >
        ✎
      </button>
      <button
        type="button"
        className="bd-btn bd-btn-ghost"
        aria-label="Delete"
        onClick={onDelete}
        disabled={busy === `del-${product.id}`}
        style={{ padding: '8px 10px', color: 'var(--bd-danger)' }}
      >
        🗑
      </button>
    </div>
  );
}
