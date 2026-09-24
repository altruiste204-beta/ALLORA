import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, SUBCATEGORIES } from '../../constants/categories';
import { Need, Resource, LocationDetails, ResourceStatus, ResourceType, ResourceOwnerType } from '../../types';
import { 
  fetchNeeds, 
  fetchResources, 
  createResource, 
  updateResource, 
  deleteResource,
  createNeedResponse
} from '../../firebase/services/dataService';
import { findMatchingNeedsForResource } from '../../utils/matching';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface ResourcesViewProps {
  onOpenAuth: () => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ onOpenAuth }) => {
  const { user, profile, memberships } = useAuth();

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
      setError(err.message || 'Erreur lors du chargement des ressources.');
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
      setError('Veuillez remplir les champs obligatoires (titre, description, ville).');
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
      setError(err.message || 'Erreur lors de la publication.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Resource
  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Voulez-vous vraiment retirer cette ressource ?')) return;
    setSubmitting(true);
    try {
      await deleteResource(resourceId);
      setSelectedResource(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposeResource = async (need: Need) => {
    if (!user || !selectedResource) return;
    if (!collabProposalMessage.trim()) {
      setError('Veuillez ajouter un message à votre proposition.');
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
      setCollabSuccess(`Proposition d'aide envoyée avec succès pour le besoin "${need.title}" !`);
      setProposingForNeedId(null);
      setCollabProposalMessage('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la proposition.');
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
    loan: 'Prêt',
    donation: 'Don',
    service: 'Service / Compétence',
    volunteer: 'Bénévolat'
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFFFFF] p-6 rounded-3xl border border-[#E8E4D9]">
        <div>
          <h2 className="text-xl font-black text-[#19344A]">Ressources Partagées</h2>
          <p className="text-xs text-[#19344A]/60 mt-1">« Ce que tu as de disponible peut combler le besoin d'un frère ou d'une communauté. »</p>
        </div>
        {user ? (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-[#19344A] text-[#FFFFFF] text-xs font-bold rounded-xl hover:bg-[#111315] cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Proposer une ressource</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-[#67B7E8]/20 text-[#19344A] text-xs font-bold rounded-xl hover:bg-[#67B7E8]/30 cursor-pointer shrink-0"
          >
            Se connecter pour proposer
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher une ressource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs focus:outline-none focus:border-[#19344A]"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-[#19344A]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory('');
          }}
          className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A] focus:outline-none"
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
          disabled={!selectedCategory}
          className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A] disabled:opacity-50 focus:outline-none"
        >
          <option value="">Toutes les sous-catégories</option>
          {selectedCategory && SUBCATEGORIES[selectedCategory as keyof typeof SUBCATEGORIES]?.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A] focus:outline-none"
        >
          <option value="">Tous les types d'offres</option>
          <option value="loan">Prêt</option>
          <option value="donation">Don</option>
          <option value="service">Service / Compétence</option>
          <option value="volunteer">Bénévolat</option>
        </select>
      </div>

      {/* Resources Listing */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="md" text="Récupération des ressources..." />
        </div>
      ) : filteredResources.length === 0 ? (
        <EmptyState
          title="Aucune ressource partagée"
          description="Ajustez vos filtres ou soyez le premier à proposer quelque chose à la communauté !"
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
              className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E8E4D9] hover:border-[#19344A] transition-all duration-200 shadow-xs cursor-pointer flex flex-col justify-between h-48"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#67B7E8]">
                    {res.category} • {res.subcategory}
                  </span>
                  <span className="text-[10px] font-bold border border-[#E8E4D9] bg-[#FAF9F6] text-[#19344A] px-2 py-0.5 rounded-full uppercase">
                    {typeLabels[res.type]}
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-[#19344A] line-clamp-1 mb-1.5">{res.title}</h3>
                <p className="text-xs text-[#19344A]/70 line-clamp-2 leading-relaxed">{res.description}</p>
              </div>

              <div className="pt-3 border-t border-[#FAF9F6] flex items-center justify-between text-[11px] text-[#19344A]/60">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#FFFFFF] rounded-3xl p-6 border border-[#E8E4D9] max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FAF9F6]">
              <h3 className="text-base font-black text-[#19344A]">Proposer une Ressource</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#19344A]/50 hover:text-[#19344A]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-[#FAF9F6] border border-[#19344A]/20 text-xs rounded-xl mb-4 text-[#19344A]">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Titre de l'offre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prêt de sonorisation complète 800W"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs focus:outline-none focus:border-[#19344A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Description & Spécifications *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Expliquez ce que vous mettez à disposition de la communauté..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs focus:outline-none focus:border-[#19344A] resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Sous-catégorie</label>
                  <select
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  >
                    {subcategoryOptions.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Type d'offre</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  >
                    <option value="loan">Prêt / Prêt solidaire</option>
                    <option value="donation">Don matériel</option>
                    <option value="service">Service / Compétence</option>
                    <option value="volunteer">Bénévolat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Quantité disponible</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Unité</label>
                  <input
                    type="text"
                    placeholder="Sono, cartons, personnes..."
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Pays</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lyon"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs focus:outline-none focus:border-[#19344A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Zone (Ex: Code Postal)</label>
                  <input
                    type="text"
                    placeholder="Ex: 69002"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Propriétaire</label>
                  <select
                    value={newOwnerType}
                    onChange={(e) => setNewOwnerType(e.target.value as ResourceOwnerType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  >
                    <option value="user">En mon nom personnel</option>
                    {userChurches.length > 0 && <option value="church">Au nom d'une de mes églises</option>}
                  </select>
                </div>
              </div>

              {newOwnerType === 'church' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Sélectionner l'église bénéficiaire *</label>
                  <select
                    required
                    value={newChurchId}
                    onChange={(e) => setNewChurchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  >
                    <option value="">Sélectionner...</option>
                    {userChurches.map(ch => (
                      <option key={ch.churchId} value={ch.churchId}>{ch.churchName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Disponible du</label>
                  <input
                    type="date"
                    value={newAvailableFrom}
                    onChange={(e) => setNewAvailableFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Disponible jusqu'au (Optionnel)</label>
                  <input
                    type="date"
                    value={newAvailableUntil}
                    onChange={(e) => setNewAvailableUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#19344A] hover:bg-[#111315] text-[#FFFFFF] font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Publication...' : 'Publier la ressource'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESOURCE DETAIL MODAL */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#19344A]/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#FFFFFF] rounded-3xl p-6 border border-[#E8E4D9] max-h-[90vh] overflow-y-auto shadow-xl space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#67B7E8]">
                  {selectedResource.category} • {selectedResource.subcategory}
                </span>
                <h3 className="text-base font-black text-[#19344A] mt-1">{selectedResource.title}</h3>
                <p className="text-[11px] text-[#19344A]/60 mt-1">
                  Proposé par {selectedResource.ownerName} {selectedResource.churchName && <span className="font-bold text-[#19344A]">({selectedResource.churchName})</span>}
                </p>
              </div>
              <button onClick={() => setSelectedResource(null)} className="text-[#19344A]/50 hover:text-[#19344A] cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A]">Description</h4>
                <p className="text-xs text-[#19344A]/80 leading-relaxed bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8E4D9]/45 whitespace-pre-wrap">
                  {selectedResource.description}
                </p>
              </div>

              <div className="space-y-3 bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E4D9]/40 text-xs">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A]">Spécifications</h4>
                <div className="space-y-2 text-[11px]">
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60">Type d'offre:</span>
                    <span className="font-bold text-[#19344A]">{typeLabels[selectedResource.type]}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60">Quantité dispo:</span>
                    <span className="font-bold text-[#19344A]">{selectedResource.quantity} {selectedResource.unit}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60">Ville:</span>
                    <span className="font-bold text-[#19344A]">{selectedResource.location.city}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60">Du:</span>
                    <span className="font-semibold text-[#19344A]">{selectedResource.availableFrom}</span>
                  </p>
                  {selectedResource.availableUntil && (
                    <p className="flex justify-between">
                      <span className="text-[#19344A]/60">Au:</span>
                      <span className="font-semibold text-[#19344A]">{selectedResource.availableUntil}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-[#19344A]/60">Statut:</span>
                    <span className="font-extrabold uppercase text-[#19344A]">{selectedResource.status}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* MVP Matching Needs */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#19344A] flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Besoins compatibles avec cette ressource ({matchingNeeds.length})</span>
              </h4>

              {collabSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium">
                  {collabSuccess}
                </div>
              )}

              {matchingNeeds.length === 0 ? (
                <div className="p-4 bg-[#FAF9F6] border border-[#E8E4D9]/60 rounded-xl text-center text-xs text-[#19344A]/60">
                  Aucun besoin compatible recensé pour le moment dans cette région.
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingNeeds.map(need => (
                    <div key={need.needId} className="p-4 bg-[#67B7E8]/5 border border-[#67B7E8]/20 rounded-2xl space-y-3 text-xs">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-bold text-[#19344A]">{need.title}</p>
                          <p className="text-[#19344A]/70 line-clamp-2 mt-1">{need.description}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-[#FAF9F6] border border-[#E8E4D9] text-[10px] font-bold text-[#19344A] shrink-0 rounded-lg">
                          {need.quantity} {need.unit}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#19344A]/50 border-t border-[#E8E4D9]/20 pt-2">
                        <span>Région : {need.location.city}</span>
                        {user && selectedResource.ownerId === user.uid && selectedResource.status === 'available' && (
                          proposingForNeedId === need.needId ? (
                            <button
                              onClick={() => setProposingForNeedId(null)}
                              className="text-red-600 hover:underline font-bold shrink-0 cursor-pointer"
                            >
                              Annuler
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setProposingForNeedId(need.needId);
                                setCollabProposalQty(Math.min(selectedResource.quantity, need.quantity));
                              }}
                              className="text-[#67B7E8] hover:text-[#19344A] font-bold shrink-0 cursor-pointer"
                            >
                              Proposer cette ressource
                            </button>
                          )
                        )}
                      </div>

                      {proposingForNeedId === need.needId && (
                        <div className="p-3 bg-white border border-[#E8E4D9] rounded-xl space-y-3 mt-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Message d'accompagnement *</label>
                            <textarea
                              rows={2}
                              required
                              placeholder="Expliquez comment votre ressource peut aider..."
                              value={collabProposalMessage}
                              onChange={(e) => setCollabProposalMessage(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs focus:outline-none focus:border-[#19344A] resize-none"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#19344A] mb-1">Quantité à allouer</label>
                              <input
                                type="number"
                                min="1"
                                max={selectedResource.quantity}
                                value={collabProposalQty}
                                onChange={(e) => setCollabProposalQty(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4D9] text-xs text-[#19344A]"
                              />
                            </div>
                            <button
                              onClick={() => handleProposeResource(need)}
                              disabled={submitting}
                              className="px-4 py-2 bg-[#19344A] hover:bg-[#111315] text-white font-bold rounded-xl text-xs mt-4 disabled:opacity-50"
                            >
                              Envoyer
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
              <div className="pt-4 border-t border-[#FAF9F6] flex justify-end">
                <button
                  onClick={() => handleDeleteResource(selectedResource.resourceId)}
                  disabled={submitting}
                  className="px-4 py-2 bg-[#FAF9F6] border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Retrait...' : 'Retirer l\'offre'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
