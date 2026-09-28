import { supabase } from '../client';
import {
  Need,
  Resource,
  CommunityEvent,
  Church,
  ChurchMember,
  Post,
  Comment,
  Opportunity,
  OpportunityResponse,
  Collaboration,
  ContactRequest,
  ChurchNotification,
  EventParticipant,
  NeedResponse,
  SupportTicket,
  CollaborationStatus,
  MemberRole,
  MemberStatus,
  NeedResponseStatus,
  OpportunityResponseStatus,
  ContactRequestStatus,
  UserProfile,
  PostCategory,
  OpportunityType,
} from '../../types';

// ====================================================================
// 1. CHURCHES & MEMBERSHIPS
// ====================================================================

export async function fetchChurches(): Promise<Church[]> {
  const { data, error } = await supabase
    .from('churches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Notice loading churches:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    churchId: row.id,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    address: row.address,
    city: row.city,
    country: row.country,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    website: row.website,
    denomination: row.denomination,
    foundedYear: row.founded_year,
    leaderIds: row.leader_ids || [],
    verificationStatus: row.verification_status || 'pending',
    verified: row.verification_status === 'verified',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    joinCode: '', // Protected, not exposed publicly
  }));
}

export async function createChurch(
  church: Partial<Church>,
  userIdOrCode?: string,
  userDisplayName?: string,
  userEmail?: string
): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  const effectiveUserId = user.user?.id || (userDisplayName ? userIdOrCode : undefined);
  if (!effectiveUserId) throw new Error('Authentification requise pour créer une église');

  const cleanJoinCode = (userDisplayName || !userIdOrCode ? Math.random().toString(36).substring(2, 8).toUpperCase() : userIdOrCode.trim().toUpperCase());

  const { data: newChurch, error: churchError } = await supabase
    .from('churches')
    .insert({
      name: church.name,
      description: church.description,
      logo_url: church.logoUrl,
      cover_image_url: church.coverImageUrl,
      address: church.address,
      city: church.city,
      country: church.country,
      contact_phone: church.contactPhone,
      contact_email: church.contactEmail,
      website: church.website,
      denomination: church.denomination,
      founded_year: church.foundedYear,
      leader_ids: [effectiveUserId],
      verification_status: 'pending',
      created_by: effectiveUserId,
    })
    .select()
    .single();

  if (churchError) throw churchError;

  // Store secret joinCode securely in church_secrets
  const { error: secretError } = await supabase
    .from('church_secrets')
    .insert({
      church_id: newChurch.id,
      join_code: cleanJoinCode,
    });

  if (secretError) console.warn('Notice saving church secret:', secretError);

  // Automatically create OWNER membership
  const membershipId = `${newChurch.id}_${effectiveUserId}`;
  await supabase.from('church_members').upsert({
    id: membershipId,
    church_id: newChurch.id,
    user_id: effectiveUserId,
    church_name: newChurch.name,
    display_name: userDisplayName || user.user?.user_metadata?.display_name || user.user?.email?.split('@')[0] || 'Responsable',
    email: userEmail || user.user?.email || '',
    photo_url: user.user?.user_metadata?.avatar_url,
    role: 'OWNER',
    status: 'approved',
  });

  return newChurch.id;
}

export async function joinChurchWithCode(
  churchId: string,
  joinCode: string,
  _userInfo?: any
): Promise<{ success: boolean; message?: string }> {
  // Call secure RPC
  const { data, error } = await supabase.rpc('join_church_with_code', {
    p_church_id: churchId,
    p_join_code: joinCode,
  });

  if (error) throw new Error(error.message);
  return data || { success: true };
}

export async function fetchUserMemberships(userId: string): Promise<ChurchMember[]> {
  const { data, error } = await supabase
    .from('church_members')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('Notice loading user memberships:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    membershipId: row.id,
    churchId: row.church_id,
    churchName: row.church_name,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    photoUrl: row.photo_url,
    role: row.role as MemberRole,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
    updatedAt: row.updated_at,
  }));
}

export async function fetchChurchMembers(churchId: string): Promise<ChurchMember[]> {
  const { data, error } = await supabase
    .from('church_members')
    .select('*')
    .eq('church_id', churchId);

  if (error) {
    console.warn('Notice loading church members:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    membershipId: row.id,
    churchId: row.church_id,
    churchName: row.church_name,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    photoUrl: row.photo_url,
    role: row.role as MemberRole,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at,
    updatedAt: row.updated_at,
  }));
}

export async function updateChurchMemberRole(
  membershipId: string,
  role: MemberRole,
  _churchId?: string,
  _userId?: string,
  _churchName?: string
): Promise<void> {
  const { error } = await supabase
    .from('church_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', membershipId);

  if (error) throw error;
}

