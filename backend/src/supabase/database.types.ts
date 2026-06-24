export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          created_at: string;
          user_name: string;
          password: string;
          rol: string | null;
          application: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          user_name: string;
          password: string;
          rol?: string | null;
          application?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          user_name?: string;
          password?: string;
          rol?: string | null;
          application?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type UserRow = Database['public']['Tables']['users']['Row'];
export type SafeUserRow = Omit<UserRow, 'password'>;