import type { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

let supabaseClient: Promise<SupabaseClient> | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(environment.supabaseUrl && environment.supabasePublishableKey);
}

export function getSupabaseClient(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) {
    throw new Error('Falta configurar la URL y la clave pública de Supabase.');
  }

  if (!supabaseClient) {
    supabaseClient = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
        auth: {
          persistSession: false,
        },
      }),
    );
  }

  return supabaseClient;
}
