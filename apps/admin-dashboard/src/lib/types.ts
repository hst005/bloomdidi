export interface DashboardStats {
  activeFlorists: number;
  ordersToday: number;
  gmvToday: number;
  commissionEarned: number;
  commissionPct: number;
  pendingVendors: number;
  pendingPayouts: number;
}

export interface PlatformSettings {
  globalDiscoveryRadiusKm: number;
  commissionPct: number;
  deliveryFeePaise: number;
}

export interface VendorRow {
  id: string;
  shopName: string;
  ownerName: string | null;
  phone: string;
  status: string;
  serviceRadiusKm: number;
  orderCount: number;
  totalGmv: number;
  rating: number;
  createdAt: string;
}

export interface VendorDetail extends VendorRow {
  description: string | null;
  isOpen: boolean;
  reviewCount: number;
  owner: { id: string; phone: string; name: string | null; email: string | null };
  products: {
    id: string;
    name: string;
    basePrice: number;
    stockQty: number;
    isAvailable: boolean;
    category: string;
  }[];
  recentOrders: {
    id: string;
    status: string;
    total: number;
    customerName: string | null;
    customerPhone: string;
    createdAt: string;
  }[];
  payouts: {
    id: string;
    grossAmount: number;
    commission: number;
    netAmount: number;
    status: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
  }[];
}

export interface OrderRow {
  id: string;
  status: string;
  total: number;
  shopName: string;
  customerName: string | null;
  customerPhone: string;
  createdAt: string;
}

export interface CustomerRow {
  id: string;
  name: string | null;
  phone: string;
  orderCount: number;
  createdAt: string;
}

export interface PayoutRow {
  id: string;
  shopId: string;
  shopName: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface DisputeRow {
  id: string;
  status: string;
  total: number;
  shopName: string;
  customerName: string | null;
  customerPhone: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface ReportsData {
  gmvByDay: { date: string; gmv: number; orders: number }[];
  topVendors: { shopId: string; shopName: string; gmv: number }[];
}

export type NavId = 'overview' | 'vendors' | 'orders' | 'customers' | 'payouts' | 'disputes' | 'settings';
