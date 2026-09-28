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
  row.created_at = profile.createdAt || new Date().toISOString();

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' });

  if (profileError) throw profileError;

  // Also maintain public projection
  const publicRow = {
    id: profile.userId,
    display_name: profile.displayName,
    photo_url: profile.photoUrl,
    professional_title: profile.professionalTitle,
    profession: profile.profession,
    location: profile.privacySettings?.locationVisibility !== false ? profile.location : null,
    skills: profile.privacySettings?.skillsVisibility !== false ? (profile.skills || []) : [],
    bio: profile.bio,
    availability: profile.availability,
    updated_at: new Date().toISOString(),
  };

  await supabase.from('public_profiles').upsert(publicRow, { onConflict: 'id' });
}

export async function updateUserFields(userId: string, partial: Partial<UserProfile>): Promise<void> {
  const row = mapProfileToRow(partial);
  const { error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', userId);

  if (error) throw error;

  // Sync public fields
  const publicUpdates: any = {};
  if (partial.displayName !== undefined) publicUpdates.display_name = partial.displayName;
  if (partial.photoUrl !== undefined) publicUpdates.photo_url = partial.photoUrl;
  if (partial.professionalTitle !== undefined) publicUpdates.professional_title = partial.professionalTitle;
  if (partial.profession !== undefined) publicUpdates.profession = partial.profession;
  if (partial.location !== undefined) publicUpdates.location = partial.location;
  if (partial.skills !== undefined) publicUpdates.skills = partial.skills;
  if (partial.bio !== undefined) publicUpdates.bio = partial.bio;
  if (partial.availability !== undefined) publicUpdates.availability = partial.availability;

  if (Object.keys(publicUpdates).length > 0) {
    publicUpdates.updated_at = new Date().toISOString();
    await supabase.from('public_profiles').update(publicUpdates).eq('id', userId);
  }
}

export async function deactivateAccount(userId: string): Promise<void> {
  await updateUserFields(userId, {
    status: 'deactivated',
    isDeactivated: true,
    deactivatedAt: new Date().toISOString(),
  });
}

export async function reactivateAccount(userId: string): Promise<void> {
  await updateUserFields(userId, {
    status: 'active',
    isDeactivated: false,
    deactivatedAt: undefined,
  });
}

export async function deleteAccountPermanently(userId: string): Promise<{ success: boolean; message: string }> {
  // Step 1: Check church owner safeguards
  const { data: ownedChurches } = await supabase
    .from('church_members')
    .select('church_id, churches:church_id(name, leader_ids)')
    .eq('user_id', userId)
    .eq('role', 'OWNER');

  if (ownedChurches && ownedChurches.length > 0) {
    for (const item of ownedChurches) {
      const church = (item as any).churches;
      const otherLeaders = (church?.leader_ids || []).filter((id: string) => id !== userId);
      if (otherLeaders.length === 0) {
        throw new Error(
          `Impossible de supprimer votre compte : vous êtes l'unique propriétaire de l'église "${church?.name || ''}". Vous devez d'abord désigner un autre propriétaire ou supprimer cette église.`
        );
      }
    }
  }

  // Step 2: Delete related user data
  await Promise.all([
    supabase.from('church_members').delete().eq('user_id', userId),
    supabase.from('event_participants').delete().eq('user_id', userId),
    supabase.from('notifications').delete().eq('user_id', userId),
    supabase.from('contact_requests').delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
    supabase.from('profiles').delete().eq('id', userId),
    supabase.from('public_profiles').delete().eq('id', userId),
  ]);

  // Sign out user locally
  await supabase.auth.signOut();

  return { success: true, message: 'Votre compte ALLORA et vos données associées ont été supprimés avec succès.' };
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