export async function updateChurchMemberStatus(
  membershipId: string,
  status: MemberStatus,
  _churchId?: string,
  _userId?: string,
  _churchName?: string
): Promise<void> {
  const { error } = await supabase
    .from('church_members')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', membershipId);

  if (error) throw error;
}

export async function requestToJoinChurch(
  churchId: string,
  userOrId: string | { uid?: string; id?: string; displayName?: string; email?: string; photoUrl?: string },
  churchNameOrDisplayName?: string,
  displayNameOrEmail?: string,
  email?: string,
  photoUrl?: string
): Promise<void> {
  let userId = '';
  let displayName = '';
  let userEmail = '';
  let photo = photoUrl;
  let churchName = churchNameOrDisplayName || '';

  if (typeof userOrId === 'object' && userOrId !== null) {
    userId = userOrId.uid || userOrId.id || '';
    displayName = userOrId.displayName || '';
    userEmail = userOrId.email || '';
    photo = userOrId.photoUrl;
  } else {
    userId = userOrId;
    displayName = displayNameOrEmail || '';
    userEmail = email || '';
  }

  const membershipId = `${churchId}_${userId}`;
  const { error } = await supabase.from('church_members').upsert({
    id: membershipId,
    church_id: churchId,
    user_id: userId,
    church_name: churchName,
    display_name: displayName || 'Membre ALLORA',
    email: userEmail,
    photo_url: photo,
    role: 'MEMBER',
    status: 'pending',
    joined_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export const updateMemberStatus = updateChurchMemberStatus;
export const updateMemberRole = updateChurchMemberRole;

export async function leaveChurch(churchId: string, userId: string): Promise<{ success: boolean; message: string }> {
  const membershipId = `${churchId}_${userId}`;
  const { error } = await supabase
    .from('church_members')
    .update({ status: 'left', updated_at: new Date().toISOString() })
    .or(`id.eq.${membershipId},and(church_id.eq.${churchId},user_id.eq.${userId})`);

  if (error) throw error;
  return { success: true, message: 'Vous avez quitté l\'église avec succès.' };
}

export function subscribeToUserMemberships(userId: string, callback: (memberships: ChurchMember[]) => void): () => void {
  // Initial fetch
  fetchUserMemberships(userId).then(callback);

  const channel = supabase
    .channel(`church_members_${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'church_members', filter: `user_id=eq.${userId}` },
      () => {
        fetchUserMemberships(userId).then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ====================================================================
// 2. NEEDS & RESPONSES
// ====================================================================

export async function fetchNeeds(options?: { churchId?: string; status?: string }): Promise<Need[]> {
  let query = supabase.from('needs').select('*').order('created_at', { ascending: false });

  if (options?.churchId) {
    query = query.eq('church_id', options.churchId);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Notice loading needs:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    needId: row.id,
    createdBy: row.created_by,
    authorName: row.author_name,
    churchId: row.church_id,
    churchName: row.church_name,
    title: row.title,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    location: row.location || { country: '', city: '', zone: '' },
    quantity: Number(row.quantity),
    unit: row.unit,
    neededFrom: row.needed_from,
    neededUntil: row.needed_until,
    urgency: row.urgency,
    status: row.status,
    visibility: row.visibility,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createNeed(need: Partial<Need>): Promise<Need> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('needs')
    .insert({
      created_by: user.user.id,
      author_name: need.authorName || user.user.user_metadata?.display_name || user.user.email?.split('@')[0],
      church_id: need.churchId || null,
      church_name: need.churchName,
      title: need.title,
      description: need.description,
      category: need.category,
      subcategory: need.subcategory,
      location: need.location,
      quantity: need.quantity,
      unit: need.unit,
      needed_from: need.neededFrom,
      needed_until: need.neededUntil,
      urgency: need.urgency || 'normal',
      status: 'open',
      visibility: need.visibility || 'public',
      image_url: need.imageUrl,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    needId: data.id,
    createdBy: data.created_by,
    authorName: data.author_name,
    churchId: data.church_id,
    churchName: data.church_name,
    title: data.title,
    description: data.description,
    category: data.category,
    subcategory: data.subcategory,
    location: data.location,
    quantity: Number(data.quantity),
    unit: data.unit,
    neededFrom: data.needed_from,
    neededUntil: data.needed_until,
    urgency: data.urgency,
    status: data.status,
    visibility: data.visibility,
    imageUrl: data.image_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateNeed(needId: string, partial: Partial<Need>): Promise<void> {
  const updates: any = {};
  if (partial.title !== undefined) updates.title = partial.title;
  if (partial.description !== undefined) updates.description = partial.description;
  if (partial.category !== undefined) updates.category = partial.category;
  if (partial.subcategory !== undefined) updates.subcategory = partial.subcategory;
  if (partial.location !== undefined) updates.location = partial.location;
  if (partial.quantity !== undefined) updates.quantity = partial.quantity;
  if (partial.unit !== undefined) updates.unit = partial.unit;
  if (partial.neededFrom !== undefined) updates.needed_from = partial.neededFrom;
  if (partial.neededUntil !== undefined) updates.needed_until = partial.neededUntil;
  if (partial.urgency !== undefined) updates.urgency = partial.urgency;
  if (partial.status !== undefined) updates.status = partial.status;
  if (partial.visibility !== undefined) updates.visibility = partial.visibility;
  if (partial.imageUrl !== undefined) updates.image_url = partial.imageUrl;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('needs').update(updates).eq('id', needId);
  if (error) throw error;
}

export async function deleteNeed(needId: string): Promise<void> {
  const { error } = await supabase.from('needs').delete().eq('id', needId);
  if (error) throw error;
}

export async function fetchNeedResponses(needId: string): Promise<NeedResponse[]> {
  const { data, error } = await supabase
    .from('need_responses')
    .select('*')
    .eq('need_id', needId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Notice loading need responses:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    responseId: row.id,
    needId: row.need_id,
    needAuthorId: row.need_author_id,
    resourceId: row.resource_id,
    responderId: row.responder_id,
    responderName: row.responder_name,
    message: row.message,
    quantityProposed: Number(row.quantity_proposed),
    status: row.status as NeedResponseStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createNeedResponse(
  needIdOrResponse: string | Partial<NeedResponse>,
  needAuthorId?: string,
  _needTitle?: string,
  _userId?: string,
  displayName?: string,
  proposalMessage?: string,
  proposalQty?: number,
  resourceId?: string
): Promise<NeedResponse> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  let needId = '';
  let authorId = needAuthorId;
  let resId = resourceId || null;
  let name = displayName || user.user.user_metadata?.display_name || user.user.email?.split('@')[0];
  let msg = proposalMessage || '';
  let qty = proposalQty || 1;

  if (typeof needIdOrResponse === 'object') {
    needId = needIdOrResponse.needId || '';
    authorId = needIdOrResponse.needAuthorId || authorId;
    resId = needIdOrResponse.resourceId || resId;
    name = needIdOrResponse.responderName || name;
    msg = needIdOrResponse.message || msg;
    qty = needIdOrResponse.quantityProposed || qty;
  } else {
    needId = needIdOrResponse;
  }

  const { data, error } = await supabase
    .from('need_responses')
    .insert({
      need_id: needId,
      need_author_id: authorId,
      resource_id: resId,
      responder_id: user.user.id,
      responder_name: name,
      message: msg,
      quantity_proposed: qty,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    responseId: data.id,
    needId: data.need_id,
    needAuthorId: data.need_author_id,
    resourceId: data.resource_id,
    responderId: data.responder_id,
    responderName: data.responder_name,
    message: data.message,
    quantityProposed: Number(data.quantity_proposed),
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateNeedResponseStatus(
  needIdOrResponseId: string,
  responseIdOrStatus: string | NeedResponseStatus,
  statusArg?: NeedResponseStatus,
  _qtyProposed?: number,
  _responderId?: string,
  _resId?: string
): Promise<void> {
  let responseId = needIdOrResponseId;
  let status: NeedResponseStatus = 'pending';

  if (statusArg) {
    responseId = responseIdOrStatus;
    status = statusArg;
  } else {
    status = responseIdOrStatus as NeedResponseStatus;
  }

  const { error } = await supabase
    .from('need_responses')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', responseId);

  if (error) throw error;
}

// ====================================================================
// 3. RESOURCES
// ====================================================================

export async function fetchResources(options?: { churchId?: string; type?: string; status?: string }): Promise<Resource[]> {
  let query = supabase.from('resources').select('*').order('created_at', { ascending: false });

  if (options?.churchId) {
    query = query.eq('church_id', options.churchId);
  }
  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Notice loading resources:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    resourceId: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerType: row.owner_type,
    churchId: row.church_id,
    churchName: row.church_name,
    title: row.title,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    type: row.type,
    location: row.location || { country: '', city: '', zone: '' },
    availability: row.availability,
    quantity: Number(row.quantity),
    unit: row.unit,
    availableFrom: row.available_from,
    availableUntil: row.available_until,
    status: row.status,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createResource(resource: Partial<Resource>): Promise<Resource> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('resources')
    .insert({
      owner_id: user.user.id,
      owner_name: resource.ownerName || user.user.user_metadata?.display_name || user.user.email?.split('@')[0],
      owner_type: resource.ownerType || 'user',
      church_id: resource.churchId || null,
      church_name: resource.churchName,
      title: resource.title,
      description: resource.description,
      category: resource.category,
      subcategory: resource.subcategory,
      type: resource.type || 'donation',
      location: resource.location,
      availability: resource.availability,
      quantity: resource.quantity || 1,
      unit: resource.unit,
      available_from: resource.availableFrom,
      available_until: resource.availableUntil,
      status: 'available',
      image_url: resource.imageUrl,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    resourceId: data.id,
    ownerId: data.owner_id,
    ownerName: data.owner_name,
    ownerType: data.owner_type,
    churchId: data.church_id,
    churchName: data.church_name,
    title: data.title,
    description: data.description,
    category: data.category,
    subcategory: data.subcategory,
    type: data.type,
    location: data.location,
    availability: data.availability,
    quantity: Number(data.quantity),
    unit: data.unit,
    availableFrom: data.available_from,
    availableUntil: data.available_until,
    status: data.status,
    imageUrl: data.image_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateResource(resourceId: string, partial: Partial<Resource>): Promise<void> {
  const updates: any = {};
  if (partial.title !== undefined) updates.title = partial.title;
  if (partial.description !== undefined) updates.description = partial.description;
  if (partial.category !== undefined) updates.category = partial.category;
  if (partial.subcategory !== undefined) updates.subcategory = partial.subcategory;
  if (partial.type !== undefined) updates.type = partial.type;
  if (partial.location !== undefined) updates.location = partial.location;
  if (partial.availability !== undefined) updates.availability = partial.availability;
  if (partial.quantity !== undefined) updates.quantity = partial.quantity;
  if (partial.unit !== undefined) updates.unit = partial.unit;
  if (partial.availableFrom !== undefined) updates.available_from = partial.availableFrom;
  if (partial.availableUntil !== undefined) updates.available_until = partial.availableUntil;
  if (partial.status !== undefined) updates.status = partial.status;
  if (partial.imageUrl !== undefined) updates.image_url = partial.imageUrl;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('resources').update(updates).eq('id', resourceId);
  if (error) throw error;
}

export async function deleteResource(resourceId: string): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', resourceId);
  if (error) throw error;
}

// ====================================================================
// 4. COLLABORATIONS
// ====================================================================

export async function fetchCollaborations(
  optionsOrLimit?: number | { userId?: string; status?: string },
  userIdOrStatus?: string
): Promise<Collaboration[]> {
  let query = supabase.from('collaborations').select('*').order('created_at', { ascending: false });

  if (typeof optionsOrLimit === 'object' && optionsOrLimit !== null) {
    if (optionsOrLimit.userId) {
      query = query.or(`need_owner_id.eq.${optionsOrLimit.userId},resource_owner_id.eq.${optionsOrLimit.userId}`);
    }
    if (optionsOrLimit.status) {
      query = query.eq('status', optionsOrLimit.status);
    }
  } else {
    if (typeof optionsOrLimit === 'number') {
      query = query.limit(optionsOrLimit);
    }
    if (userIdOrStatus) {
      query = query.or(`need_owner_id.eq.${userIdOrStatus},resource_owner_id.eq.${userIdOrStatus}`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Notice loading collaborations:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    collaborationId: row.id,
    needId: row.need_id,
    resourceId: row.resource_id,
    needOwnerId: row.need_owner_id,
    resourceOwnerId: row.resource_owner_id,
    churchId: row.church_id,
    status: row.status as CollaborationStatus,
    quantity: Number(row.quantity),
    message: row.message,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createCollaboration(collab: Partial<Collaboration>): Promise<Collaboration> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('collaborations')
    .insert({
      need_id: collab.needId,
      resource_id: collab.resourceId,
      need_owner_id: collab.needOwnerId,
      resource_owner_id: collab.resourceOwnerId,
      church_id: collab.churchId || null,
      status: 'proposed',
      quantity: collab.quantity || 1,
      message: collab.message || '',
      title: collab.title,
      description: collab.description,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    collaborationId: data.id,
    needId: data.need_id,
    resourceId: data.resource_id,
    needOwnerId: data.need_owner_id,
    resourceOwnerId: data.resource_owner_id,
    churchId: data.church_id,
    status: data.status,
    quantity: Number(data.quantity),
    message: data.message,
    title: data.title,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateCollaborationStatus(
  collaborationId: string,
  status: CollaborationStatus,
  _userId?: string
): Promise<void> {
  const { error } = await supabase
    .from('collaborations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', collaborationId);

  if (error) throw error;
}

// ====================================================================
// 5. EVENTS & PARTICIPANTS
// ====================================================================

export async function fetchEvents(options?: { churchId?: string }): Promise<CommunityEvent[]> {
  let query = supabase.from('events').select('*').order('start_at', { ascending: true });

  if (options?.churchId) {
    query = query.eq('church_id', options.churchId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Notice loading events:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    eventId: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    organizerType: row.organizer_type,
    organizerId: row.organizer_id,
    organizerName: row.organizer_name,
    churchId: row.church_id,
    churchName: row.church_name,
    location: row.location,
    imageUrl: row.image_url,
    startAt: row.start_at,
    endAt: row.end_at,
    capacity: row.capacity,
    visibility: row.visibility,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createEvent(event: Partial<CommunityEvent>): Promise<CommunityEvent> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: event.title,
      description: event.description,
      category: event.category,
      organizer_type: event.organizerType || 'user',
      organizer_id: user.user.id,
      organizer_name: event.organizerName || user.user.user_metadata?.display_name || user.user.email?.split('@')[0],
      church_id: event.churchId || null,
      church_name: event.churchName,
      location: event.location,
      image_url: event.imageUrl,
      start_at: event.startAt,
      end_at: event.endAt,
      capacity: event.capacity || null,
      visibility: event.visibility || 'public',
      status: 'published',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    eventId: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    organizerType: data.organizer_type,
    organizerId: data.organizer_id,
    organizerName: data.organizer_name,
    churchId: data.church_id,
    churchName: data.church_name,
    location: data.location,
    imageUrl: data.image_url,
    startAt: data.start_at,
    endAt: data.end_at,
    capacity: data.capacity,
    visibility: data.visibility,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateEvent(eventId: string, partial: Partial<CommunityEvent>, _userId?: string): Promise<void> {
  const updates: any = {};
  if (partial.title !== undefined) updates.title = partial.title;
  if (partial.description !== undefined) updates.description = partial.description;
  if (partial.category !== undefined) updates.category = partial.category;
  if (partial.location !== undefined) updates.location = partial.location;
  if (partial.imageUrl !== undefined) updates.image_url = partial.imageUrl;
  if (partial.startAt !== undefined) updates.start_at = partial.startAt;
  if (partial.endAt !== undefined) updates.end_at = partial.endAt;
  if (partial.capacity !== undefined) updates.capacity = partial.capacity;
  if (partial.visibility !== undefined) updates.visibility = partial.visibility;
  if (partial.status !== undefined) updates.status = partial.status;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('events').update(updates).eq('id', eventId);
  if (error) throw error;
}

export async function deleteEvent(eventId: string, _userId?: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

export async function registerForEvent(
  eventId: string,
  userIdOrParticipant?: string | Partial<EventParticipant>,
  displayName?: string,
  email?: string
): Promise<{ success: boolean; registeredCount?: number }> {
  const { data: user } = await supabase.auth.getUser();
  const uid = typeof userIdOrParticipant === 'string' ? userIdOrParticipant : (user.user?.id || '');
  const name = displayName || (typeof userIdOrParticipant === 'object' ? userIdOrParticipant?.displayName : undefined) || user.user?.user_metadata?.display_name || user.user?.email?.split('@')[0] || 'Participant';
  const mail = email || (typeof userIdOrParticipant === 'object' ? userIdOrParticipant?.email : undefined) || user.user?.email || '';

  if (uid) {
    const participantId = `${eventId}_${uid}`;
    await supabase.from('event_participants').upsert({
      id: participantId,
      event_id: eventId,
      user_id: uid,
      display_name: name,
      email: mail,
      status: 'registered',
      updated_at: new Date().toISOString(),
    });
  }

  // Also call atomic stored procedure if available
  try {
    const { data } = await supabase.rpc('register_for_event', { p_event_id: eventId });
    if (data) return data;
  } catch (_e) {
    // Stored procedure fallback
  }

  return { success: true };
}

export async function cancelEventRegistration(eventId: string, _userId?: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const participantId = `${eventId}_${user.user.id}`;
  const { error } = await supabase
    .from('event_participants')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', participantId);

  if (error) throw error;
}

export const cancelEventParticipation = cancelEventRegistration;

export async function fetchEventParticipants(eventId: string): Promise<EventParticipant[]> {
  const { data, error } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'registered');

  if (error) {
    console.warn('Notice loading participants:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    participantId: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// ====================================================================
// 6. POSTS & COMMENTS
// ====================================================================

export async function fetchPostsPaginated(
  categoryOrPageSize?: PostCategory | number,
  _lastDoc?: any,
  categoryOrPageSize2?: PostCategory | number
): Promise<{ items: Post[]; lastDoc: any; hasMore: boolean }> {
  let pageSize = 20;
  let category: PostCategory | undefined;

  if (typeof categoryOrPageSize === 'number') {
    pageSize = categoryOrPageSize;
    if (typeof categoryOrPageSize2 === 'string') {
      category = categoryOrPageSize2 as PostCategory;
    }
  } else if (typeof categoryOrPageSize === 'string') {
    category = categoryOrPageSize;
    if (typeof categoryOrPageSize2 === 'number') {
      pageSize = categoryOrPageSize2;
    }
  }

  let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(pageSize);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Notice loading paginated posts:', error);
    return { items: [], lastDoc: null, hasMore: false };
  }

  const items = (data || []).map((row: any) => ({
    postId: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPhotoUrl: row.author_photo_url,
    churchId: row.church_id,
    churchName: row.church_name,
    title: row.title,
    content: row.content,
    category: row.category,
    visibility: row.visibility,
    status: row.status,
    reactions: row.reactions || {},
    commentCount: row.comment_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    items,
    lastDoc: items.length > 0 ? items[items.length - 1].createdAt : null,
    hasMore: items.length === pageSize,
  };
}

export async function fetchPosts(options?: { churchId?: string }): Promise<Post[]> {
  let query = supabase.from('posts').select('*').order('created_at', { ascending: false });

  if (options?.churchId) {
    query = query.eq('church_id', options.churchId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Notice loading posts:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    postId: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPhotoUrl: row.author_photo_url,
    churchId: row.church_id,
    churchName: row.church_name,
    title: row.title,
    content: row.content,
    category: row.category,
    visibility: row.visibility,
    status: row.status,
    reactions: row.reactions || {},
    commentCount: row.comment_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createPost(post: Partial<Post>): Promise<Post> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.user.id,
      author_name: post.authorName || user.user.user_metadata?.display_name || user.user.email?.split('@')[0],
      author_photo_url: post.authorPhotoUrl || user.user.user_metadata?.avatar_url,
      church_id: post.churchId || null,
      church_name: post.churchName,
      title: post.title,
      content: post.content,
      category: post.category || 'community',
      visibility: post.visibility || 'public',
      status: 'published',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    postId: data.id,
    authorId: data.author_id,
    authorName: data.author_name,
    authorPhotoUrl: data.author_photo_url,
    churchId: data.church_id,
    churchName: data.church_name,
    title: data.title,
    content: data.content,
    category: data.category,
    visibility: data.visibility,
    status: data.status,
    reactions: data.reactions || {},
    commentCount: 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePost(postId: string, partial: Partial<Post>): Promise<void> {
  const updates: any = {};
  if (partial.title !== undefined) updates.title = partial.title;
  if (partial.content !== undefined) updates.content = partial.content;
  if (partial.category !== undefined) updates.category = partial.category;
  if (partial.visibility !== undefined) updates.visibility = partial.visibility;
  if (partial.status !== undefined) updates.status = partial.status;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('posts').update(updates).eq('id', postId);
  if (error) throw error;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function togglePostReaction(
  postId: string,
  userIdOrReaction: string,
  reactionType?: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  const reaction = reactionType || userIdOrReaction;
  const uid = reactionType ? userIdOrReaction : user.user?.id;
  if (!uid) return;

  const { data: post } = await supabase.from('posts').select('reactions').eq('id', postId).single();
  if (!post) return;

  const reactions = post.reactions || {};
  const currentUsers: string[] = reactions[reaction] || [];

  if (currentUsers.includes(uid)) {
    reactions[reaction] = currentUsers.filter((id) => id !== uid);
  } else {
    reactions[reaction] = [...currentUsers, uid];
  }

  await supabase.from('posts').update({ reactions }).eq('id', postId);
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Notice loading comments:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    commentId: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPhotoUrl: row.author_photo_url,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createComment(comment: Partial<Comment>, _postAuthorId?: string): Promise<Comment> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: comment.postId,
      author_id: user.user.id,
      author_name: comment.authorName || user.user.user_metadata?.display_name || user.user.email?.split('@')[0],
      author_photo_url: comment.authorPhotoUrl || user.user.user_metadata?.avatar_url,
      content: comment.content,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    commentId: data.id,
    postId: data.post_id,
    authorId: data.author_id,
    authorName: data.author_name,
    authorPhotoUrl: data.author_photo_url,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

// ====================================================================
// 7. OPPORTUNITIES & RESPONSES
// ====================================================================

export async function fetchOpportunitiesPaginated(
  typeOrPageSize?: OpportunityType | number,
  churchIdOrLastDoc?: any,
  _lastDoc?: any,
  pageSizeArg = 12
): Promise<{ items: Opportunity[]; lastDoc: any; hasMore: boolean }> {
  let pageSize = pageSizeArg;
  let type: OpportunityType | undefined;
  let churchId: string | undefined;

  if (typeof typeOrPageSize === 'number') {
    pageSize = typeOrPageSize;
  } else if (typeof typeOrPageSize === 'string') {
    type = typeOrPageSize as OpportunityType;
    if (typeof churchIdOrLastDoc === 'string') {
      churchId = churchIdOrLastDoc;
    }
  }

  let query = supabase.from('opportunities').select('*').order('created_at', { ascending: false }).limit(pageSize);

  if (type) {
    query = query.eq('type', type);
  }
  if (churchId) {
    query = query.eq('church_id', churchId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Notice loading paginated opportunities:', error);
    return { items: [], lastDoc: null, hasMore: false };
  }

  const items = (data || []).map((row: any) => ({
    opportunityId: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    category: row.category,
    skills: row.skills || [],
    authorId: row.author_id,
    authorName: row.author_name,
    authorPhotoUrl: row.author_photo_url,
    authorTitle: row.author_title,
    churchId: row.church_id,
    churchName: row.church_name,
    location: row.location,
    visibility: row.visibility,
    status: row.status,
    availability: row.availability,
    compensation: row.compensation,
    responseCount: row.response_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    items,
    lastDoc: items.length > 0 ? items[items.length - 1].createdAt : null,
    hasMore: items.length === pageSize,
  };
}

export async function fetchProfessionalProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('Notice loading professional profiles:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    userId: row.id,
    email: '',
    displayName: row.display_name,
    photoUrl: row.photo_url,
    professionalTitle: row.professional_title,
    profession: row.profession,
    location: row.location,
    skills: row.skills || [],
    bio: row.bio,
    availability: row.availability,
    createdAt: row.updated_at,
    updatedAt: row.updated_at,
  }));
}

export async function fetchOpportunities(options?: { churchId?: string; type?: string }): Promise<Opportunity[]> {
  let query = supabase.from('opportunities').select('*').order('created_at', { ascending: false });

  if (options?.churchId) {
    query = query.eq('church_id', options.churchId);
  }
  if (options?.type) {
    query = query.eq('type', options.type);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Notice loading opportunities:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    opportunityId: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    category: row.category,
    skills: row.skills || [],
    authorId: row.author_id,
    authorName: row.author_name,
    authorPhotoUrl: row.author_photo_url,
    authorTitle: row.author_title,
    churchId: row.church_id,
    churchName: row.church_name,
    location: row.location,
    visibility: row.visibility,
    status: row.status,
    availability: row.availability,
    compensation: row.compensation,
    responseCount: row.response_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createOpportunity(opp: Partial<Opportunity>): Promise<Opportunity> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      type: opp.type || 'service',
      title: opp.title,
      description: opp.description,
      category: opp.category,
      skills: opp.skills || [],
      author_id: user.user.id,
      author_name: opp.authorName || user.user.user_metadata?.display_name || user.user.email?.split('@')[0],
      author_photo_url: opp.authorPhotoUrl || user.user.user_metadata?.avatar_url,
      author_title: opp.authorTitle,
      church_id: opp.churchId || null,
      church_name: opp.churchName,
      location: opp.location,
      visibility: opp.visibility || 'public',
      status: 'open',
      availability: opp.availability,
      compensation: opp.compensation,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    opportunityId: data.id,
    type: data.type,
    title: data.title,
    description: data.description,
    category: data.category,
    skills: data.skills || [],
    authorId: data.author_id,
    authorName: data.author_name,
    authorPhotoUrl: data.author_photo_url,
    authorTitle: data.author_title,
    churchId: data.church_id,
    churchName: data.church_name,
    location: data.location,
    visibility: data.visibility,
    status: data.status,
    availability: data.availability,
    compensation: data.compensation,
    responseCount: 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateOpportunity(oppId: string, partial: Partial<Opportunity>, _userId?: string): Promise<void> {
  const updates: any = {};
  if (partial.title !== undefined) updates.title = partial.title;
  if (partial.description !== undefined) updates.description = partial.description;
  if (partial.category !== undefined) updates.category = partial.category;
  if (partial.skills !== undefined) updates.skills = partial.skills;
  if (partial.location !== undefined) updates.location = partial.location;
  if (partial.visibility !== undefined) updates.visibility = partial.visibility;
  if (partial.status !== undefined) updates.status = partial.status;
  if (partial.availability !== undefined) updates.availability = partial.availability;
  if (partial.compensation !== undefined) updates.compensation = partial.compensation;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('opportunities').update(updates).eq('id', oppId);
  if (error) throw error;
}

export async function deleteOpportunity(oppId: string, _userId?: string): Promise<void> {
  const { error } = await supabase.from('opportunities').delete().eq('id', oppId);
  if (error) throw error;
}

export async function fetchOpportunityResponses(oppId: string): Promise<OpportunityResponse[]> {
  const { data, error } = await supabase
    .from('opportunity_responses')
    .select('*')
    .eq('opportunity_id', oppId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Notice loading responses:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    responseId: row.id,
    opportunityId: row.opportunity_id,
    opportunityTitle: row.opportunity_title,
    opportunityAuthorId: row.opportunity_author_id,
    responderId: row.responder_id,
    responderName: row.responder_name,
    responderPhotoUrl: row.responder_photo_url,
    responderTitle: row.responder_title,
    message: row.message,
    skills: row.skills || [],
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    status: row.status as OpportunityResponseStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createOpportunityResponse(
  resp: Partial<OpportunityResponse>,
  opportunityTitle?: string,
  opportunityAuthorId?: string
): Promise<OpportunityResponse> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('opportunity_responses')
    .insert({
      opportunity_id: resp.opportunityId,
      opportunity_title: resp.opportunityTitle || opportunityTitle,
      opportunity_author_id: resp.opportunityAuthorId || opportunityAuthorId,
      responder_id: user.user.id,
      responder_name: resp.responderName || user.user.user_metadata?.display_name || user.user.email?.split('@')[0],
      responder_photo_url: resp.responderPhotoUrl || user.user.user_metadata?.avatar_url,
      responder_title: resp.responderTitle,
      message: resp.message,
      skills: resp.skills || [],
      contact_email: resp.contactEmail,
      contact_phone: resp.contactPhone,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    responseId: data.id,
    opportunityId: data.opportunity_id,
    opportunityTitle: data.opportunity_title,
    opportunityAuthorId: data.opportunity_author_id,
    responderId: data.responder_id,
    responderName: data.responder_name,
    responderPhotoUrl: data.responder_photo_url,
    responderTitle: data.responder_title,
    message: data.message,
    skills: data.skills || [],
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateOpportunityResponseStatus(
  responseId: string,
  status: OpportunityResponseStatus,
  _responderId?: string,
  _opportunityTitle?: string
): Promise<void> {
  const { error } = await supabase
    .from('opportunity_responses')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', responseId);

  if (error) throw error;
}

// ====================================================================
// 8. CONTACT REQUESTS
// ====================================================================

export async function fetchContactRequests(userId: string): Promise<ContactRequest[]> {
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Notice loading contact requests:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    requestId: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderPhotoUrl: row.sender_photo_url,
    recipientId: row.recipient_id,
    recipientName: row.recipient_name,
    message: row.message,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    status: row.status as ContactRequestStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createContactRequest(
  senderIdOrReq: string | Partial<ContactRequest>,
  recipientId?: string,
  message?: string,
  contactEmail?: string,
  contactPhone?: string,
  senderName?: string,
  senderPhotoUrl?: string,
  recipientName?: string
): Promise<ContactRequest> {
  const { data: user } = await supabase.auth.getUser();
  let sId = user.user?.id || '';
  let rId = recipientId || '';
  let msg = message || '';
  let email = contactEmail;
  let phone = contactPhone;
  let sName = senderName || user.user?.user_metadata?.display_name || user.user?.email?.split('@')[0];
  let sPhoto = senderPhotoUrl || user.user?.user_metadata?.avatar_url;
  let rName = recipientName;

  if (typeof senderIdOrReq === 'object' && senderIdOrReq !== null) {
    sId = senderIdOrReq.senderId || sId;
    rId = senderIdOrReq.recipientId || rId;
    msg = senderIdOrReq.message || msg;
    email = senderIdOrReq.contactEmail || email;
    phone = senderIdOrReq.contactPhone || phone;
    sName = senderIdOrReq.senderName || sName;
    sPhoto = senderIdOrReq.senderPhotoUrl || sPhoto;
    rName = senderIdOrReq.recipientName || rName;
  } else if (typeof senderIdOrReq === 'string') {
    sId = senderIdOrReq;
  }

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      sender_id: sId,
      sender_name: sName,
      sender_photo_url: sPhoto,
      recipient_id: rId,
      recipient_name: rName,
      message: msg,
      contact_email: email,
      contact_phone: phone,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    requestId: data.id,
    senderId: data.sender_id,
    senderName: data.sender_name,
    senderPhotoUrl: data.sender_photo_url,
    recipientId: data.recipient_id,
    recipientName: data.recipient_name,
    message: data.message,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateContactRequestStatus(requestId: string, status: ContactRequestStatus): Promise<void> {
  const { error } = await supabase
    .from('contact_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw error;
}

// ====================================================================
// 9. NOTIFICATIONS & SUPPORT
// ====================================================================

export async function fetchUserNotifications(userId: string): Promise<ChurchNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Notice loading notifications:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    notificationId: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    churchId: row.church_id,
    churchName: row.church_name,
    relatedId: row.related_id,
    type: row.type,
    read: row.read,
    createdAt: row.created_at,
  }));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId);

  if (error) throw error;
}

export function subscribeToUserNotifications(userId: string, callback: (notifs: ChurchNotification[]) => void): () => void {
  fetchUserNotifications(userId).then(callback);

  const channel = supabase
    .channel(`notifications_${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      () => {
        fetchUserNotifications(userId).then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createSupportTicket(ticket: Partial<SupportTicket>): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  const effectiveUserId = ticket.userId || user.user?.id;
  if (!effectiveUserId) throw new Error('Authentification requise');

  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: effectiveUserId,
      user_email: ticket.userEmail || user.user?.email || '',
      user_name: ticket.userName || user.user?.user_metadata?.display_name || user.user?.email?.split('@')[0] || '',
      type: ticket.type || 'question',
      subject: ticket.subject,
      message: ticket.message,
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;

  return data.id;
}
