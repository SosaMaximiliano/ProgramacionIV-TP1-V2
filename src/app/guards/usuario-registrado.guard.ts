import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getSupabaseClient } from '../services/supabase-client';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return true;
  console.log(session);
  return router.createUrlTree(['/login']);
};
