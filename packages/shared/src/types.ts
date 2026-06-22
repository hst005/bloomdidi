import type { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from './constants';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  location: GeoPoint;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  deliveryRadiusKm: number;
  imageUrl: string | null;
  distanceKm?: number;
}

export interface Customization {
  id: string;
  productId: string;
  type: string;
  name: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  basePrice: number;
  category: string;
  stockQty: number;
  isAvailable: boolean;
  imageUrl: string | null;
  customizations?: Customization[];
}

export interface CartItemCustomization {
  customizationId: string;
  name: string;
  priceDelta: number;
}

export interface CartItem {
  productId: string;
  qty: number;
  customizations: CartItemCustomization[];
}

export interface Address {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  location: GeoPoint | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  customizations: CartItemCustomization[];
  lineTotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  shopId: string;
  shopName?: string;
  status: OrderStatus;
  scheduledFor: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  cardMessage: string | null;
  items: OrderItem[];
  address: Address;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  razorpayOrderId: string | null;
  payoutStatus: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
