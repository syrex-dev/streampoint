export interface QuotaData {
    limit: number;
    used: number;
    remaining: number;
    is_full: boolean;
    resets_at: string;
}

export type ServiceStatus = 'available' | 'low_stock' | 'out_of_stock' | 'rent_full';

export interface ProductCatalogItem {
    id: number;
    slug: string;
    name: string;
    category: string;
    thumbnail_path: string | null;
    logo_url?: string | null;
    cover_url?: string | null;
    brand_color?: string | null;
    description: string | null;
    min_price: number;
    status: ServiceStatus;
    status_label: string;
    available_rent_stock: number;
    available_buy_stock: number;
    has_rent?: boolean;
    has_buy?: boolean;
    has_warranty?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
    sold_count?: number | null;
}

export interface SharedSettings {
    admin_whatsapp: string | null;
    business_hours: string | null;
    store_name?: string | null;
    store_logo_path?: string | null;
    store_tagline?: string | null;
    delivery_eta?: string | null;
    accent_preset?: 'emerald' | 'teal' | 'blue' | 'mono';
    announcement?: { text: string; url?: string | null } | null;
    social_links?: {
        telegram?: string | null;
        instagram?: string | null;
        threads?: string | null;
        tiktok?: string | null;
    } | null;
    custom_request_enabled?: boolean;
}

export interface SharedPendingOrder {
    invoice_code: string;
    status: string;
    status_label: string;
}

export interface BannerData {
    id: number;
    title: string;
    subtitle?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    image_path?: string | null;
    tone: 'neutral' | 'accent' | 'warning';
}

export type DeliveryType = 'STOCK' | 'INVITE' | 'MANUAL';
export type FulfillmentStatus = 'AWAITING_ACTION' | 'INVITE_SENT' | 'ACTIVE' | 'DELIVERED' | 'DONE' | 'ENDED';

export interface BuyerFieldDefinition {
    key: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'url';
    required: boolean;
    placeholder?: string;
    help_text?: string;
}

export interface ProductVariantData {
    id: number;
    product_id: number;
    name: string;
    type: 'RENT' | 'BUY';
    rent_duration: string | null;
    duration_hours: number;
    price: number;
    is_active: boolean;
    sort_order: number;
    delivery_type?: DeliveryType;
    buyer_fields?: BuyerFieldDefinition[] | null;
    stock_fields?: string[] | null;
    delivery_instructions?: string | null;
    eta_text?: string | null;
    stock_limit?: number | null;
}

export interface ProductDetail {
    id: number;
    slug: string;
    name: string;
    category: string;
    thumbnail_path: string | null;
    cover_path?: string | null;
    brand_color?: string | null;
    has_warranty?: boolean;
    description: string | null;
    rules: string | null;
    available_rent_stock: number;
    available_buy_stock: number;
}

export interface PaymentMethodItem {
    id: number;
    type: 'QRIS' | 'BANK' | 'EWALLET';
    label: string;
    logo_url?: string | null;
    account_number: string | null;
    account_holder: string | null;
    qris_image_path: string | null;
    instructions: string | null;
}

export interface OrderCredentialItem {
    key: string;
    label: string;
    value: string;
    is_secret: boolean;
}

export interface OrderCredentials {
    email?: string;
    password?: string;
    profile?: string;
    pin?: string;
    raw?: string;
    items?: OrderCredentialItem[];
}

export type OrderStatusType = 'PENDING' | 'VERIFYING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export interface OrderInvoiceData {
    invoice_code: string;
    order_type: 'RENT' | 'BUY';
    status: OrderStatusType;
    status_label: string;
    status_note: string | null;
    product: {
        name: string;
        slug: string;
        category: string;
        thumbnail_path: string | null;
    };
    variant: {
        name: string;
        type: 'RENT' | 'BUY';
        duration_hours: number;
    };
    payment_method: PaymentMethodItem;
    base_price: number;
    unique_code: number;
    total_amount: number;
    customer_phone: string;
    customer_note: string | null;
    payment_expires_at: string;
    access_starts_at: string | null;
    access_expires_at: string | null;
    has_payment_proof: boolean;
    credentials: OrderCredentials | null;
    delivery_type?: DeliveryType;
    fulfillment_status?: FulfillmentStatus;
    delivery_instructions?: string | null;
    eta_text?: string | null;
    buyer_inputs?: Record<string, string> | null;
    delivery_message?: string | null;
    fulfilled_at?: string | null;
    created_at: string;
}

export interface TrackingOrderItem {
    invoice_code: string;
    service_name: string;
    package_name: string;
    status: OrderStatusType;
    status_label: string;
    created_at: string;
}

export interface ReviewItem {
    id: number;
    rating: number;
    comment: string | null;
    customer_name: string;
    variant_name?: string | null;
    created_at: string;
    is_verified_buyer: boolean;
}

export interface ReviewBreakdownItem {
    stars: number;
    count: number;
    percentage: number;
}

export interface ProductReviewsData {
    average_rating: number;
    total_reviews: number;
    breakdown: ReviewBreakdownItem[];
    reviews: ReviewItem[];
    user_pending_order_for_review?: {
        invoice_code: string;
        variant_name: string;
    } | null;
}

