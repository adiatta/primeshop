export interface User {
  id:        string;
  name:      string;
  email:     string;
  role:      'USER' | 'ADMIN';
  avatar?:   string;
  phone?:    string;
  createdAt: string;
}

export interface Product {
  id:           string;
  name:         string;
  slug:         string;
  description:  string;
  price:        number;
  comparePrice?: number;
  images:       string[];
  stock:        number;
  sku?:         string;
  cjProductId?: string;
  category:     string;
  tags:         string[];
  featured:     boolean;
  active:       boolean;
  createdAt:    string;
  variants?:    Variant[];
  reviews?:     Review[];
}

export interface Variant {
  id:        string;
  productId: string;
  name:      string;
  value:     string;
  price?:    number;
  stock:     number;
  sku?:      string;
}

export interface CartItem {
  id:       string;
  name:     string;
  price:    number;
  quantity: number;
  image:    string;
  variant?: string;
}

export interface Order {
  id:              string;
  userId:          string;
  status:          OrderStatus;
  total:           number;
  subtotal:        number;
  shipping:        number;
  discount:        number;
  promoCode?:      string;
  trackingNumber?: string;
  createdAt:       string;
  items:           OrderItem[];
  address?:        Address;
  user?:           User;
}

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PROCESSING'
  | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderItem {
  id:        string;
  productId: string;
  quantity:  number;
  price:     number;
  variant?:  string;
  product?:  Pick<Product, 'name' | 'images'>;
}

export interface Review {
  id:        string;
  userId:    string;
  productId: string;
  rating:    number;
  comment:   string;
  verified:  boolean;
  createdAt: string;
  user?:     Pick<User, 'name'>;
}

export interface Address {
  id:         string;
  firstName:  string;
  lastName:   string;
  street:     string;
  city:       string;
  postalCode: string;
  country:    string;
  phone?:     string;
  isDefault:  boolean;
}

export interface PromoCode {
  code:     string;
  discount: number;
  type:     'percentage' | 'fixed';
}

export interface ApiResponse<T> {
  data?:    T;
  error?:   string;
  message?: string;
}