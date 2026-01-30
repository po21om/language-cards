import type { SupabaseClient } from '../../db/supabase.client';
import type {
  AuthSignUpResponse,
  AuthSignInResponse,
  AuthRefreshResponse,
  AuthUser,
  SessionInfo,
} from '../../types';

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  async signUp(email: string, password: string): Promise<AuthSignUpResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('User or session not created');
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
    };

    const session: SessionInfo = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
    };

    return { user, session };
  }

  async signIn(email: string, password: string): Promise<AuthSignInResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('User or session not found');
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
    };

    const session: SessionInfo = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
    };

    return { user, session };
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthRefreshResponse> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('Invalid or expired refresh token');
    }

    return {
      access_token: data.session.access_token,
      expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('delete_user', { user_id: userId });

    if (error) {
      throw error;
    }
  }
}
