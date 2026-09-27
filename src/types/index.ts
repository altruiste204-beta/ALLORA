export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type NeedStatus = 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired';
export type NeedUrgency = 'low' | 'normal' | 'high' | 'urgent';
export type NeedVisibility = 'public' | 'church' | 'private';
export type ResourceStatus = 'available' | 'reserved' | 'unavailable' | 'closed';
export type ResourceType = 'loan' | 'donation' | 'service' | 'volunteer';
export type ResourceOwnerType = 'user' | 'church';
export type NeedResponseStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type EventVisibility = 'public' | 'church' | 'private';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type OrganizerType = 'user' | 'church';
export type EventParticipantStatus = 'registered' | 'cancelled' | 'attended';

export interface EventParticipant {
  participantId: string;
  eventId: string;
  userId: string;
  displayName?: string;
  email?: string;
  status: EventParticipantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityEvent {
  eventId: string;
  title: string;
  description: string;
  category: string;
  organizerType: OrganizerType;
  organizerId: string;
  organizerName?: string; // Cache
  churchId?: string;
  churchName?: string; // Cache
  location: string;
  imageUrl?: string;
  startAt: string; // ISO DateTime
  endAt: string; // ISO DateTime
  capacity?: number; // Optional capacity
  visibility: EventVisibility;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}
export type CollaborationStatus = 'draft' | 'proposed' | 'accepted' | 'active' | 'completed' | 'cancelled' | 'rejected' | 'archived';

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'left' | 'removed';

export interface LocationDetails {
  country: string;
  city: string;
  zone: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  professionalTitle?: string;
  profession?: string;
  phoneNumber?: string;
  birthDate?: string;
  coverPhotoUrl?: string;
  bio?: string;
  location?: string;
  availability?: string;
  skills?: string[];
  servicesOffered?: string[];
  interests?: string[];
  churchIds?: string[];
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Account Status (Deactivation)
  status?: 'active' | 'deactivated';
  isDeactivated?: boolean;
  deactivatedAt?: string;

  // Preferences
  preferences?: {
    language?: 'fr' | 'en' | 'sw';
    theme?: 'light' | 'dark' | 'system';
  };

  // Push Notifications
  fcmToken?: string;
  pushNotificationsEnabled?: boolean;

  // New settings fields
  notificationPreferences?: {
    needs?: boolean;
    resources?: boolean;
    helpRequests?: boolean;
    collaborations?: boolean;
    events?: boolean;
    community?: boolean;
    churches?: boolean;
    system?: boolean;
  };
  privacySettings?: {
    profileVisibility?: 'public' | 'church' | 'private';
    locationVisibility?: boolean;
    skillsVisibility?: boolean;
    activityVisibility?: boolean;
    postsVisibility?: boolean;
    professionalInfoVisibility?: 'public' | 'church' | 'private';
    contactVisibility?: 'public' | 'church' | 'private';
  };
}

export interface SupportTicket {
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'bug' | 'content_report' | 'contact' | 'question' | 'other';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  lastDoc: any | null;
  hasMore: boolean;
}

export interface Church {
  churchId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  city: string;
  country: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  denomination?: string;
  foundedYear?: string;
  joinCode: string; // unique join code e.g. "ALLORA-7K4P2"
  leaderIds: string[]; // [owner_uid, any admin_uids]
  verificationStatus: VerificationStatus;
  verified?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChurchMember {
  membershipId: string; // "churchId_userId"
  churchId: string;
  churchName: string;
  userId: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  role: MemberRole;
  status: MemberStatus;
  joinCode?: string;
  joinedAt: string;
  updatedAt: string;
}

export type PostStatus = 'published' | 'archived';
export type PostCategory = 'announcement' | 'community' | 'testimony' | 'information' | 'opportunity' | 'other';
export type PostVisibility = 'public' | 'church' | 'private';

export type OpportunityType = 'service' | 'job' | 'volunteer' | 'skill_request';
export type OpportunityStatus = 'open' | 'closed' | 'filled' | 'cancelled';
export type OpportunityVisibility = 'public' | 'church' | 'private';
export type OpportunityResponseStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Opportunity {
  opportunityId: string;
  type: OpportunityType;
  title: string;
  description: string;
  category: string;
  skills: string[];
  authorId: string;
  authorName?: string;
  authorPhotoUrl?: string;
  authorTitle?: string;
  churchId?: string;
  churchName?: string;
  location: string;
  visibility: OpportunityVisibility;
  status: OpportunityStatus;
  availability?: string;
  compensation?: string;
  responseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityResponse {
  responseId: string;
  opportunityId: string;
  opportunityTitle?: string;
  opportunityAuthorId: string;
  responderId: string;
  responderName: string;
  responderPhotoUrl?: string;
  responderTitle?: string;
  message: string;
  skills?: string[];
  contactEmail?: string;
  contactPhone?: string;
  status: OpportunityResponseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  postId: string;
  authorId: string;
  authorName?: string;
  authorPhotoUrl?: string;
  churchId?: string;
  churchName?: string;
  title: string;
  content: string;
  category: PostCategory;
  visibility: PostVisibility;
  status: PostStatus;
  reactions?: Record<string, string[]>; // reactionType -> userIds[]
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchNotification {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  churchId?: string;
  churchName?: string;
  relatedId?: string; // ID of post, event, collaboration, opportunity etc.
  type: 'membership_request' | 'membership_approved' | 'membership_rejected' | 'role_changed' | 'info' | 'needs' | 'resources' | 'collaborations' | 'churches' | 'events' | 'community' | 'opportunities' | 'system';
  read: boolean;
  createdAt: string;
}

export interface Need {
  needId: string;
  createdBy: string;
  authorName?: string; // Cache
  churchId?: string;
  churchName?: string; // Cache
  title: string;
  description: string;
  category: string;
  subcategory: string;
  location: LocationDetails;
  quantity: number;
  unit: string;
  neededFrom: string;
  neededUntil?: string;
  urgency: NeedUrgency;
  status: NeedStatus;
  visibility: NeedVisibility;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  resourceId: string;
  ownerId: string;
  ownerName?: string; // Cache
  ownerType: ResourceOwnerType;
  churchId?: string;
  churchName?: string; // Cache
  title: string;
  description: string;
  category: string;
  subcategory: string;
  type: ResourceType;
  location: LocationDetails;
  availability?: string;
  quantity: number;
  unit: string;
  availableFrom: string;
  availableUntil?: string;
  status: ResourceStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NeedResponse {
  responseId: string;
  needId: string;
  needAuthorId: string;
  resourceId?: string; // Optional if proposing custom response
  responderId: string;
  responderName?: string; // Cache
  message: string;
  quantityProposed: number;
  status: NeedResponseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Collaboration {
  collaborationId: string;
  needId: string;
  resourceId: string;
  needOwnerId: string;
  resourceOwnerId: string;
  churchId?: string | null;
  status: CollaborationStatus;
  quantity: number;
  message: string;
  createdAt: string;
  updatedAt: string;

  // Cached/computed UI fields for backwards compatibility and easy rendering
  title?: string;
  description?: string;
  needTitle?: string;
  resourceTitle?: string;
  needOwnerName?: string;
  resourceOwnerName?: string;
  churchName?: string;
  unit?: string;
  
  // Legacy fields (optional)
  leadChurchId?: string;
  leadChurchName?: string;
  churchIds?: string[];
  leaderIds?: string[];
}

export type ActiveTab = 'home' | 'churches' | 'events' | 'opportunities' | 'community' | 'profile' | 'needs' | 'resources' | 'notifications';
