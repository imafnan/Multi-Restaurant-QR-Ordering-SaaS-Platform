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
