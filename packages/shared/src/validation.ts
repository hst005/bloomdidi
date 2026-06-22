import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number');

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN']).optional(),
});

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const discoverShopsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.5).max(50).default(5),
  occasion: z.string().optional(),
  deliversToday: z.coerce.boolean().optional(),
});

export const cartItemCustomizationSchema = z.object({
  customizationId: z.string().uuid(),
  name: z.string(),
  priceDelta: z.number(),
});

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(1).max(99),
  customizations: z.array(cartItemCustomizationSchema).default([]),
});

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  recipientName: z.string().min(1).max(100),
  phone: phoneSchema,
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const placeOrderSchema = z.object({
  shopId: z.string().uuid(),
  items: z.array(cartItemSchema).min(1),
  addressId: z.string().uuid(),
  scheduledFor: z.string().datetime().optional(),
  cardMessage: z.string().max(500).optional(),
  paymentMethod: z.enum(['UPI', 'CARD', 'WALLET', 'COD']).default('UPI'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'ACCEPTED',
    'PREPARING',
    'READY',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  basePrice: z.number().positive(),
  category: z.string().min(1).max(100),
  stockQty: z.number().int().min(0),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type DiscoverShopsInput = z.infer<typeof discoverShopsSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
