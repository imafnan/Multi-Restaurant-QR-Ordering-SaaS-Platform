export interface User {
  id: string;
  name: string;
  mobile: string;
  role: 'super_admin' | 'restaurant_admin';
  restaurant?: string;
  restaurantSlug?: string;
  status: 'active' | 'disabled';
  createdAt?: string;
  updatedAt?: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  mobile: string;
  email?: string;
  location: string;
  subscriptionFee: number;
  registrationFormImage?: string;
  tradeLicenseImage?: string;
  openingDate: string;
  status: 'active' | 'disabled';
  visitorsCount: number;
  paymentStatus: 'pending' | 'completed';
  paymentMethod?: string;
  paymentDate?: string;
  adminMobile?: string;
  hasAlert?: boolean;
  alertMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cost {
  _id: string;
  name: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  _id: string;
  restaurantId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmsLog {
  _id: string;
  mobile: string;
  message: string;
  createdAt: string;
}

export interface GlobalSettings {
  _id?: string;
  globalLogo: string;
}

export interface DashboardStats {
  totalRestaurants: number;
  totalProfit: number;
  totalCost: number;
  netProfit: number;
  totalVisitors: number;
}

export interface Variant {
  name: string;
  price: number;
  discountPrice?: number;
}

export interface Category {
  _id: string;
  restaurantId: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  restaurantId: string;
  categoryId: string | { _id: string; name: string };
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  image?: string;
  images: string[];
  status: 'active' | 'inactive';
  quantity?: number;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  restaurantId: string;
  orderId: string;
  fullName: string;
  phone: string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  grandTotal: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

