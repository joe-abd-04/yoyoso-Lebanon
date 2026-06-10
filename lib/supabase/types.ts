// TypeScript types mirroring the Supabase database schema.
// These are used by both the browser client and server client for type safety.
// Import individual row types (e.g. Product, Order) or the full Database type
// for use with createClient<Database>().

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Row types (shape of rows returned by SELECT) ────────────────────────────

// NOTE: these are declared as `type` (not `interface`) on purpose. The Supabase
// client's `Database` generic requires each table's Row/Insert/Update to be
// assignable to Record<string, unknown>; a TS `interface` has no implicit index
// signature and would make the typed client resolve every row to `never`.
export type Category = {
  id: string
  slug: string
  name: string
  icon: string
  color: string
  parent_id: string | null
  sort_order: number
  created_at: string
}

export type ProductVariantData = {
  type: string      // 'color' | 'model' | 'size'
  value: string
  colorHex?: string  // only for type === 'color'
  image?: string     // optional per-option image (color/model); one of products.images
}

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  category_id: string
  subcategory: string | null
  price_usd: number
  original_price_usd: number | null
  sku: string | null
  in_stock: boolean
  stock_count: number | null
  is_featured: boolean
  is_best_seller: boolean
  badge: 'NEW' | 'SALE' | 'HOT' | null
  hide_new_badge: boolean
  images: string[]
  thumbnail: string
  variants: ProductVariantData[] | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  product_id: string
  slug: string
  name: string
  thumbnail: string
  price_usd: number
  quantity: number
  variant?: string  // chosen config label, e.g. 'Red / Model 2 / L'
  sku?: string      // product SKU snapshot at order time (may be absent on legacy orders)
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type Order = {
  id: string
  order_number: string        // e.g. YYS-100234
  user_id: string | null      // auth.users id when placed while logged in; null for guests
  customer_name: string
  customer_email: string
  customer_phone: string
  address_line1: string
  address_line2: string | null
  city: string
  region: string
  delivery_notes: string | null
  items: OrderItem[]
  subtotal_usd: number
  delivery_fee_usd: number
  discount_usd: number
  total_usd: number
  payment_method: string      // 'cash_on_delivery' | 'bank_transfer' | 'whatsapp'
  status: OrderStatus
  created_at: string
}

export type ContactMessage = {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export type NewsletterSubscriber = {
  id: string
  email: string
  created_at: string
}

export type Setting = {
  key: string
  value: Json
  updated_at: string
}

export type Store = {
  id: string
  name: string
  region: string
  address: string
  phone: string | null
  hours: string
  maps_url: string
  sort_order: number
}

export type Profile = {
  id: string                 // matches auth.users.id (shared primary key)
  email: string | null
  full_name: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

// ─── Insert types (what you pass to .insert()) ───────────────────────────────

export type CategoryInsert = Omit<Category, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'hide_new_badge'> & {
  id?: string
  created_at?: string
  updated_at?: string
  hide_new_badge?: boolean
}

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'user_id'> & {
  id?: string
  created_at?: string
  user_id?: string | null
}

export type ContactMessageInsert = Omit<ContactMessage, 'id' | 'is_read' | 'created_at'> & {
  id?: string
  is_read?: boolean
  created_at?: string
}

export type NewsletterSubscriberInsert = Pick<NewsletterSubscriber, 'email'>

export type SettingInsert = Setting

export type StoreInsert = Omit<Store, 'id'> & { id?: string }

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string
  updated_at?: string
}

// ─── Update types (what you pass to .update()) ───────────────────────────────

export type CategoryUpdate = Partial<CategoryInsert>
export type ProductUpdate = Partial<ProductInsert>
export type OrderUpdate = Partial<OrderInsert>
export type ContactMessageUpdate = Partial<Pick<ContactMessage, 'is_read'>>
export type SettingUpdate = Partial<Pick<Setting, 'value' | 'updated_at'>>
export type StoreUpdate = Partial<StoreInsert>
export type ProfileUpdate = Partial<ProfileInsert>

// ─── Full Database type for createClient<Database>() ─────────────────────────

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: CategoryInsert
        Update: CategoryUpdate
        Relationships: []
      }
      products: {
        Row: Product
        Insert: ProductInsert
        Update: ProductUpdate
        Relationships: []
      }
      orders: {
        Row: Order
        Insert: OrderInsert
        Update: OrderUpdate
        Relationships: []
      }
      contact_messages: {
        Row: ContactMessage
        Insert: ContactMessageInsert
        Update: ContactMessageUpdate
        Relationships: []
      }
      newsletter_subscribers: {
        Row: NewsletterSubscriber
        Insert: NewsletterSubscriberInsert
        Update: Partial<NewsletterSubscriberInsert>
        Relationships: []
      }
      settings: {
        Row: Setting
        Insert: SettingInsert
        Update: SettingUpdate
        Relationships: []
      }
      stores: {
        Row: Store
        Insert: StoreInsert
        Update: StoreUpdate
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      // SECURITY DEFINER helper — caller's is_admin flag (Phase 9.5).
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      // Rate limiting + lockout (Phase 9.8B, migration 006).
      rate_limit_check: {
        Args: { p_bucket: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      record_auth_failure: {
        Args: { p_identifier: string }
        Returns: undefined
      }
      clear_auth_failures: {
        Args: { p_identifier: string }
        Returns: undefined
      }
      check_auth_lockout: {
        Args: {
          p_identifier: string
          p_threshold: number
          p_window_seconds: number
        }
        Returns: { locked: boolean; retry_after_seconds: number }
      }
      purge_rate_limit_data: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
