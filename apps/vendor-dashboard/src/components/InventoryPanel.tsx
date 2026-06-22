import { useState } from 'react';
import type { Product } from '@bloomdidi/shared';
import { api, formatPrice } from '../lib/api';
import { resolveImageUrl } from '../lib/demo-images';

interface InventoryPanelProps {
  products: Product[];
  onRefresh: () => Promise<void>;
}

export function InventoryPanel({ products, onRefresh }: InventoryPanelProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [stock, setStock] = useState(0);

  const startEdit = (product: Product) => {
    setEditing(product.id);
    setStock(product.stockQty);
  };

  const saveStock = async (productId: string) => {
    await api.fetch(`/catalog/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stockQty: stock }),
    });
    setEditing(null);
    await onRefresh();
  };

  const toggleAvailability = async (product: Product) => {
    await api.fetch(`/catalog/products/${product.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable: !product.isAvailable }),
    });
    await onRefresh();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-4">Update stock counts in real time. Low stock shows on customer app.</p>
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200"
        >
          {product.imageUrl && (
            <img
              src={resolveImageUrl(product.imageUrl) ?? undefined}
              alt=""
              className="w-14 h-14 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-brand-900 truncate">{product.name}</p>
            <p className="text-sm text-slate-500">{formatPrice(product.basePrice)} · {product.category}</p>
          </div>

          {editing === product.id ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-16 px-2 py-1 border rounded-lg text-center"
              />
              <button
                onClick={() => saveStock(product.id)}
                className="text-sm text-brand-600 font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => startEdit(product)}
              className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                product.stockQty <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {product.stockQty} in stock
            </button>
          )}

          <button
            onClick={() => toggleAvailability(product)}
            className={`text-xs px-2 py-1 rounded-full ${
              product.isAvailable ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
            }`}
          >
            {product.isAvailable ? 'Available' : 'Hidden'}
          </button>
        </div>
      ))}

      {products.length === 0 && (
        <p className="text-slate-400 text-center py-8">No products yet.</p>
      )}
    </div>
  );
}
