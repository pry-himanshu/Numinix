import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone?: string;
          name: string;
          class_level: number;
          money: number;
          total_correct: number;
          total_wrong: number;
          avatar_id: number;
          unlocked_chapters: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string;
          name: string;
          class_level: number;
          money?: number;
          total_correct?: number;
          total_wrong?: number;
          avatar_id?: number;
          unlocked_chapters?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          name?: string;
          class_level?: number;
          money?: number;
          total_correct?: number;
          total_wrong?: number;
          avatar_id?: number;
          unlocked_chapters?: string[];
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          total_questions: number;
          money_earned: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          total_questions: number;
          money_earned: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          score?: number;
          total_questions?: number;
          money_earned?: number;
        };
      };
    };
  };
};