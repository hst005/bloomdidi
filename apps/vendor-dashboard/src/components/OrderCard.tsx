import { motion } from 'framer-motion';
import type { Order } from '@bloomdidi/shared';
import { formatPrice } from '../lib/api';

interface OrderCardProps {
  order: Order;
  index: number;
  onStatusUpdate: (orderId: string, status: string) => Promise<void>;
}

const NEXT_ACTION: Partial<Record<string, { label: string; status: string }>> = {
  PLACED: { label: 'Accept', status: 'ACCEPTED' },
  ACCEPTED: { label: 'Start preparing', status: 'PREPARING' },
  PREPARING: { label: 'Mark ready', status: 'READY' },
  READY: { label: 'Hand to rider', status: 'OUT_FOR_DELIVERY' },
  OUT_FOR_DELIVERY: { label: 'Delivered', status: 'DELIVERED' },
};

export function OrderCard({ order, index, onStatusUpdate }: OrderCardProps) {
  const next = NEXT_ACTION[order.status];
  const canCancel = order.status === 'PLACED';

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28, delay: index * 0.03 }}
      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">#{order.id.slice(0, 8)}</span>
            <motion.span
              key={order.status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 capitalize"
            >
              {order.status.toLowerCase().replace(/_/g, ' ')}
            </motion.span>
          </div>
          <p className="font-semibold text-brand-900 mt-2">{formatPrice(order.total)}</p>
          <ul className="mt-2 text-sm text-slate-600">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.qty}× {item.productName}
              </li>
            ))}
          </ul>
          {order.scheduledFor && (
            <p className="text-xs text-amber-600 mt-2">
              Scheduled: {new Date(order.scheduledFor).toLocaleString()}
            </p>
          )}
          {order.cardMessage && (
            <p className="text-xs text-slate-500 mt-1 italic">Card: "{order.cardMessage}"</p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Deliver to: {order.address.recipientName}, {order.address.line1}
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {next && (
            <button
              onClick={() => onStatusUpdate(order.id, next.status)}
              className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors font-medium"
            >
              {next.label}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
              className="px-4 py-2 text-red-600 text-sm rounded-lg border border-red-200 hover:bg-red-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}
