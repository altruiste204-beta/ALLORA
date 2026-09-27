import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORIES, SUBCATEGORIES } from '../../constants/categories';
import { Need, Resource, NeedResponse, LocationDetails, NeedUrgency, NeedVisibility } from '../../types';
import { 
  fetchNeeds, 
  createNeed, 
  updateNeed, 
  deleteNeed, 
  fetchResources, 
  createNeedResponse, 
  fetchNeedResponses, 
  updateNeedResponseStatus 
} from '../../firebase/services/dataService';
import { findMatchingResourcesForNeed } from '../../utils/matching';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface NeedsViewProps {
  onOpenAuth: () => void;
}

export const NeedsView: React.FC<NeedsViewProps> = ({ onOpenAuth }) => {
  const { user, profile, memberships } = useAuth();
  const { t, language } = useLanguage();
  
  // Data State
  const [needs, setNeeds] = useState<Need[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState('');

  // Modals / Details State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [responses, setResponses] = useState<NeedResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Proposal State
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalQty, setProposalQty] = useState(1);
  const [selectedUserResourceId, setSelectedUserResourceId] = useState<string>('');
  const [proposalSuccess, setProposalSuccess] = useState(false);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<string>(CATEGORIES[0]);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newCountry, setNewCountry] = useState('France');
  const [newCity, setNewCity] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState('unités');
  const [newNeededFrom, setNewNeededFrom] = useState('');
  const [newNeededUntil, setNewNeededUntil] = useState('');
  const [newUrgency, setNewUrgency] = useState<NeedUrgency>('normal');
  const [newVisibility, setNewVisibility] = useState<NeedVisibility>('public');
  const [newChurchId, setNewChurchId] = useState<string>('');

  // Auto set subcategory list
  const subcategoryOptions = newCategory ? SUBCATEGORIES[newCategory as keyof typeof SUBCATEGORIES] || [] : [];
  useEffect(() => {
    if (subcategoryOptions.length > 0) {
      setNewSubcategory(subcategoryOptions[0]);
    } else {
      setNewSubcategory('');
    }
  }, [newCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nList, rList] = await Promise.all([
        fetchNeeds(),
        fetchResources()
      ]);
      setNeeds(nList);
      setResources(rList);
    } catch (err: any) {
      setError(err.message || (language === 'fr' ? 'Erreur lors du chargement des besoins.' : 'Error loading needs.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter approved churches the user belongs to
  const userChurches = memberships.filter(m => m.status === 'approved');

  // Handle Create Need
  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newTitle.trim() || !newDescription.trim() || !newCity.trim()) {
      setError(t.needs.formError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const location: LocationDetails = {
      country: newCountry,
      city: newCity,
      zone: newZone || (language === 'fr' ? 'Métropole' : 'Metropolis')
    };

    // Find church name if posted on behalf of church
    const selectedChurch = userChurches.find(c => c.churchId === newChurchId);

    try {
      await createNeed({
        createdBy: user.uid,
        authorName: profile?.displayName || user.displayName || (language === 'fr' ? 'Membre anonyme' : 'Anonymous Member'),
        churchId: newChurchId || undefined,
        churchName: selectedChurch?.churchName || undefined,
        title: newTitle,
        description: newDescription,
        category: newCategory,
        subcategory: newSubcategory,
        location,
        quantity: Number(newQuantity),
        unit: newUnit,
        neededFrom: newNeededFrom || new Date().toISOString().split('T')[0],
        neededUntil: newNeededUntil || undefined,
        urgency: newUrgency,
        visibility: newVisibility
      });

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewCity('');
      setNewZone('');
      setNewQuantity(1);
      setNewNeededFrom('');
      setNewNeededUntil('');
      setIsCreateOpen(false);
      
      // Reload lists
      await loadData();
    } catch (err: any) {
      setError(err.message || (language === 'fr' ? 'Erreur lors de la publication.' : 'Error during publishing.'));
    } finally {
      setSubmitting(false);
    }
  };

  // View Need Detail & load responses
  const handleViewNeed = async (need: Need) => {
    setSelectedNeed(need);
    setProposalMessage('');
    setProposalQty(1);
    setSelectedUserResourceId('');
    setProposalSuccess(false);
    setError(null);
    
    if (user && (need.createdBy === user.uid || userChurches.some(c => c.churchId === need.churchId))) {
      setLoadingResponses(true);
      try {
        const respList = await fetchNeedResponses(need.needId);
        setResponses(respList);
      } catch (err: any) {
        console.error('Error fetching responses:', err);
      } finally {
        setLoadingResponses(false);
      }
    }
  };

  // Submit proposal ("Je peux aider")
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedNeed) return;
    if (!proposalMessage.trim()) {
      setError(language === 'fr' ? 'Veuillez entrer un message de proposition.' : 'Please enter a proposal message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createNeedResponse(
        selectedNeed.needId,
        selectedNeed.createdBy,
        selectedNeed.title,
        user.uid,
        profile?.displayName || user.displayName || (language === 'fr' ? 'Un membre d\'ALLORA' : 'An ALLORA member'),
        proposalMessage,
        proposalQty,
        selectedUserResourceId || undefined
      );

      setProposalSuccess(true);
      setProposalMessage('');
      setProposalQty(1);
      setSelectedUserResourceId('');
    } catch (err: any) {
      setError(err.message || (language === 'fr' ? 'Erreur lors de la soumission de l\'aide.' : 'Error during help submission.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Manage Response Status (Accept / Reject)
  const handleUpdateResponseStatus = async (responseId: string, status: 'accepted' | 'rejected', qtyProposed: number, responderId: string, resId?: string) => {
    if (!selectedNeed) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateNeedResponseStatus(
        selectedNeed.needId,
        responseId,
        status,
        qtyProposed,
        responderId,
        resId
      );
      // Update Need Status dynamically if proposal accepted
      if (status === 'accepted') {
        const remainingQty = Math.max(0, selectedNeed.quantity - qtyProposed);
        const newStatus = remainingQty <= 0 ? 'fulfilled' : 'partially_fulfilled';
        await updateNeed(selectedNeed.needId, { status: newStatus });
        // Update selectedNeed state
        setSelectedNeed(prev => prev ? { ...prev, status: newStatus, quantity: remainingQty } : null);
      }
      
      // Reload responses
      const respList = await fetchNeedResponses(selectedNeed.needId);
      setResponses(respList);
      await loadData();
    } catch (err: any) {
      setError(err.message || (language === 'fr' ? 'Erreur lors de la mise à jour du statut.' : 'Error updating status.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items
  const filteredNeeds = needs.filter(need => {
    const matchesSearch = 
      need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      need.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      need.subcategory.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || need.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || need.subcategory === selectedSubcategory;
    const matchesUrgency = !selectedUrgency || need.urgency === selectedUrgency;
    const matchesCity = !selectedCity || need.location.city.toLowerCase().includes(selectedCity.toLowerCase());

    return matchesSearch && matchesCategory && matchesSubcategory && matchesUrgency && matchesCity;
  });

  // User's own available resources to propose
  const myResources = resources.filter(r => r.ownerId === user?.uid && r.status === 'available');

  // MVP Matching
  const matchingResources = selectedNeed ? findMatchingResourcesForNeed(selectedNeed, resources) : [];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#19344A] p-6 rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#111315] dark:text-white">{t.needs.title}</h2>
          <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 mt-1">{t.needs.subtitle}</p>
        </div>
        {user ? (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-[#67B7E8] text-white text-xs font-bold rounded-xl hover:opacity-90 cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t.needs.publishBtn}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-[#DCEFFA] dark:bg-[#19344A]/50 border border-[#67B7E8]/20 text-[#19344A] dark:text-[#DCEFFA] text-xs font-bold rounded-xl hover:bg-[#67B7E8]/20 cursor-pointer shrink-0"
          >
            {t.needs.loginToPublish}
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-[#FAF9F6] dark:bg-[#19344A]/40 border border-[#E8E4D9] dark:border-[#67B7E8]/10 grid grid-cols-1 md:grid-cols-4 gap-3 shadow-xs">
        <div className="relative">
          <input
            type="text"
            placeholder={t.needs.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#19344A]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#67B7E8] transition-colors"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-[#6F7B85] dark:text-[#FAF9F6]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory('');
          }}
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#19344A]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#67B7E8]"
        >
          <option value="">{t.needs.allCategories}</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
          disabled={!selectedCategory}
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#19344A]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-[#FAF9F6]/70 disabled:opacity-50 focus:outline-none focus:border-[#67B7E8]"
        >
          <option value="">{t.needs.allSubcategories}</option>
          {selectedCategory && SUBCATEGORIES[selectedCategory as keyof typeof SUBCATEGORIES]?.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        <select
          value={selectedUrgency}
          onChange={(e) => setSelectedUrgency(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#19344A]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#67B7E8]"
        >
          <option value="">{t.needs.allUrgencies}</option>
          <option value="low">{t.needs.urgencyLow}</option>
          <option value="normal">{t.needs.urgencyNormal}</option>
          <option value="high">{t.needs.urgencyHigh}</option>
          <option value="urgent">{t.needs.urgencyUrgent}</option>
        </select>
      </div>

      {/* Needs Listing */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="md" text={language === 'fr' ? "Récupération des besoins..." : "Retrieving needs..."} />
        </div>
      ) : filteredNeeds.length === 0 ? (
        <EmptyState
          title={t.needs.notFound}
          description={t.needs.notFoundSubtitle}
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNeeds.map((need) => {
            return (
              <div 
                key={need.needId}
                onClick={() => handleViewNeed(need)}
                className="p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 hover:border-[#67B7E8] dark:hover:border-[#67B7E8] transition-all duration-200 shadow-xs cursor-pointer flex flex-col justify-between h-48 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#67B7E8]">
                      {need.category} • {need.subcategory}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      need.urgency === 'urgent' 
                        ? 'bg-[#FDECEE] text-[#DC3545] border-[#DC3545]/20' 
                        : need.urgency === 'high' 
                        ? 'bg-[#FFF4DD] text-[#F59E0B] border-[#F59E0B]/20'
                        : need.urgency === 'normal'
                        ? 'bg-[#EAF6FD] text-[#67B7E8] border-[#67B7E8]/20'
                        : 'bg-[#FAF9F6] text-[#6F7B85] border-[#E8E4D9]'
                    }`}>
                      {need.urgency === 'urgent' ? t.needs.urgencyUrgent : need.urgency === 'high' ? t.needs.urgencyHigh : need.urgency === 'normal' ? t.needs.urgencyNormal : t.needs.urgencyLow}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-black text-[#111315] dark:text-white line-clamp-1 mb-1.5 group-hover:text-[#67B7E8] transition-colors">{need.title}</h3>
                  <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 line-clamp-2 leading-relaxed">{need.description}</p>
                </div>

                <div className="pt-3 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 flex items-center justify-between text-[11px] text-[#6F7B85] dark:text-[#FAF9F6]/70">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{need.location.city}</span>
                  </div>
                  <span className="font-semibold">{need.quantity} {need.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEED MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 dark:bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#19344A] rounded-3xl p-6 border border-[#E8E4D9] dark:border-[#67B7E8]/10 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FAF9F6] dark:border-[#67B7E8]/10">
              <h3 className="text-base font-black text-[#19344A] dark:text-white">{t.needs.modalTitle}</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#19344A]/50 dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-[#FAF9F6] dark:bg-[#19344A]/20 border border-[#19344A]/20 dark:border-[#19344A]/30 text-xs rounded-xl mb-4 text-[#19344A] dark:text-[#FAF9F6]/70">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateNeed} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldTitle}</label>
                <input
                  type="text"
                  required
                  placeholder={language === 'fr' ? "Ex: Prêt de 50 chaises de conférence" : "Ex: 50 conference chairs loan"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldDesc}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={t.needs.fieldDescPlaceholder}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldCategory}</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldSubcategory}</label>
                  <select
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  >
                    {subcategoryOptions.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldQuantity}</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldUnit}</label>
                  <input
                    type="text"
                    placeholder={language === 'fr' ? "Chaises, heures..." : "Chairs, hours..."}
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldUrgency}</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as NeedUrgency)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  >
                    <option value="low">{t.needs.urgencyLow}</option>
                    <option value="normal">{t.needs.urgencyNormal}</option>
                    <option value="high">{t.needs.urgencyHigh}</option>
                    <option value="urgent">{t.needs.urgencyUrgent}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldCountry}</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldCity}</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lyon"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldZone}</label>
                  <input
                    type="text"
                    placeholder="Ex: 69002"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldOnBehalfOf}</label>
                  <select
                    value={newChurchId}
                    onChange={(e) => setNewChurchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  >
                    <option value="">{t.needs.fieldPersonalProfile}</option>
                    {userChurches.map(ch => (
                      <option key={ch.churchId} value={ch.churchId}>{ch.churchName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldStartDate}</label>
                  <input
                    type="date"
                    value={newNeededFrom}
                    onChange={(e) => setNewNeededFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldEndDate}</label>
                  <input
                    type="date"
                    value={newNeededUntil}
                    onChange={(e) => setNewNeededUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.fieldVisibility}</label>
                <select
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value as NeedVisibility)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                >
                  <option value="public">{t.needs.visibilityPublic}</option>
                  <option value="church">{t.needs.visibilityChurch}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#19344A] dark:bg-blue-600 hover:bg-[#111315] dark:hover:bg-blue-700 text-[#FFFFFF] font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
              >
                {submitting ? t.needs.submitting : t.needs.submitBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEED DETAIL & RESPONSE MANAGEMENT MODAL */}
      {selectedNeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 dark:bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#19344A] rounded-3xl p-6 border border-[#E8E4D9] dark:border-[#67B7E8]/10 max-h-[90vh] overflow-y-auto shadow-xl space-y-6">
            
            {/* Header info */}
            <div className="flex items-start justify-between pb-4 border-b border-[#FAF9F6] dark:border-[#67B7E8]/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#67B7E8]">
                  {selectedNeed.category} • {selectedNeed.subcategory}
                </span>
                <h3 className="text-base font-black text-[#19344A] dark:text-white mt-1">{selectedNeed.title}</h3>
                <p className="text-[11px] text-[#19344A]/60 dark:text-[#FAF9F6]/70 mt-1 flex items-center gap-1">
                  <span>{language === 'fr' ? `Publié par ${selectedNeed.authorName}` : `Posted by ${selectedNeed.authorName}`}</span>
                  {selectedNeed.churchName && <span className="font-bold text-[#19344A] dark:text-[#67B7E8]">({selectedNeed.churchName})</span>}
                </p>
              </div>
              <button onClick={() => setSelectedNeed(null)} className="text-[#19344A]/50 dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-white cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Description & specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70">{t.needs.descTitle}</h4>
                <p className="text-xs text-[#19344A]/80 dark:text-[#FAF9F6]/70 leading-relaxed bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9]/45 dark:border-[#67B7E8]/20 whitespace-pre-wrap p-3.5 rounded-xl">
                  {selectedNeed.description}
                </p>
              </div>

              <div className="space-y-3 bg-[#FAF9F6] dark:bg-[#1D334D] p-4 rounded-xl border border-[#E8E4D9]/40 dark:border-[#67B7E8]/20 text-xs">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70">{t.needs.detailsTitle}</h4>
                <div className="space-y-2 text-[11px]">
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.needs.qtyRequested}</span>
                    <span className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedNeed.quantity} {selectedNeed.unit}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.needs.fieldUrgency}:</span>
                    <span className={`font-extrabold uppercase px-1.5 py-0.5 rounded text-[9px] border ${
                      selectedNeed.urgency === 'urgent' 
                        ? 'bg-[#FDECEE] text-[#DC3545] border-[#DC3545]/30' 
                        : selectedNeed.urgency === 'high' 
                        ? 'bg-[#FFF4DD] text-[#F59E0B] border-[#F59E0B]/30'
                        : selectedNeed.urgency === 'normal'
                        ? 'bg-[#EAF6FD] text-[#67B7E8] border-[#67B7E8]/30'
                        : 'bg-white text-[#6F7B85] border-[#E8E4D9]'
                    }`}>
                      {selectedNeed.urgency === 'urgent' ? t.needs.urgencyUrgent : selectedNeed.urgency === 'high' ? t.needs.urgencyHigh : selectedNeed.urgency === 'normal' ? t.needs.urgencyNormal : t.needs.urgencyLow}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.needs.fieldCity}:</span>
                    <span className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedNeed.location.city} ({selectedNeed.location.zone})</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.needs.availableFrom}</span>
                    <span className="font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedNeed.neededFrom}</span>
                  </p>
                  {selectedNeed.neededUntil && (
                    <p className="flex justify-between">
                      <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.needs.availableUntil}</span>
                      <span className="font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedNeed.neededUntil}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* IF OWNER: DISPLAY PROPOSALS */}
            {user && (selectedNeed.createdBy === user.uid || userChurches.some(c => c.churchId === selectedNeed.churchId)) ? (
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{t.needs.proposalsTitle} ({responses.length})</span>
                </h4>

                {loadingResponses ? (
                  <LoadingSpinner size="sm" text={language === 'fr' ? "Chargement des propositions..." : "Loading proposals..."} />
                ) : responses.length === 0 ? (
                  <div className="p-4 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9]/60 dark:border-[#67B7E8]/20 rounded-xl text-center text-xs text-[#19344A]/60 dark:text-[#FAF9F6]/70">
                    {t.needs.noProposals}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {responses.map(resp => (
                      <div key={resp.responseId} className="p-4 rounded-xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FFFFFF] dark:bg-[#1D334D]/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#19344A] dark:text-[#FAF9F6]/70">
                            {resp.responderName} <span className="text-[11px] font-normal text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.needs.proposes} {resp.quantityProposed} {selectedNeed.unit}</span>
                          </p>
                          <p className="text-[11px] text-[#19344A]/80 dark:text-[#FAF9F6]/70 italic">« {resp.message} »</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {resp.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleUpdateResponseStatus(resp.responseId, 'accepted', resp.quantityProposed, resp.responderId, resp.resourceId)}
                                disabled={submitting}
                                className="px-3 py-1.5 bg-[#22A06B] text-[#FFFFFF] text-[11px] font-bold rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
                              >
                                {t.needs.acceptBtn}
                              </button>
                              <button
                                onClick={() => handleUpdateResponseStatus(resp.responseId, 'rejected', resp.quantityProposed, resp.responderId)}
                                disabled={submitting}
                                className="px-3 py-1.5 border border-[#DC3545]/30 text-[#DC3545] bg-[#FDECEE] text-[11px] font-bold rounded-lg hover:bg-[#DC3545]/10 disabled:opacity-50 cursor-pointer"
                              >
                                {t.needs.declineBtn}
                              </button>
                            </>
                          ) : (
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-md border ${
                              resp.status === 'accepted' 
                                ? 'bg-[#EAF7F0] text-[#22A06B] border-[#22A06B]/30' 
                                : resp.status === 'rejected' 
                                ? 'bg-[#FDECEE] text-[#DC3545] border-[#DC3545]/30' 
                                : 'bg-[#FAF9F6] text-[#6F7B85] border-[#E8E4D9]'
                            }`}>
                              {resp.status === 'accepted' ? t.needs.statusAccepted : resp.status === 'rejected' ? t.needs.statusRejected : t.needs.statusWithdrawn}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* IF NOT OWNER: MATCHING RESOURCES & PROPOSAL FORM */
              <div className="space-y-4">
                {/* MVP Matches */}
                {matchingResources.length > 0 && (
                  <div className="p-4 bg-[#67B7E8]/10 dark:bg-blue-900/20 border border-[#67B7E8]/40 dark:border-blue-700/30 rounded-2xl space-y-2">
                    <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A] dark:text-[#DCEFFA] flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>{t.needs.matchingTitle} ({matchingResources.length})</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {matchingResources.map(res => (
                        <div key={res.resourceId} className="p-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1D334D] border border-[#E8E4D9]/40 dark:border-[#67B7E8]/20">
                          <p className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{res.title}</p>
                          <p className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{language === 'fr' ? 'Dispo:' : 'Avail:'} {res.quantity} {res.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Je peux aider */}
                <div className="p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#1D334D] space-y-3">
                  <h4 className="text-xs font-bold text-[#19344A] dark:text-white">{t.needs.helpSectionTitle}</h4>
                  
                  {proposalSuccess ? (
                    <div className="p-3 bg-[#FFFFFF] dark:bg-blue-900/30 border border-[#19344A]/20 dark:border-blue-500/30 rounded-xl text-center text-xs text-[#19344A] dark:text-[#67B7E8]">
                      {t.needs.helpSuccess}
                    </div>
                  ) : user ? (
                    <form onSubmit={handleSubmitProposal} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.helpMessageLabel}</label>
                        <textarea
                          required
                          rows={2}
                          placeholder={t.needs.helpMessagePlaceholder}
                          value={proposalMessage}
                          onChange={(e) => setProposalMessage(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-sm text-[#19344A] dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.helpQtyLabel}</label>
                          <input
                            type="number"
                            min="1"
                            value={proposalQty}
                            onChange={(e) => setProposalQty(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.needs.helpResourceLabel}</label>
                          <select
                            value={selectedUserResourceId}
                            onChange={(e) => setSelectedUserResourceId(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-white"
                          >
                            <option value="">{t.needs.helpResourcePlaceholder}</option>
                            {myResources.map(res => (
                              <option key={res.resourceId} value={res.resourceId}>{res.title} ({language === 'fr' ? 'Dispo:' : 'Avail:'} {res.quantity} {res.unit})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2 bg-[#19344A] dark:bg-blue-600 hover:bg-[#111315] dark:hover:bg-blue-700 text-[#FFFFFF] font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? t.needs.sending : t.needs.sendProposalBtn}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center p-3.5 bg-[#FFFFFF] dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/20 rounded-xl text-xs">
                      <p className="text-[#19344A]/70 dark:text-[#FAF9F6]/70 mb-2">{t.needs.loginToHelp}</p>
                      <button
                        onClick={() => {
                          setSelectedNeed(null);
                          onOpenAuth();
                        }}
                        className="px-4 py-1.5 bg-[#19344A] dark:bg-blue-600 text-[#FFFFFF] text-[11px] font-bold rounded-lg hover:bg-[#111315] dark:hover:bg-blue-700"
                      >
                        {t.actions.signIn}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

