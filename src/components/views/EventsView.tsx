import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
} from '../../firebase/services/dataService';
import { CommunityEvent, EventParticipant, ChurchMember, EventVisibility, EventStatus, OrganizerType } from '../../types';

interface EventsViewProps {
  onOpenAuth: () => void;
  onOpenActionSheet: () => void;
}

const CATEGORIES = [
  'Conférence',
  'Séminaire',
  'Formation',
  'Culte spécial',
  'Concert',
  'Rencontre',
  'Activité communautaire'
];

export const EventsView: React.FC<EventsViewProps> = ({ onOpenAuth }) => {
  const { user, profile } = useAuth();
  
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
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (new Date(formStartAt) >= new Date(formEndAt)) {
      setError('La date de début doit être antérieure à la date de fin.');
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
      organizerName: profile?.displayName || user.displayName || 'Organisateur',
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
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde.');
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
        profile?.displayName || user.displayName || 'Participant ALLORA',
        user.email || ''
      );
      await loadParticipants(selectedEvent.eventId);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Participation
  const handleCancelParticipation = async () => {
    if (!user || !selectedEvent) return;
    if (!window.confirm('Voulez-vous vraiment annuler votre participation ?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await cancelEventParticipation(selectedEvent.eventId, user.uid);
      await loadParticipants(selectedEvent.eventId);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Change Event Status (Cancel or Complete)
  const handleUpdateStatus = async (status: EventStatus) => {
    if (!user || !selectedEvent) return;
    const msg = status === 'cancelled' 
      ? 'Voulez-vous vraiment annuler cet événement ? Une notification sera envoyée aux participants.'
      : 'Voulez-vous marquer cet événement comme terminé ?';
    if (!window.confirm(msg)) return;

    setSubmitting(true);
    try {
      await updateEvent(selectedEvent.eventId, { status }, user.uid);
      setSelectedEvent({ ...selectedEvent, status });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du statut.');
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
      <div className="rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E8E4D9] text-[11px] font-semibold text-[#19344A] mb-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
              <span>Rencontres, cultes & conférences</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#19344A] tracking-tight">
              Événements & Activités
            </h1>
            <p className="text-xs sm:text-sm text-[#19344A]/70 mt-1 max-w-xl">
              Trouvez, rejoignez et collaborez autour d'activités chrétiennes locales et inter-églises.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#19344A] text-[#FFFFFF] text-xs font-semibold hover:bg-[#111315] transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Créer un événement</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, lieu, église..."
            className="w-full px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#111315] placeholder:text-[#19344A]/40 focus:outline-none focus:border-[#19344A]"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A] focus:outline-none focus:border-[#19344A]"
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A] focus:outline-none focus:border-[#19344A]"
          >
            <option value="">Toutes les visibilités</option>
            <option value="public">Public</option>
            <option value="church">Église interne</option>
            <option value="private">Privé</option>
          </select>
        </div>
      </div>

      {/* Main Listing Area */}
      {loading ? (
        <LoadingSpinner text="Chargement de vos événements..." />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="Aucun événement ne correspond à vos critères."
          description="Soyez le premier à proposer un événement, une conférence ou un culte spécial pour la communauté !"
          actionLabel="Créer un événement"
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
                className={`p-5 rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] shadow-xs hover:border-[#19344A]/40 transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden ${isCancelled ? 'opacity-60' : ''}`}
              >
                {/* Upper row info */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E8E4D9] text-[10px] font-bold text-[#19344A]/80 uppercase">
                      {ev.category}
                    </span>

                    {/* Status Badge */}
                    {isCancelled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-extrabold text-red-700 uppercase">
                        Annulé
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-extrabold text-gray-500 uppercase">
                        Terminé
                      </span>
                    )}
                    {isDraft && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-extrabold text-amber-700 uppercase">
                        Brouillon
                      </span>
                    )}
                    {!isCancelled && !isCompleted && !isDraft && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700 uppercase">
                        Ouvert
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#19344A] tracking-tight line-clamp-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-[#19344A]/70 line-clamp-2 mt-1 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                {/* Lower info */}
                <div className="mt-4 pt-3.5 border-t border-[#E8E4D9]/40 text-[11px] text-[#19344A]/60 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                    <span>
                      {new Date(ev.startAt).toLocaleDateString('fr-FR', {
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
                    <span>{ev.churchName || ev.organizerName || 'Individuel'}</span>
                    {ev.capacity && ev.capacity > 0 ? (
                      <span>Capacité : {ev.capacity} places</span>
                    ) : (
                      <span>Places illimitées</span>
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
        title={isEditing ? 'Modifier l\'événement' : 'Créer un événement'}
        subtitle="Renseignez les détails pour publier l'événement"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Titre de l'événement *</label>
            <input
              type="text"
              required
              placeholder="Ex : Conférence inter-églises sur l'entraide"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#111315] focus:outline-none focus:border-[#19344A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Catégorie *</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A] focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Visibilité *</label>
              <select
                value={formVisibility}
                onChange={(e) => setFormVisibility(e.target.value as EventVisibility)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A] focus:outline-none"
              >
                <option value="public">Public (Tout le monde)</option>
                <option value="church">Membres d'église uniquement</option>
                <option value="private">Privé (Organisateurs uniquement)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-[#FAF9F6] border border-[#E8E4D9] rounded-2xl space-y-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#19344A]/60">Organisateur & Entité</span>
            
            <div className="flex gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="organizerType"
                  checked={formOrganizerType === 'user'}
                  onChange={() => setFormOrganizerType('user')}
                  className="accent-[#19344A]"
                />
                En mon nom personnel
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
                  Au nom d'une église que je dirige
                </label>
              )}
            </div>

            {formOrganizerType === 'church' && userMemberships.length > 0 && (
              <div className="mt-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Sélectionner l'église *</label>
                <select
                  value={formChurchId}
                  onChange={(e) => setFormChurchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E4D9] text-xs text-[#19344A]"
                >
                  {userMemberships.map(m => (
                    <option key={m.churchId} value={m.churchId}>{m.churchName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Description détaillée *</label>
            <textarea
              required
              rows={4}
              placeholder="Expliquez l'objectif de l'activité, le programme, qui peut venir..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#111315] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Lieu de l'événement *</label>
            <input
              type="text"
              required
              placeholder="Ex : Église centrale ou adresse complète, Salle de réunion..."
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#111315] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Début *</label>
              <input
                type="datetime-local"
                required
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#111315] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Fin *</label>
              <input
                type="datetime-local"
                required
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#111315] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Capacité max. (optionnel)</label>
              <input
                type="number"
                min="0"
                placeholder="Laissez vide si illimité"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#111315] focus:outline-none"
              />
            </div>

            {isEditing && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Statut *</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as EventStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A] focus:outline-none"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié / Ouvert</option>
                  <option value="cancelled">Annulé</option>
                  <option value="completed">Terminé</option>
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
              className="px-4 py-2 rounded-xl border border-[#E8E4D9] text-xs font-semibold text-[#19344A]/80 hover:bg-[#FAF9F6] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#19344A] text-white text-xs font-bold hover:bg-[#111315] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
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
          subtitle={`Activité organisée par ${selectedEvent.churchName || selectedEvent.organizerName || 'un membre ALLORA'}`}
        >
          <div className="space-y-5 text-xs text-[#111315]">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 font-semibold">
                {error}
              </div>
            )}

            {/* Event Header Status */}
            <div className="flex items-center justify-between p-3.5 bg-[#FAF9F6] border border-[#E8E4D9] rounded-2xl">
              <div>
                <span className="block text-[10px] font-bold text-[#19344A]/60 uppercase">Catégorie</span>
                <span className="text-xs font-bold text-[#19344A]">{selectedEvent.category}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-[#19344A]/60 uppercase">Participants</span>
                <span className="text-xs font-bold text-[#19344A]">
                  {activeRegisteredCount}
                  {selectedEvent.capacity ? ` / ${selectedEvent.capacity}` : ' inscrits'}
                </span>
              </div>
            </div>

            {/* Timings & Place */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white border border-[#E8E4D9] rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#E8E4D9] flex items-center justify-center text-[#19344A] shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#19344A]/40 mb-0.5">Dates et horaires</span>
                  <span className="font-bold text-[#19344A]">
                    Début : {new Date(selectedEvent.startAt).toLocaleString('fr-FR')}
                  </span>
                  <span className="block text-[10px] text-[#19344A]/70 mt-0.5">
                    Fin : {new Date(selectedEvent.endAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-[#E8E4D9] rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#E8E4D9] flex items-center justify-center text-[#19344A] shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#19344A]/40 mb-0.5">Lieu / Salle</span>
                  <span className="font-bold text-[#19344A]">{selectedEvent.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#19344A]/40">Présentation</span>
              <p className="text-xs text-[#19344A]/80 leading-relaxed bg-[#FAF9F6] p-4 rounded-2xl border border-[#E8E4D9]/60 whitespace-pre-line">
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
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    Annuler ma participation
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={submitting || (selectedEvent.capacity ? activeRegisteredCount >= selectedEvent.capacity : false)}
                    className="px-5 py-2.5 bg-[#19344A] hover:bg-[#111315] text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {selectedEvent.capacity && activeRegisteredCount >= selectedEvent.capacity 
                      ? 'Capacité maximale atteinte' 
                      : 'Participer à cet événement'}
                  </button>
                )
              )}

              {/* Organizer Actions Panel */}
              {isOrganizer && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleStartEdit}
                    className="px-3.5 py-2 border border-[#E8E4D9] text-[#19344A] font-bold rounded-xl hover:bg-[#FAF9F6] cursor-pointer"
                  >
                    Modifier les détails
                  </button>

                  {selectedEvent.status === 'published' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus('cancelled')}
                        className="px-3.5 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-xl cursor-pointer"
                      >
                        Annuler l'événement
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('completed')}
                        className="px-3.5 py-2 bg-[#19344A] text-white hover:bg-[#111315] font-bold rounded-xl cursor-pointer"
                      >
                        Marquer comme terminé
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Participant List (Visible to Organizer or Church Leaders for management) */}
            {isOrganizer && (
              <div className="space-y-2 pt-4 border-t border-[#E8E4D9]/40">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#19344A]">
                  Membres inscrits ({activeRegisteredCount})
                </h4>
                {activeRegisteredCount === 0 ? (
                  <p className="text-[10px] text-[#19344A]/50 italic">Aucun membre inscrit pour le moment.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                    {participants.filter(p => p.status === 'registered').map(p => (
                      <div key={p.participantId} className="flex items-center justify-between p-2 bg-[#FAF9F6] border border-[#E8E4D9]/40 rounded-xl text-[11px]">
                        <span className="font-semibold text-[#19344A]">{p.displayName}</span>
                        <span className="text-[#19344A]/60">{p.email}</span>
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
