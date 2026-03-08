import React, { useState, useEffect, useRef } from 'react';
import { Utensils, Plus, CheckCircle, X, Clock, User as UserIcon, Search, Leaf, ChevronDown, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Crop {
  id: string;
  name: string;
  isHarvestable: boolean;
}

interface Recipe {
  id: string;
  title: string;
  content: string;
  otherIngredients: string;
  harvestableCrops: Crop[];
  authorId: string;
  author?: { name: string };
  createdAt: string;
  harvestableCount?: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [availableCrops, setAvailableCrops] = useState<Crop[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Search & Filter state for main list
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyShowHarvestable, setOnlyShowHarvestable] = useState(false);

  // Form state
  const [formRecipe, setFormRecipe] = useState({
    title: '',
    otherIngredients: '',
    content: '',
    cropIds: [] as string[]
  });
  
  const [cropSearch, setCropSearch] = useState('');
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user, token } = useAuth();

  useEffect(() => {
    fetchInitialData();
  }, [token, onlyShowHarvestable]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [recipesRes, cropsRes] = await Promise.all([
        fetch(`/api/recipes/ranked?page=1&limit=12`),
        fetch('/api/crops', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
      ]);

      if (recipesRes.ok && cropsRes.ok) {
        const recipesData = await recipesRes.json();
        const cropsData = await cropsRes.json();
        setRecipes(recipesData.recipes);
        setPagination(recipesData.pagination);
        setAvailableCrops(cropsData);
      }
    } catch (error) {
      console.error('Failed to fetch initial recipes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!pagination || pagination.page >= pagination.totalPages || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/recipes/ranked?page=${pagination.page + 1}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setRecipes(prev => [...prev, ...data.recipes]);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to load more recipes:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const openEditMode = (recipe: Recipe) => {
    setFormRecipe({
      title: recipe.title,
      otherIngredients: recipe.otherIngredients,
      content: recipe.content,
      cropIds: recipe.harvestableCrops.map(c => c.id)
    });
    setIsEditMode(true);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const url = isEditMode && selectedRecipe ? `/api/recipes/${selectedRecipe.id}` : '/api/recipes';
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formRecipe),
      });
      if (response.ok) {
        setFormRecipe({ title: '', otherIngredients: '', content: '', cropIds: [] });
        setShowAddForm(false);
        setIsEditMode(false);
        setSelectedRecipe(null);
        fetchInitialData();
      } else {
        const err = await response.json();
        alert(err.error || "Fout bij opslaan");
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteRecipe = async (id: string) => {
      if (!window.confirm('Weet je zeker dat je dit recept wilt verwijderen?')) return;
      try {
          const response = await fetch(`/api/recipes/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
              setSelectedRecipe(null);
              fetchInitialData();
          }
      } catch (error) { console.error(error); }
  };

  const toggleCropSelection = (cropId: string) => {
    setFormRecipe(prev => ({
      ...prev,
      cropIds: prev.cropIds.includes(cropId) ? prev.cropIds.filter(id => id !== cropId) : [...prev.cropIds, cropId]
    }));
  };

  const filteredCrops = availableCrops.filter(c => 
    c.name.toLowerCase().includes(cropSearch.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const selectedCropNames = availableCrops.filter(c => formRecipe.cropIds.includes(c.id)).map(c => c.name);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         recipe.otherIngredients.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHarvestable = !onlyShowHarvestable || (recipe.harvestableCount && recipe.harvestableCount > 0);
    return matchesSearch && matchesHarvestable;
  });

  const renderForm = (isModal: boolean = false) => (
    <form onSubmit={handleSaveRecipe} className={`${isModal ? '' : 'mb-16 bg-white p-10 rounded-3xl border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4'}`}>
      {!isModal && (
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900">Deel jouw favoriete recept</h2>
          <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>
      )}
      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 ml-1">Naam van het gerecht</label>
          <input type="text" placeholder="Bijv: Geroosterde Winterwortels" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-green-500 outline-none" required value={formRecipe.title} onChange={e => setFormRecipe({...formRecipe, title: e.target.value})} />
        </div>
        <div className="space-y-2 relative" ref={isModal ? null : dropdownRef}>
          <label className="text-sm font-bold text-slate-500 ml-1">Ingrediënten van De Zelfoogsttuin</label>
          <div onClick={() => setIsCropDropdownOpen(!isCropDropdownOpen)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-slate-300 transition-all min-h-[60px]">
            <div className="flex flex-wrap gap-2">
              {selectedCropNames.length > 0 ? selectedCropNames.map(name => (
                <span key={name} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">{name}<X size={14} className="cursor-pointer hover:text-green-900" onClick={(e) => { e.stopPropagation(); const crop = availableCrops.find(c => c.name === name); if (crop) toggleCropSelection(crop.id); }}/></span>
              )) : <span className="text-slate-400 font-medium">Selecteer gewassen...</span>}
            </div>
            <ChevronDown className={`text-slate-400 transition-transform ${isCropDropdownOpen ? 'rotate-180' : ''}`} size={20} />
          </div>
          {isCropDropdownOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50">
                <input type="text" placeholder="Filter gewassen..." className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={cropSearch} onChange={(e) => setCropSearch(e.target.value)} autoFocus />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredCrops.map(crop => (
                  <div key={crop.id} onClick={() => toggleCropSelection(crop.id)} className={`px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-slate-50 ${formRecipe.cropIds.includes(crop.id) ? 'bg-green-50' : ''}`}>
                    <span className={`font-bold ${formRecipe.cropIds.includes(crop.id) ? 'text-green-700' : 'text-slate-700'}`}>{crop.name}</span>
                    {formRecipe.cropIds.includes(crop.id) && <CheckCircle size={18} className="text-green-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 ml-1">Overige ingrediënten</label>
          <input type="text" placeholder="Gescheiden door komma's" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-green-500 outline-none" required value={formRecipe.otherIngredients} onChange={e => setFormRecipe({...formRecipe, otherIngredients: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500 ml-1">Bereidingswijze</label>
          <textarea placeholder="Stap voor stap..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 h-48 focus:ring-2 focus:ring-green-500 outline-none" required value={formRecipe.content} onChange={e => setFormRecipe({...formRecipe, content: e.target.value})}></textarea>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="submit" className="flex-grow bg-green-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-green-700 shadow-lg uppercase tracking-tight">{isEditMode ? 'Wijzigingen Opslaan' : 'Recept Opslaan'}</button>
          <button type="button" onClick={() => isModal ? setIsEditMode(false) : setShowAddForm(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">Annuleren</button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Kookinspiratie</h1>
          <p className="text-slate-600 font-medium">Wat eten we vandaag van het veld?</p>
        </div>
        {user && (
            <button onClick={() => { setFormRecipe({ title: '', otherIngredients: '', content: '', cropIds: [] }); setIsEditMode(false); setShowAddForm(!showAddForm); }} className="flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-green-700 transition-all shadow-lg uppercase tracking-tight">
              <Plus size={20} /> Recept delen
            </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-12 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-4 top-3 text-slate-400" size={20} />
          <input type="text" placeholder="Zoek op titel of ingrediënten..." className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setOnlyShowHarvestable(!onlyShowHarvestable)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all border-2 w-full md:w-auto justify-center ${onlyShowHarvestable ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-green-500'}`}>
          <Leaf size={18} /> Nu Oogstbaar
        </button>
      </div>

      {showAddForm && !isEditMode && renderForm()}

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="animate-spin text-green-600" size={48} />
            <p className="font-black text-slate-400 uppercase tracking-widest">Recepten laden...</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRecipes.map(recipe => (
                <div key={recipe.id} onClick={() => { setSelectedRecipe(recipe); setIsEditMode(false); }} className="bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer flex flex-col overflow-hidden">
                    <div className="p-8 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-green-600 transition-colors">{recipe.title}</h3>
                        {recipe.harvestableCount && recipe.harvestableCount > 0 ? (
                        <span className="bg-green-100 text-green-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shrink-0">{recipe.harvestableCount} Oogstbaar</span>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {recipe.harvestableCrops.map(crop => (
                        <span key={crop.id} className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${crop.isHarvestable ? 'bg-green-600 text-white shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-100 text-slate-400'}`}>{crop.name}</span>
                        ))}
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-6 italic">{recipe.otherIngredients}</p>
                    </div>
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1"><UserIcon size={12} className="text-green-600" /> {recipe.author?.name || 'Anoniem'}</span>
                    <span>{new Date(recipe.createdAt).toLocaleDateString('nl-NL')}</span>
                    </div>
                </div>
                ))}
            </div>

            {filteredRecipes.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Utensils className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-bold italic text-lg">Geen recepten gevonden.</p>
                </div>
            )}

            {pagination && pagination.page < pagination.totalPages && (
                <div className="mt-16 flex justify-center">
                    <button onClick={loadMore} disabled={loadingMore} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50">
                        {loadingMore ? <Loader2 className="animate-spin" size={24} /> : <ChevronDown size={24} />}
                        Toon meer recepten ({recipes.length} van {pagination.total})
                    </button>
                </div>
            )}
        </>
      )}

      {selectedRecipe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="relative p-10 bg-slate-900 text-white">
              <button onClick={() => setSelectedRecipe(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"><X size={24} /></button>
              <div className="flex items-center gap-3 text-green-500 mb-4"><Utensils size={24} /><span className="font-black uppercase tracking-widest text-sm">{isEditMode ? 'Recept Bewerken' : 'Recept'}</span></div>
              {!isEditMode && <h2 className="text-4xl font-black tracking-tight">{selectedRecipe.title}</h2>}
            </div>
            <div className="p-10">
              {isEditMode ? renderForm(true) : (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-green-600 mb-4">Ingrediënten van het veld</h4>
                      <div className="flex flex-wrap gap-2">{selectedRecipe.harvestableCrops.map(crop => (<div key={crop.id} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border-2 ${crop.isHarvestable ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>{crop.isHarvestable ? <CheckCircle size={14}/> : <Clock size={14}/>}{crop.name}</div>))}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Overige benodigdheden</h4>
                      <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 italic">{selectedRecipe.otherIngredients}</p>
                    </div>
                  </div>
                  <div><h4 className="text-xs font-black uppercase tracking-widest text-green-600 mb-4">Bereidingswijze</h4><div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg font-medium">{selectedRecipe.content}</div></div>
                  <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-slate-400"><span className="flex items-center gap-2"><UserIcon size={16} className="text-green-600" /> {selectedRecipe.author?.name}</span><span className="flex items-center gap-2"><Clock size={16} className="text-green-600" /> {new Date(selectedRecipe.createdAt).toLocaleDateString('nl-NL')}</span></div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      {user && (selectedRecipe.authorId === user.id || user.role === 'ADMIN') && (<><button onClick={() => openEditMode(selectedRecipe)} className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 bg-amber-100 text-amber-700 px-6 py-4 rounded-2xl font-black hover:bg-amber-200 transition-all uppercase tracking-tight"><Edit2 size={18} /> Aanpassen</button><button onClick={() => handleDeleteRecipe(selectedRecipe.id)} className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-6 py-4 rounded-2xl font-black hover:bg-red-200 transition-all uppercase tracking-tight"><Trash2 size={18} /> Verwijderen</button></>)}
                      <button onClick={() => setSelectedRecipe(null)} className="flex-grow sm:flex-grow-0 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all uppercase tracking-tight">Sluiten</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
