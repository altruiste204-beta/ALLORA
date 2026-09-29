import { supabase } from '../client';
import { UserProfile, PublicProfile } from '../../types';

function mapProfileFromRow(row: any): UserProfile {
  return {
    userId: row.id,
    email: row.email,
    displayName: row.display_name,
    professionalTitle: row.professional_title,
    profession: row.profession,
    phoneNumber: row.phone_number,
    birthDate: row.birth_date,
    coverPhotoUrl: row.cover_photo_url,
    bio: row.bio,
    location: row.location,
    availability: row.availability,
    skills: row.skills || [],
    servicesOffered: row.services_offered || [],
    interests: row.interests || [],
    churchIds: row.church_ids || [],
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status || 'active',
    isDeactivated: Boolean(row.is_deactivated),
    deactivatedAt: row.deactivated_at,
    preferences: row.preferences || {},
    notificationPreferences: row.notification_preferences || {},
    privacySettings: row.privacy_settings || {},
  };
}

function mapProfileToRow(profile: Partial<UserProfile>): any {
  const row: any = {};
  if (profile.userId) row.id = profile.userId;
  if (profile.email !== undefined) row.email = profile.email;
  if (profile.displayName !== undefined) row.display_name = profile.displayName;
  if (profile.professionalTitle !== undefined) row.professional_title = profile.professionalTitle;
  if (profile.profession !== undefined) row.profession = profile.profession;
  if (profile.phoneNumber !== undefined) row.phone_number = profile.phoneNumber;
  if (profile.birthDate !== undefined) row.birth_date = profile.birthDate;
  if (profile.coverPhotoUrl !== undefined) row.cover_photo_url = profile.coverPhotoUrl;
  if (profile.bio !== undefined) row.bio = profile.bio;
  if (profile.location !== undefined) row.location = profile.location;
  if (profile.availability !== undefined) row.availability = profile.availability;
  if (profile.skills !== undefined) row.skills = profile.skills;
  if (profile.servicesOffered !== undefined) row.services_offered = profile.servicesOffered;
  if (profile.interests !== undefined) row.interests = profile.interests;
  if (profile.churchIds !== undefined) row.church_ids = profile.churchIds;
  if (profile.photoUrl !== undefined) row.photo_url = profile.photoUrl;
  if (profile.status !== undefined) row.status = profile.status;
  if (profile.isDeactivated !== undefined) row.is_deactivated = profile.isDeactivated;
  if (profile.deactivatedAt !== undefined) row.deactivated_at = profile.deactivatedAt;
  if (profile.preferences !== undefined) row.preferences = profile.preferences;
  if (profile.notificationPreferences !== undefined) row.notification_preferences = profile.notificationPreferences;
  if (profile.privacySettings !== undefined) row.privacy_settings = profile.privacySettings;
  row.updated_at = new Date().toISOString();
  return row;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Notice loading user profile from Supabase:', error);
    return null;
  }
  if (!data) return null;
  return mapProfileFromRow(data);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const row = mapProfileToRow(profile);
  // Auth owns identity/status fields. Only the profile attributes below are
  // client-editable; the database trigger maintains public_profiles.
  delete row.status;
  delete row.is_deactivated;
  delete row.deactivated_at;
  if (profile.email === undefined) delete row.email;
  row.id = profile.userId;
  row.created_at = profile.createdAt || new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' });

  if (error) throw error;
}

export async function updateUserFields(userId: string, partial: Partial<UserProfile>): Promise<void> {
  const row = mapProfileToRow(partial);

  // Never trust client attempts to change identity/account state.
  delete row.id;
  delete row.email;
  delete row.status;
  delete row.is_deactivated;
  delete row.deactivated_at;

  const { error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', userId);

  if (error) throw error;
}

export async function deactivateAccount(userId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user || user.user.id !== userId) throw new Error('Authentification requise');
  const { error } = await supabase.rpc('set_account_deactivated', { p_deactivated: true });
  if (error) throw error;
}

export async function reactivateAccount(userId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user || user.user.id !== userId) throw new Error('Authentification requise');
  const { error } = await supabase.rpc('set_account_deactivated', { p_deactivated: false });
  if (error) throw error;
}

export async function deleteAccountPermanently(userId: string): Promise<{ success: boolean; message: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user || user.user.id !== userId) throw new Error('Authentification requise');

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {},
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'La suppression du compte a échoué.');

  await supabase.auth.signOut();
  return {
    success: true,
    message: data.message || 'Votre compte ALLORA a été supprimé.',
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


