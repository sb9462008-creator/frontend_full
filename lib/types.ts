export type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "DISPATCHER" | "DRIVER" | "CUSTOMER";
export type DriverStatus = "AVAILABLE" | "BUSY" | "OFFLINE";
export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "ACCEPTED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "NEAR_DESTINATION"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"
  | "CANCELLED";
export type OrderStatus = "PLACED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

export type Delivery = {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  status: DeliveryStatus;
  scheduledAt?: string | null;
  eta?: string | null;
  assignedAt?: string | null;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
  driverId?: string | null;
  createdAt: string;
  updatedAt: string;
  driver?: Driver | null;
  proof?: ProofOfDelivery | null;
  events?: TrackingEvent[];
  spatial?: DeliverySpatial | null;
};

export type Driver = {
  id: string;
  userId?: string | null;
  name: string;
  phone: string;
  status: DriverStatus;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
  deliveries?: Delivery[];
  locations?: DriverLocation[];
  latestLocation?: DriverLocation | null;
  distanceMeters?: number | null;
};

export type DriverLocation = {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type TrackingEvent = {
  id: string;
  eventType: string;
  status?: DeliveryStatus | null;
  message?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
};

export type ProofOfDelivery = {
  id: string;
  photoUrl?: string | null;
  recipientName?: string | null;
  notes?: string | null;
  otpVerified: boolean;
  createdAt: string;
};

export type DeliverySpatial = {
  distanceToPickupMeters?: number | null;
  distanceToDropoffMeters?: number | null;
};

export type DashboardSummary = {
  totalDeliveriesToday: number;
  activeDeliveries: number;
  deliveredToday: number;
  failedToday: number;
  onTimeRate: number;
  averageDeliveryTimeMinutes: number;
  driverUtilization: number;
};

export type Product = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand?: string | null;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: string;
  product: Product;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmountCents: number;
  shippingAddress: string;
  shippingLat?: number | null;
  shippingLng?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  delivery?: Delivery | null;
};
