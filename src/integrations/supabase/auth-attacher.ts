import { createMiddleware } from '@tanstack/react-start'
import { supabase } from './client'

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    
    // Check if it's a new opaque Supabase key (sb_publishable_...)
    // If so, we still send it as Bearer for the middleware to handle, 
    // but the requireSupabaseAuth check for '.' split is what was failing.
    
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
)
