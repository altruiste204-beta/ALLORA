import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Modal } from '../common/Modal';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  fetchEventParticipants,
  registerForEvent,
  cancelEventParticipation,
  fetchUserMemberships
} from '../../supabase/services/dataService';
import { CommunityEvent, EventParticipant, ChurchMember, EventVisibility, EventStatus, OrganizerType } from '../../types';

interface EventsViewProps {
  onOpenAuth: () => void;
  onOpenActionSheet: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onOpenAuth }) => {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  
  const CATEGORIES = Object.values(t.events.categoriesList);
  
  // Data States
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMemberships, setUserMemberships] = useState<ChurchMember[]>([]);
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState('');
  
  // Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form States (for Create & Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formOrganizerType, setFormOrganizerType] = useState<OrganizerType>('user');
  const [formChurchId, setFormChurchId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formVisibility, setFormVisibility] = useState<EventVisibility>('public');
  const [formStatus, setFormStatus] = useState<EventStatus>('published');
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Main Data
  const loadData = async () => {
    setLoading(true);
    try {
      const allEvents = await fetchEvents();
      setEvents(allEvents);

      if (user) {
        const memberships = await fetchUserMemberships(user.uid);
        // Filter only approved OWNER or ADMIN memberships
        const leading = memberships.filter(m => m.status === 'approved' && (m.role === 'OWNER' || m.role === 'ADMIN'));
        setUserMemberships(leading);
      }
    } catch (err: any) {
      console.error('Error loading events data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load Event Participants
  const loadParticipants = async (eventId: string) => {
    try {
      const list = await fetchEventParticipants(eventId);
      setParticipants(list);
    } catch (err) {
      console.warn('Error fetching participants:', err);
    }
  };

  // Select Event to View Details
  const handleViewDetails = async (event: CommunityEvent) => {
    setSelectedEvent(event);
    setParticipants([]);
    setIsDetailOpen(true);
    await loadParticipants(event.eventId);
  };

  // Open Event Creation Modal
  const handleOpenCreate = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setError(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory(CATEGORIES[0]);
    setFormOrganizerType('user');
    setFormChurchId(userMemberships[0]?.churchId || '');
    setFormLocation('');
    setFormStartAt('');
    setFormEndAt('');
    setFormCapacity('');
    setFormVisibility('public');
    setFormStatus('published');
    setIsEditing(false);
    setIsCreateOpen(true);
  };

  // Open Event Editing
  const handleStartEdit = () => {
    if (!selectedEvent) return;
    setError(null);
    setFormTitle(selectedEvent.title);
    setFormDescription(selectedEvent.description);
    setFormCategory(selectedEvent.category);
    setFormOrganizerType(selectedEvent.organizerType);
    setFormChurchId(selectedEvent.churchId || '');
    setFormLocation(selectedEvent.location);
    
    // Format dates to ISO String slice for input (datetime-local expects YYYY-MM-DDTHH:MM)
    const startIso = selectedEvent.startAt ? selectedEvent.startAt.slice(0, 16) : '';
    const endIso = selectedEvent.endAt ? selectedEvent.endAt.slice(0, 16) : '';
    setFormStartAt(startIso);
    setFormEndAt(endIso);
    
    setFormCapacity(selectedEvent.capacity ? String(selectedEvent.capacity) : '');
    setFormVisibility(selectedEvent.visibility);
    setFormStatus(selectedEvent.status);
    setIsEditing(true);
  };

  // Submit Create or Edit Event Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formTitle.trim() || !formDescription.trim() || !formLocation.trim() || !formStartAt || !formEndAt) {
      setError(t.events.errorFillAll);
      return;
    }

    if (new Date(formStartAt) >= new Date(formEndAt)) {
      setError(t.events.errorDateOrder);
      return;
    }

    setSubmitting(true);
    setError(null);

    const selectedChurch = formOrganizerType === 'church' 
      ? userMemberships.find(m => m.churchId === formChurchId) 
      : null;

    const eventPayload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      organizerType: formOrganizerType,
      organizerId: user.uid,
      organizerName: profile?.displayName || user.displayName || (t.events.organizerPersonal),
      churchId: formOrganizerType === 'church' ? formChurchId : undefined,
      churchName: formOrganizerType === 'church' && selectedChurch ? selectedChurch.churchName : undefined,
      location: formLocation.trim(),
      startAt: new Date(formStartAt).toISOString(),
      endAt: new Date(formEndAt).toISOString(),
      capacity: formCapacity ? Number(formCapacity) : undefined,
      visibility: formVisibility,
      status: formStatus
    };

    try {
      if (isEditing && selectedEvent) {
        await updateEvent(selectedEvent.eventId, eventPayload, user.uid);
        // Refresh detail
        const updatedEvent = { ...selectedEvent, ...eventPayload } as CommunityEvent;
        setSelectedEvent(updatedEvent);
        setIsEditing(false);
      } else {
        await createEvent(eventPayload);
        setIsCreateOpen(false);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || (t.events.errorSaving));
    } finally {
      setSubmitting(false);
    }
  };

  // Register for Event
  const handleRegister = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!selectedEvent) return;
    setSubmitting(true);
    setError(null);
    try {
      await registerForEvent(
        selectedEvent.eventId,
        user.uid,
        profile?.displayName || user.displayName || (t.profile.member),
        user.email || ''
      );
      await loadParticipants(selectedEvent.eventId);
    } catch (err: any) {
      setError(err.message || (t.events.errorRegistration));
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Participation
  const handleCancelParticipation = async () => {
    if (!user || !selectedEvent) return;
    if (!window.confirm(t.events.confirmCancelParticipation)) return;
    setSubmitting(true);
    setError(null);
    try {
      await cancelEventParticipation(selectedEvent.eventId, user.uid);
      await loadParticipants(selectedEvent.eventId);
    } catch (err: any) {
      setError(err.message || (t.events.errorCancellation));
    } finally {
      setSubmitting(false);
    }
  };

  // Change Event Status (Cancel or Complete)
  const handleUpdateStatus = async (status: EventStatus) => {
    if (!user || !selectedEvent) return;
    const msg = status === 'cancelled' 
      ? t.events.confirmCancelEvent
      : t.events.confirmCompleteEvent;
    if (!window.confirm(msg)) return;

    setSubmitting(true);
    try {
      await updateEvent(selectedEvent.eventId, { status }, user.uid);
      setSelectedEvent({ ...selectedEvent, status });
      await loadData();
    } catch (err: any) {
      setError(err.message || (t.events.errorUpdateStatus));
    } finally {
      setSubmitting(false);
    }
  };

  // Filters Matching Logic
  const filteredEvents = events.filter(ev => {
    const matchesSearch = 
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.churchName && ev.churchName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedCategory || ev.category === selectedCategory;
    const matchesVisibility = !selectedVisibility || ev.visibility === selectedVisibility;

    // Visibility Access Control for listing
    let matchesAccess = true;
    if (ev.visibility === 'church' && ev.churchId) {
      // Must be logged in and member of the church, or the organizer
      const isMember = userMemberships.some(m => m.churchId === ev.churchId && m.status === 'approved');
      const isOrganizer = user && ev.organizerId === user.uid;
      matchesAccess = !!(isMember || isOrganizer);
    } else if (ev.visibility === 'private') {
      const isOrganizer = user && ev.organizerId === user.uid;
      const isChurchLeader = ev.churchId && userMemberships.some(m => m.churchId === ev.churchId && (m.role === 'OWNER' || m.role === 'ADMIN'));
      matchesAccess = !!(isOrganizer || isChurchLeader);
    }

    return matchesSearch && matchesCategory && matchesVisibility && matchesAccess;
  });

  // Check Registration Status
  const isRegistered = user && participants.some(p => p.userId === user.uid && p.status === 'registered');
  const activeRegisteredCount = participants.filter(p => p.status === 'registered').length;
  
  // Check organizer permission
  const isOrganizer = user && selectedEvent && (
    selectedEvent.organizerId === user.uid ||
    (selectedEvent.churchId && userMemberships.some(m => m.churchId === selectedEvent.churchId && (m.role === 'OWNER' || m.role === 'ADMIN')))
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="rounded-3xl bg-[#FFFFFF] dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[11px] font-semibold text-[#19344A] dark:text-[#FAF9F6]/70 mb-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
              <span>{t.events.badge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#19344A] dark:text-white tracking-tight">
              {t.events.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#19344A]/70 dark:text-[#FAF9F6]/70 mt-1 max-w-xl">
              {t.events.subtitle}
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#19344A] dark:bg-blue-600 text-[#FFFFFF] text-xs font-semibold hover:bg-[#111315] dark:hover:bg-[#67B7E8] transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t.events.createBtn}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.events.searchPlaceholder}
            className="w-full px-4 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-[#FAF9F6]/70 placeholder:text-[#19344A]/40 dark:placeholder:text-[#19344A] focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
          >
            <option value="">{t.events.allCategories}</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
          >
            <option value="">{t.events.allVisibilities}</option>
            <option value="public">{t.events.visibilityPublic}</option>
            <option value="church">{t.events.visibilityChurch}</option>
            <option value="private">{t.events.visibilityPrivate}</option>
          </select>
        </div>
      </div>

      {/* Main Listing Area */}
      {loading ? (
        <LoadingSpinner text={t.events.loading} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title={t.events.emptyTitle}
          description={t.events.emptySubtitle}
          actionLabel={t.events.createBtn}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredEvents.map(ev => {
            const isCompleted = ev.status === 'completed';
            const isCancelled = ev.status === 'cancelled';
            const isDraft = ev.status === 'draft';
            
            return (
              <div
                key={ev.eventId}
                onClick={() => handleViewDetails(ev)}
                className={`p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-[#19344A]/40 dark:hover:border-[#67B7E8]/40 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden ${isCancelled ? 'opacity-60' : ''}`}
              >
                {/* Upper row info */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[10px] font-bold text-[#19344A]/80 dark:text-[#FAF9F6]/70 uppercase">
                      {ev.category}
                    </span>

                    {/* Status Badge */}
                    {isCancelled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FDECEE] text-[#DC3545] border border-[#DC3545]/20 text-[10px] font-extrabold uppercase">
                        {t.events.statusCancelled}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAF7F0] text-[#22A06B] border border-[#22A06B]/20 text-[10px] font-extrabold uppercase">
                        {t.events.statusCompleted}
                      </span>
                    )}
                    {isDraft && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF4DD] text-[#F59E0B] border border-[#F59E0B]/20 text-[10px] font-extrabold uppercase">
                        {t.events.statusDraft}
                      </span>
                    )}
                    {!isCancelled && !isCompleted && !isDraft && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAF7F0] text-[#22A06B] border border-[#22A06B]/20 text-[10px] font-extrabold uppercase">
                        {t.events.statusOpen}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#19344A] dark:text-white tracking-tight line-clamp-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-[#19344A]/70 dark:text-[#FAF9F6]/70 line-clamp-2 mt-1 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                {/* Lower info */}
                <div className="mt-4 pt-3.5 border-t border-[#E8E4D9]/40 dark:border-[#67B7E8]/10 text-[11px] text-[#19344A]/60 dark:text-[#FAF9F6]/70 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                    <span>
                      {new Date(ev.startAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="truncate">{ev.location}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[10px] font-bold uppercase tracking-wider text-[#19344A]/40">
                    <span>{ev.churchName || ev.organizerName || (t.events.individual)}</span>
                    {ev.capacity && ev.capacity > 0 ? (
                      <span>{t.events.capacityLabel} {ev.capacity} {language === 'fr' ? 'places' : 'seats'}</span>
                    ) : (
                      <span>{t.events.fieldCapacityPlaceholder}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation & Edition Modal */}
      <Modal
        isOpen={isCreateOpen || isEditing}
        onClose={() => {
          setIsCreateOpen(false);
          setIsEditing(false);
        }}
        title={isEditing ? t.events.modalTitleEdit : t.events.modalTitleCreate}
        subtitle={t.events.modalSubtitle}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FAF9F6] dark:bg-[#19344A]/20 border border-[#19344A] dark:border-[#19344A] rounded-xl text-xs text-[#19344A] dark:text-[#FAF9F6]/70 font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldTitle}</label>
            <input
              type="text"
              required
              placeholder={t.events.fieldTitlePlaceholder}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-white placeholder:text-[#19344A]/40 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldCategory}</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldVisibility}</label>
              <select
                value={formVisibility}
                onChange={(e) => setFormVisibility(e.target.value as EventVisibility)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
              >
                <option value="public">{t.events.visibilityPublic}</option>
                <option value="church">{t.events.visibilityChurch}</option>
                <option value="private">{t.events.visibilityPrivate}</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-[#FAF9F6] dark:bg-[#1D334D]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/10 rounded-2xl space-y-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.events.organizerTitle}</span>
            
            <div className="flex gap-4 text-xs font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="organizerType"
                  checked={formOrganizerType === 'user'}
                  onChange={() => setFormOrganizerType('user')}
                  className="accent-[#19344A]"
                />
                {t.events.organizerPersonal}
              </label>

              {userMemberships.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="organizerType"
                    checked={formOrganizerType === 'church'}
                    onChange={() => setFormOrganizerType('church')}
                    className="accent-[#19344A]"
                  />
                  {t.events.organizerChurch}
                </label>
              )}
            </div>

            {formOrganizerType === 'church' && userMemberships.length > 0 && (
              <div className="mt-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.selectChurch}</label>
                <select
                  value={formChurchId}
                  onChange={(e) => setFormChurchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70"
                >
                  {userMemberships.map(m => (
                    <option key={m.churchId} value={m.churchId}>{m.churchName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldDesc}</label>
            <textarea
              required
              rows={4}
              placeholder={t.events.fieldDescPlaceholder}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-white placeholder:text-[#19344A]/40 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldLocation}</label>
            <input
              type="text"
              required
              placeholder={t.events.fieldLocationPlaceholder}
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-white placeholder:text-[#19344A]/40 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldStart}</label>
              <input
                type="datetime-local"
                required
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldEnd}</label>
              <input
                type="datetime-local"
                required
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldCapacity}</label>
              <input
                type="number"
                min="0"
                placeholder={t.events.fieldCapacityPlaceholder}
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-white focus:outline-none"
              />
            </div>

            {isEditing && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.events.fieldStatus}</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as EventStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                >
                  <option value="draft">{t.events.statusDraft}</option>
                  <option value="published">{t.events.statusOpen}</option>
                  <option value="cancelled">{t.events.statusCancelled}</option>
                  <option value="completed">{t.events.statusCompleted}</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditing(false);
              }}
              className="px-4 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs font-semibold text-[#19344A]/80 dark:text-[#FAF9F6]/70 hover:bg-[#FAF9F6] dark:hover:bg-#1D334D cursor-pointer"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#19344A] dark:bg-blue-600 text-white text-xs font-bold hover:bg-[#111315] dark:hover:bg-[#67B7E8] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (t.events.saving) : t.events.saveBtn}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details View Modal */}
      {selectedEvent && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedEvent.title}
          subtitle={`${t.events.detailsOrganizer} ${selectedEvent.churchName || selectedEvent.organizerName || (t.events.alloraMember)}`}
        >
          <div className="space-y-5 text-xs text-[#111315]">
            {error && (
              <div className="p-3 bg-[#FAF9F6] border border-[#19344A] rounded-xl text-[#19344A] font-semibold">
                {error}
              </div>
            )}

            {/* Event Header Status */}
            <div className="flex items-center justify-between p-3.5 bg-[#FAF9F6] dark:bg-[#1D334D]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl">
              <div>
                <span className="block text-[10px] font-bold text-[#19344A]/60 dark:text-[#FAF9F6]/70 uppercase">{t.events.fieldCategory}</span>
                <span className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedEvent.category}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-[#19344A]/60 dark:text-[#FAF9F6]/70 uppercase">{t.events.detailsParticipants}</span>
                <span className="text-xs font-bold text-[#19344A] dark:text-white">
                  {activeRegisteredCount}
                  {selectedEvent.capacity ? ` / ${selectedEvent.capacity}` : ` ${t.events.registered}`}
                </span>
              </div>
            </div>

            {/* Timings & Place */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white dark:bg-[#1D334D]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] dark:bg-#253C5A border border-[#E8E4D9] dark:border-slate-600 flex items-center justify-center text-[#19344A] dark:text-[#FAF9F6]/70 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#19344A]/40 dark:text-[#FAF9F6]/70 mb-0.5">{t.events.detailsDates}</span>
                  <span className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">
                    {t.events.detailsStart} {new Date(selectedEvent.startAt).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                  <span className="block text-[10px] text-[#19344A]/70 dark:text-[#FAF9F6]/70 mt-0.5">
                    {t.events.detailsEnd} {new Date(selectedEvent.endAt).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-[#1D334D]/50 border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] dark:bg-#253C5A border border-[#E8E4D9] dark:border-slate-600 flex items-center justify-center text-[#19344A] dark:text-[#FAF9F6]/70 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#19344A]/40 dark:text-[#FAF9F6]/70 mb-0.5">{t.events.detailsLocation}</span>
                  <span className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedEvent.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#19344A]/40 dark:text-[#FAF9F6]/70">{t.events.detailsAbout}</span>
              <p className="text-xs text-[#19344A]/80 dark:text-[#FAF9F6]/70 leading-relaxed bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-4 rounded-2xl border border-[#E8E4D9]/60 dark:border-[#67B7E8]/20 whitespace-pre-line">
                {selectedEvent.description}
              </p>
            </div>

            {/* Member Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E8E4D9]/50">
              {/* Join or Leave actions for ordinary members */}
              {!isOrganizer && selectedEvent.status === 'published' && (
                isRegistered ? (
                  <button
                    onClick={handleCancelParticipation}
                    disabled={submitting}
                    className="px-4 py-2 bg-[#FFF4DD] border border-[#F59E0B]/30 text-[#F59E0B] font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {t.events.unregisterBtn}
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={submitting || (selectedEvent.capacity ? activeRegisteredCount >= selectedEvent.capacity : false)}
                    className="px-5 py-2.5 bg-[#67B7E8] hover:opacity-90 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {selectedEvent.capacity && activeRegisteredCount >= selectedEvent.capacity 
                      ? t.events.fullCapacity 
                      : t.events.registerBtn}
                  </button>
                )
              )}

              {/* Organizer Actions Panel */}
              {isOrganizer && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleStartEdit}
                    className="px-3.5 py-2 border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[#19344A] dark:text-[#FAF9F6]/70 font-bold rounded-xl hover:bg-[#FAF9F6] transition-colors"
                  >
                    {t.events.editDetails}
                  </button>

                  {selectedEvent.status === 'published' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus('cancelled')}
                        className="px-3.5 py-2 bg-[#FDECEE] border border-[#DC3545]/20 text-[#DC3545] hover:bg-[#DC3545]/10 font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        {t.events.cancelEventBtn}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('completed')}
                        className="px-3.5 py-2 bg-[#22A06B] text-white hover:opacity-90 font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        {t.events.completeEventBtn}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Participant List (Visible to Organizer or Church Leaders for management) */}
            {isOrganizer && (
              <div className="space-y-2 pt-4 border-t border-[#E8E4D9]/40 dark:border-[#67B7E8]/10">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#19344A] dark:text-white">
                  {t.events.registeredMembers} ({activeRegisteredCount})
                </h4>
                {activeRegisteredCount === 0 ? (
                  <p className="text-[10px] text-[#19344A]/50 dark:text-[#FAF9F6]/70 italic">{t.events.noRegisteredMembers}</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                    {participants.filter(p => p.status === 'registered').map(p => (
                      <div key={p.participantId} className="flex items-center justify-between p-2 bg-[#FAF9F6] dark:bg-[#1D334D]/50 border border-[#E8E4D9]/40 dark:border-[#67B7E8]/10 rounded-xl text-[11px]">
                        <span className="font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">{p.displayName}</span>
                        <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{p.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
