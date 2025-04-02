export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
// ...
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone_number: string | null
          avatar_url: string | null
          preferences: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          phone_number?: string | null
          avatar_url?: string | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone_number?: string | null
          avatar_url?: string | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      rooms: {
        Row: {
          id: string
          room_number: string
          room_type: string
          description: string
          capacity: number
          price_per_night: number
          amenities: Json | null
          images: string[] | null
          is_available: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          room_number: string
          room_type: string
          description: string
          capacity: number
          price_per_night: number
          amenities?: Json | null
          images?: string[] | null
          is_available?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          room_number?: string
          room_type?: string
          description?: string
          capacity?: number
          price_per_night?: number
          amenities?: Json | null
          images?: string[] | null
          is_available?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      room_bookings: {
        Row: {
          id: string
          room_id: string | null
          user_id: string | null
          check_in_date: string
          check_out_date: string
          guest_count: number
          total_price: number
          status: string | null
          special_requests: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          user_id?: string | null
          check_in_date: string
          check_out_date: string
          guest_count: number
          total_price: number
          status?: string | null
          special_requests?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          user_id?: string | null
          check_in_date?: string
          check_out_date?: string
          guest_count?: number
          total_price?: number
          status?: string | null
          special_requests?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}
