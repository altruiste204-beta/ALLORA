import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORIES, SUBCATEGORIES } from '../../constants/categories';
import { Need, Resource, LocationDetails, ResourceStatus, ResourceType, ResourceOwnerType } from '../../types';
import { 
  fetchNeeds, 
  fetchResources, 
  createResource, 
  updateResource, 
  deleteResource,
  createNeedResponse
} from '../../supabase/services/dataService';
import { findMatchingNeedsForResource } from '../../utils/matching';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface ResourcesViewProps {
  onOpenAuth: () => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ onOpenAuth }) => {
  const { user, profile, memberships } = useAuth();
  const { t, language } = useLanguage();

  // Data State
  const [resources, setResources] = useState<Resource[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proposal State for compatible needs
  const [proposingForNeedId, setProposingForNeedId] = useState<string | null>(null);
  const [collabProposalMessage, setCollabProposalMessage] = useState('');
  const [collabProposalQty, setCollabProposalQty] = useState(1);
  const [collabSuccess, setCollabSuccess] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState('');

  // Modals / Details State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<string>(CATEGORIES[0]);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newType, setNewType] = useState<ResourceType>('loan');
  const [newCountry, setNewCountry] = useState('France');
  const [newCity, setNewCity] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState('unités');
  const [newAvailableFrom, setNewAvailableFrom] = useState('');
  const [newAvailableUntil, setNewAvailableUntil] = useState('');
  const [newOwnerType, setNewOwnerType] = useState<ResourceOwnerType>('user');
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
      const [rList, nList] = await Promise.all([
        fetchResources(),
        fetchNeeds()
      ]);
      setResources(rList);
      setNeeds(nList);
    } catch (err: any) {
      setError(err.message || t.resources.formError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter approved churches the user belongs to
  const userChurches = memberships.filter(m => m.status === 'approved');

  // Handle Create Resource
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newTitle.trim() || !newDescription.trim() || !newCity.trim()) {
      setError(t.resources.formError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const location: LocationDetails = {
      country: newCountry,
      city: newCity,
      zone: newZone || 'Métropole'
    };

    const selectedChurch = userChurches.find(c => c.churchId === newChurchId);

    try {
      await createResource({
        ownerId: user.uid,
        ownerName: profile?.displayName || user.displayName || 'Membre anonyme',
        ownerType: newOwnerType,
        churchId: newOwnerType === 'church' && newChurchId ? newChurchId : undefined,
        churchName: newOwnerType === 'church' && selectedChurch ? selectedChurch.churchName : undefined,
        title: newTitle,
        description: newDescription,
        category: newCategory,
        subcategory: newSubcategory,
        type: newType,
        location,
        quantity: Number(newQuantity),
        unit: newUnit,
        availableFrom: newAvailableFrom || new Date().toISOString().split('T')[0],
        availableUntil: newAvailableUntil || undefined
      });

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewCity('');
      setNewZone('');
      setNewQuantity(1);
      setNewAvailableFrom('');
      setNewAvailableUntil('');
      setIsCreateOpen(false);

      // Reload
      await loadData();
    } catch (err: any) {
      setError(err.message || t.resources.submitting);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Resource
  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm(t.resources.deleteConfirm)) return;
    setSubmitting(true);
    try {
      await deleteResource(resourceId);
      setSelectedResource(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || t.resources.formError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposeResource = async (need: Need) => {
    if (!user || !selectedResource) return;
    if (!collabProposalMessage.trim()) {
      setError(t.resources.matchMessagePlaceholder);
      return;
    }
    setSubmitting(true);
    setError(null);
    setCollabSuccess(null);
    try {
      await createNeedResponse(
        need.needId,
        need.createdBy,
        need.title,
        user.uid,
        profile?.displayName || user.displayName || 'Un membre d\'ALLORA',
        collabProposalMessage,
        Number(collabProposalQty),
        selectedResource.resourceId
      );
      setCollabSuccess(`${t.resources.matchSuccess} "${need.title}" !`);
      setProposingForNeedId(null);
      setCollabProposalMessage('');
    } catch (err: any) {
      setError(err.message || t.resources.formError);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items
  const filteredResources = resources.filter(res => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.subcategory.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || res.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || res.subcategory === selectedSubcategory;
    const matchesType = !selectedType || res.type === selectedType;
    const matchesCity = !selectedCity || res.location.city.toLowerCase().includes(selectedCity.toLowerCase());

    return matchesSearch && matchesCategory && matchesSubcategory && matchesType && matchesCity;
  });

  // MVP Matching
  const matchingNeeds = selectedResource ? findMatchingNeedsForResource(selectedResource, needs) : [];

  const typeLabels: Record<ResourceType, string> = {
    loan: t.resources.typeLoan,
    donation: t.resources.typeDonation,
    service: t.resources.typeService,
    volunteer: t.resources.typeVolunteer
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#19344A] p-6 rounded-3xl border border-[#E8E4D9] dark:border-[#67B7E8]/10 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-[#111315] dark:text-white">{t.resources.title}</h2>
          <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 mt-1">{t.resources.subtitle}</p>
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
            <span>{t.resources.proposeBtn}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-[#DCEFFA] dark:bg-[#19344A]/50 border border-[#67B7E8]/20 text-[#19344A] dark:text-[#DCEFFA] text-xs font-bold rounded-xl hover:bg-[#67B7E8]/20 cursor-pointer shrink-0"
          >
            {t.resources.loginToPropose}
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-[#FAF9F6] dark:bg-[#19344A]/40 border border-[#E8E4D9] dark:border-[#67B7E8]/10 grid grid-cols-1 md:grid-cols-4 gap-3 shadow-xs">
        <div className="relative">
          <input
            type="text"
            placeholder={t.resources.searchPlaceholder}
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
          <option value="">{t.resources.allCategories}</option>
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
          <option value="">{t.resources.allSubcategories}</option>
          {selectedCategory && SUBCATEGORIES[selectedCategory as keyof typeof SUBCATEGORIES]?.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#19344A]/60 border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#111315] dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#67B7E8]"
        >
          <option value="">{t.resources.allOfferTypes}</option>
          <option value="loan">{t.resources.typeLoan}</option>
          <option value="donation">{t.resources.typeDonation}</option>
          <option value="service">{t.resources.typeService}</option>
          <option value="volunteer">{t.resources.typeVolunteer}</option>
        </select>
      </div>

      {/* Resources Listing */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="md" text={t.resources.loading} />
        </div>
      ) : filteredResources.length === 0 ? (
        <EmptyState
          title={t.resources.emptyTitle}
          description={t.resources.emptySubtitle}
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.67l7.65-7.66.77-.78a5.4 5.4 0 0 0 0-7.65z" />
            </svg>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => (
            <div 
              key={res.resourceId}
              onClick={() => setSelectedResource(res)}
              className="p-5 rounded-3xl bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 hover:border-[#67B7E8] dark:hover:border-[#67B7E8] transition-all duration-200 shadow-xs cursor-pointer flex flex-col justify-between h-48 group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#67B7E8]">
                    {res.category} • {res.subcategory}
                  </span>
                  <span className={`text-[10px] font-bold border border-[#E8E4D9] dark:border-[#67B7E8]/20 bg-[#FAF9F6] dark:bg-[#1D334D] text-[#111315] dark:text-[#FAF9F6]/70 px-2 py-0.5 rounded-full uppercase ${
                    res.status === 'available' ? 'border-[#22A06B]/20 bg-[#EAF7F0] text-[#22A06B]' : ''
                  }`}>
                    {typeLabels[res.type]} • {res.status === 'available' ? (language === 'fr' ? 'Disponible' : 'Available') : res.status}
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-[#111315] dark:text-white line-clamp-1 mb-1.5 group-hover:text-[#67B7E8] transition-colors">{res.title}</h3>
                <p className="text-xs text-[#6F7B85] dark:text-[#FAF9F6]/70 line-clamp-2 leading-relaxed">{res.description}</p>
              </div>

              <div className="pt-3 border-t border-[#E8E4D9] dark:border-[#67B7E8]/10 flex items-center justify-between text-[11px] text-[#6F7B85] dark:text-[#FAF9F6]/70">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{res.location.city}</span>
                </div>
                <span className="font-semibold">{res.quantity} {res.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE RESOURCE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 dark:bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#19344A] rounded-3xl p-6 border border-[#E8E4D9] dark:border-[#67B7E8]/10 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FAF9F6] dark:border-[#67B7E8]/10">
              <h3 className="text-base font-black text-[#19344A] dark:text-white">{t.resources.modalTitle}</h3>
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

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.resources.fieldTitle}</label>
                <input
                  type="text"
                  required
                  placeholder={t.resources.fieldTitlePlaceholder}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.resources.fieldDesc}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={t.resources.fieldDescPlaceholder}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-[#FAF9F6] placeholder:text-[#19344A]/40 dark:placeholder:text-[#FAF9F6]/30 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.resources.fieldCategory}</label>
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.resources.fieldSubcategory}</label>
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

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.resources.fieldType}</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  >
                    <option value="loan">{t.resources.typeLoan}</option>
                    <option value="donation">{t.resources.typeDonation}</option>
                    <option value="service">{t.resources.typeService}</option>
                    <option value="volunteer">{t.resources.typeVolunteer}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldQuantity}</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldUnit}</label>
                  <input
                    type="text"
                    placeholder={t.resources.fieldUnitPlaceholder}
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldCountry}</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldCity}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.resources.fieldCityPlaceholder}
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldZone}</label>
                  <input
                    type="text"
                    placeholder={t.resources.fieldZonePlaceholder}
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldOwner}</label>
                  <select
                    value={newOwnerType}
                    onChange={(e) => setNewOwnerType(e.target.value as ResourceOwnerType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  >
                    <option value="user">{t.resources.ownerPersonal}</option>
                    {userChurches.length > 0 && <option value="church">{t.resources.ownerChurch}</option>}
                  </select>
                </div>
              </div>

              {newOwnerType === 'church' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldSelectChurch}</label>
                  <select
                    required
                    value={newChurchId}
                    onChange={(e) => setNewChurchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  >
                    <option value="">{t.resources.fieldSelectChurchPlaceholder}</option>
                    {userChurches.map(ch => (
                      <option key={ch.churchId} value={ch.churchId}>{ch.churchName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldAvailableFrom}</label>
                  <input
                    type="date"
                    value={newAvailableFrom}
                    onChange={(e) => setNewAvailableFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">{t.resources.fieldAvailableUntilOptional}</label>
                  <input
                    type="date"
                    value={newAvailableUntil}
                    onChange={(e) => setNewAvailableUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-[#FAF9F6]/70 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#19344A] dark:bg-blue-600 hover:bg-[#111315] dark:hover:bg-blue-700 text-[#FFFFFF] font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
              >
                {submitting ? t.resources.submitting : t.resources.submitBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESOURCE DETAIL MODAL */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 dark:bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-[#19344A] rounded-3xl p-6 border border-[#E8E4D9] dark:border-[#67B7E8]/10 max-h-[90vh] overflow-y-auto shadow-xl space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#FAF9F6] dark:border-[#67B7E8]/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#67B7E8]">
                  {selectedResource.category} • {selectedResource.subcategory}
                </span>
                <h3 className="text-base font-black text-[#19344A] dark:text-white mt-1">{selectedResource.title}</h3>
                <p className="text-[11px] text-[#19344A]/60 dark:text-[#FAF9F6]/70 mt-1">
                  {t.resources.specsOwner} {selectedResource.ownerName} {selectedResource.churchName && <span className="font-bold text-[#19344A] dark:text-white">({selectedResource.churchName})</span>}
                </p>
              </div>
              <button onClick={() => setSelectedResource(null)} className="text-[#19344A]/50 dark:text-[#FAF9F6]/70 hover:text-[#19344A] dark:hover:text-white cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70">{t.resources.detailsDesc}</h4>
                <p className="text-xs text-[#19344A]/80 dark:text-[#FAF9F6]/70 leading-relaxed bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-3.5 rounded-xl border border-[#E8E4D9]/45 dark:border-[#67B7E8]/10 whitespace-pre-wrap">
                  {selectedResource.description}
                </p>
              </div>

              <div className="space-y-3 bg-[#FAF9F6] dark:bg-[#1D334D]/50 p-4 rounded-xl border border-[#E8E4D9]/40 dark:border-[#67B7E8]/10 text-xs">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70">{t.resources.detailsSpecs}</h4>
                <div className="space-y-2 text-[11px]">
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.resources.specsType}</span>
                    <span className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{typeLabels[selectedResource.type]}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.resources.specsQty}</span>
                    <span className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedResource.quantity} {selectedResource.unit}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.resources.specsCity}</span>
                    <span className="font-bold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedResource.location.city}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.resources.specsFrom}</span>
                    <span className="font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedResource.availableFrom}</span>
                  </p>
                  {selectedResource.availableUntil && (
                    <p className="flex justify-between">
                      <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.resources.specsUntil}</span>
                      <span className="font-semibold text-[#19344A] dark:text-[#FAF9F6]/70">{selectedResource.availableUntil}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60 dark:text-[#FAF9F6]/70">{t.resources.specsStatus}</span>
                    <span className={`font-extrabold uppercase px-1.5 py-0.5 rounded text-[9px] border ${
                      selectedResource.status === 'available' 
                        ? 'bg-[#EAF7F0] text-[#22A06B] border-[#22A06B]/30' 
                        : selectedResource.status === 'unavailable' 
                        ? 'bg-[#FAF9F6] text-[#6F7B85] border-[#E8E4D9]' 
                        : 'bg-[#FFF4DD] text-[#F59E0B] border-[#F59E0B]/30'
                    }`}>
                      {selectedResource.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* MVP Matching Needs */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A] dark:text-white flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{t.resources.matchingTitle} ({matchingNeeds.length})</span>
              </h4>

              {collabSuccess && (
                <div className="p-3 bg-[#EAF7F0] dark:bg-[#22A06B]/10 border border-[#22A06B]/30 rounded-xl text-xs text-[#22A06B] font-medium">
                  {collabSuccess}
                </div>
              )}

              {matchingNeeds.length === 0 ? (
                <div className="p-4 bg-[#FAF9F6] dark:bg-[#1D334D]/50 border border-[#E8E4D9]/60 dark:border-[#67B7E8]/10 rounded-xl text-center text-xs text-[#19344A]/60 dark:text-[#FAF9F6]/70">
                  {t.resources.matchEmpty}
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingNeeds.map(need => (
                    <div key={need.needId} className="p-4 bg-[#67B7E8]/5 dark:bg-[#67B7E8]/5 border border-[#67B7E8]/20 dark:border-[#67B7E8]/20 rounded-2xl space-y-3 text-xs">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-bold text-[#19344A] dark:text-white">{need.title}</p>
                          <p className="text-[#19344A]/70 dark:text-[#FAF9F6]/70 line-clamp-2 mt-1">{need.description}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-[10px] font-bold text-[#19344A] dark:text-[#FAF9F6]/70 shrink-0 rounded-lg">
                          {need.quantity} {need.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#19344A]/50 dark:text-[#FAF9F6]/70 border-t border-[#E8E4D9]/20 dark:border-[#67B7E8]/10 pt-2">
                        <span>{t.resources.matchRegion} {need.location.city}</span>
                        {user && selectedResource.ownerId === user.uid && selectedResource.status === 'available' && (
                          proposingForNeedId === need.needId ? (
                            <button
                              onClick={() => setProposingForNeedId(null)}
                              className="text-[#19344A] dark:text-[#FAF9F6]/70 hover:underline font-bold shrink-0 cursor-pointer"
                            >
                              {t.resources.matchCancel}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setProposingForNeedId(need.needId);
                                setCollabProposalQty(Math.min(selectedResource.quantity, need.quantity));
                              }}
                              className="text-[#67B7E8] dark:text-[#67B7E8] hover:text-[#19344A] dark:hover:text-blue-300 font-bold shrink-0 cursor-pointer"
                            >
                              {t.resources.matchProposeBtn}
                            </button>
                          )
                        )}
                      </div>

                      {proposingForNeedId === need.needId && (
                        <div className="p-3 bg-white dark:bg-[#19344A] border border-[#E8E4D9] dark:border-[#67B7E8]/10 rounded-xl space-y-3 mt-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.resources.matchMessageLabel}</label>
                            <textarea
                              rows={2}
                              required
                              placeholder={t.resources.matchMessagePlaceholder}
                              value={collabProposalMessage}
                              onChange={(e) => setCollabProposalMessage(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs dark:text-white focus:outline-none focus:border-[#19344A] dark:focus:border-[#67B7E8] resize-none"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] dark:text-[#FAF9F6]/70 mb-1">{t.resources.matchQtyLabel}</label>
                              <input
                                type="number"
                                min="1"
                                max={selectedResource.quantity}
                                value={collabProposalQty}
                                onChange={(e) => setCollabProposalQty(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1D334D] border border-[#E8E4D9] dark:border-[#67B7E8]/20 text-xs text-[#19344A] dark:text-white"
                              />
                            </div>
                            <button
                              onClick={() => handleProposeResource(need)}
                              disabled={submitting}
                              className="px-4 py-2 bg-[#19344A] dark:bg-blue-600 hover:bg-[#111315] dark:hover:bg-[#67B7E8] text-white font-bold rounded-xl text-xs mt-4 disabled:opacity-50"
                            >
                              {t.resources.matchSendBtn}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OWNER ACTIONS */}
            {user && selectedResource.ownerId === user.uid && (
              <div className="pt-4 border-t border-[#FAF9F6] dark:border-[#67B7E8]/10 flex justify-end">
                <button
                  onClick={() => handleDeleteResource(selectedResource.resourceId)}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#FDECEE] border border-[#DC3545]/20 text-[#DC3545] hover:bg-[#DC3545]/10 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {submitting ? t.resources.deleting : t.resources.deleteBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
