import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  const authHeader = context.request.headers.get('authorization');
  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;

  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : accessToken;

  if (token && refreshToken) {
    context.locals.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    await context.locals.supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });
  } else if (token) {
    context.locals.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  } else {
    context.locals.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return next();
});
