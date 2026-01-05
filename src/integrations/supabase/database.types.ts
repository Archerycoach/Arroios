/* eslint-disable @typescript-eslint/no-empty-object-type */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      add_ons: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_quantity: number | null
          name: string
          price: number
          property_id: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          name: string
          price: number
          property_id?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          name?: string
          price?: number
          property_id?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "add_ons_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          is_maintenance: boolean | null
          reason: string | null
          room_id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          is_maintenance?: boolean | null
          reason?: string | null
          room_id: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          is_maintenance?: boolean | null
          reason?: string | null
          room_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_add_ons: {
        Row: {
          add_on_id: string
          booking_id: string
          created_at: string | null
          id: string
          quantity: number
          total_price: number
        }
        Insert: {
          add_on_id: string
          booking_id: string
          created_at?: string | null
          id?: string
          quantity?: number
          total_price: number
        }
        Update: {
          add_on_id?: string
          booking_id?: string
          created_at?: string | null
          id?: string
          quantity?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_add_ons_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_add_ons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_number: string
          cancellation_reason: string | null
          cancelled_at: string | null
          check_in_date: string
          check_out_date: string
          cleaning_fee: number | null
          created_at: string | null
          created_by: string | null
          extras_total: number | null
          guest_id: string
          id: string
          num_guests: number
          num_nights: number
          payment_method: string | null
          payment_status: string | null
          room_id: string
          room_price: number
          special_notes: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_number: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_date: string
          check_out_date: string
          cleaning_fee?: number | null
          created_at?: string | null
          created_by?: string | null
          extras_total?: number | null
          guest_id: string
          id?: string
          num_guests?: number
          num_nights: number
          payment_method?: string | null
          payment_status?: string | null
          room_id: string
          room_price: number
          special_notes?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_number?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_date?: string
          check_out_date?: string
          cleaning_fee?: number | null
          created_at?: string | null
          created_by?: string | null
          extras_total?: number | null
          guest_id?: string
          id?: string
          num_guests?: number
          num_nights?: number
          payment_method?: string | null
          payment_status?: string | null
          room_id?: string
          room_price?: number
          special_notes?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string
          created_at: string | null
          guest_id: string
          id: string
          last_message_at: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          guest_id: string
          id?: string
          last_message_at?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          guest_id?: string
          id?: string
          last_message_at?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_pricing: {
        Row: {
          created_at: string | null
          date: string
          id: string
          min_nights: number | null
          price: number
          room_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          min_nights?: number | null
          price: number
          room_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          min_nights?: number | null
          price?: number
          room_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_pricing_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          attachments: Json | null
          category_id: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          invoice_number: string | null
          is_recurring: boolean | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          property_id: string | null
          recurrence_interval: string | null
          room_id: string | null
          supplier: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          attachments?: Json | null
          category_id: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          property_id?: string | null
          recurrence_interval?: string | null
          room_id?: string | null
          supplier?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          attachments?: Json | null
          category_id?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          property_id?: string | null
          recurrence_interval?: string | null
          room_id?: string | null
          supplier?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_revenues: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extra_revenues_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      frontend_texts: {
        Row: {
          category: string | null
          created_at: string | null
          default_value: string
          description: string | null
          id: string
          key: string
          label: string
          page: string
          section: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_value: string
          description?: string | null
          id?: string
          key: string
          label: string
          page: string
          section?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_value?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          page?: string
          section?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          document_number: string | null
          document_type: string | null
          email: string
          full_name: string
          id: string
          nationality: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferences: Json | null
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string | null
          email: string
          full_name: string
          id?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string
          full_name?: string
          id?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          booking_id: string | null
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: Database["public"]["Enums"]["message_type"]
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          booking_id?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          booking_id?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          refunded_amount: number | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          refunded_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          refunded_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          amenities: Json | null
          cancellation_policy: string | null
          check_in_time: string
          check_out_time: string
          city: string
          cleaning_fee: number | null
          country: string
          created_at: string | null
          currency: string | null
          description: string | null
          email: string | null
          house_rules: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          name: string
          phone: string | null
          postal_code: string | null
          tax_rate: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          amenities?: Json | null
          cancellation_policy?: string | null
          check_in_time?: string
          check_out_time?: string
          city: string
          cleaning_fee?: number | null
          country: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          house_rules?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          postal_code?: string | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          amenities?: Json | null
          cancellation_policy?: string | null
          check_in_time?: string
          check_out_time?: string
          city?: string
          cleaning_fee?: number | null
          country?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          house_rules?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          amenities: Json | null
          base_price: number
          beds: Json
          biweekly_price: number | null
          building: string | null
          created_at: string | null
          daily_price: number | null
          description: string | null
          floor: number | null
          id: string
          images: Json | null
          is_active: boolean | null
          is_available: boolean | null
          max_guests: number
          max_nights: number | null
          min_nights: number | null
          minimum_nights: number | null
          monthly_price: number | null
          name: string
          policies: string | null
          property_id: string
          rental_type: string | null
          room_number: string | null
          room_type: Database["public"]["Enums"]["room_type"]
          size_sqm: number | null
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          base_price: number
          beds?: Json
          biweekly_price?: number | null
          building?: string | null
          created_at?: string | null
          daily_price?: number | null
          description?: string | null
          floor?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_available?: boolean | null
          max_guests?: number
          max_nights?: number | null
          min_nights?: number | null
          minimum_nights?: number | null
          monthly_price?: number | null
          name: string
          policies?: string | null
          property_id: string
          rental_type?: string | null
          room_number?: string | null
          room_type: Database["public"]["Enums"]["room_type"]
          size_sqm?: number | null
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          base_price?: number
          beds?: Json
          biweekly_price?: number | null
          building?: string | null
          created_at?: string | null
          daily_price?: number | null
          description?: string | null
          floor?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_available?: boolean | null
          max_guests?: number
          max_nights?: number | null
          min_nights?: number | null
          minimum_nights?: number | null
          monthly_price?: number | null
          name?: string
          policies?: string | null
          property_id?: string
          rental_type?: string | null
          room_number?: string | null
          room_type?: Database["public"]["Enums"]["room_type"]
          size_sqm?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      special_requests: {
        Row: {
          additional_cost: number | null
          booking_id: string
          created_at: string | null
          description: string
          id: string
          quantity: number | null
          request_date: string | null
          request_type: string
          responded_at: string | null
          responded_by: string | null
          response_note: string | null
          status: Database["public"]["Enums"]["special_request_status"]
          updated_at: string | null
        }
        Insert: {
          additional_cost?: number | null
          booking_id: string
          created_at?: string | null
          description: string
          id?: string
          quantity?: number | null
          request_date?: string | null
          request_type: string
          responded_at?: string | null
          responded_by?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["special_request_status"]
          updated_at?: string | null
        }
        Update: {
          additional_cost?: number | null
          booking_id?: string
          created_at?: string | null
          description?: string
          id?: string
          quantity?: number | null
          request_date?: string | null
          request_type?: string
          responded_at?: string | null
          responded_by?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["special_request_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          category: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      reset_all_frontend_texts: { Args: never; Returns: undefined }
    }
    Enums: {
      bed_type: "single" | "double" | "queen" | "king" | "sofa_bed" | "bunk_bed"
      booking_status:
        | "pending"
        | "confirmed"
        | "paid"
        | "cancelled"
        | "no_show"
        | "completed"
      message_type: "guest" | "staff" | "system" | "automated"
      notification_type:
        | "booking_confirmed"
        | "booking_cancelled"
        | "payment_received"
        | "payment_failed"
        | "special_request"
        | "message_received"
        | "system"
      payment_method:
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "cash"
        | "other"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      room_type: "Standard" | "Suite" | "Large"
      special_request_status: "pending" | "approved" | "rejected" | "completed"
      user_role: "admin" | "staff" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bed_type: ["single", "double", "queen", "king", "sofa_bed", "bunk_bed"],
      booking_status: [
        "pending",
        "confirmed",
        "paid",
        "cancelled",
        "no_show",
        "completed",
      ],
      message_type: ["guest", "staff", "system", "automated"],
      notification_type: [
        "booking_confirmed",
        "booking_cancelled",
        "payment_received",
        "payment_failed",
        "special_request",
        "message_received",
        "system",
      ],
      payment_method: [
        "credit_card",
        "debit_card",
        "bank_transfer",
        "cash",
        "other",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      room_type: ["Standard", "Suite", "Large"],
      special_request_status: ["pending", "approved", "rejected", "completed"],
      user_role: ["admin", "staff", "guest"],
    },
  },
} as const
