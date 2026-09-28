import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../client';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
}

export async function loginWithGoogle(): Promise<{ url?: string | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
    },
  });

  if (error) throw error;
  return { url: data.url };
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Échec de connexion');
  return data.user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<{ user: User | null; requiresEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        display_name: displayName,
        full_name: displayName,
      },
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
    },
  });

  if (error) throw error;

  const requiresEmailConfirmation = !data.session && Boolean(data.user);
  return {
    user: data.user,
    requiresEmailConfirmation,
  };
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
  });
  if (error) throw error;
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
