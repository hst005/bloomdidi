import { api } from './api';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface CreateOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  stub?: boolean;
}

export async function startRazorpayCheckout(orderId: string): Promise<{ orderId: string; status: string }> {
  const data = await api.fetch<CreateOrderResponse>('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });

  if (data.stub || !window.Razorpay) {
    return api.fetch<{ orderId: string; status: string }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: data.razorpayOrderId,
        razorpay_payment_id: `pay_stub_${orderId.slice(0, 8)}`,
        razorpay_signature: 'stub',
      }),
    });
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: 'BloomDidi',
      description: 'Flower delivery',
      theme: { color: '#D4537E' },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const result = await api.fetch<{ orderId: string; status: string }>('/payments/verify', {
            method: 'POST',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    rzp.open();
  });
}
