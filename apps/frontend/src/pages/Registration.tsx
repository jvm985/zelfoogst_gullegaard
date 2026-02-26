import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, User, Baby, Trash2, Info, Euro, Plus, Lock, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Adult {
  id: string;
  tier: 'minimum' | 'standard' | 'high';
}

interface Child {
  id: string;
  age: number;
}

const PRICING = {
  ADULT: {
    minimum: 405,
    standard: 435,
    high: 480
  },
  CHILD_PER_YEAR: 20
};

const Registration = () => {
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const [adults, setAdults] = useState<Adult[]>([{ id: crypto.randomUUID(), tier: 'standard' }]);
  const [children, setChildren] = useState<Child[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (token) {
      fetchStatus();
    }
  }, [token]);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/membership/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.isRegistered) {
          setIsRegistered(true);
          setIsPaid(data.isPaid);
          // Pre-fill form with existing data in case they want to edit
          setAdults(data.adults.map((a: any) => ({ id: a.id, tier: a.tier })));
          setChildren(data.children.map((c: any) => ({ id: c.id, age: c.age })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch membership status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    const adultTotal = adults.reduce((sum, adult) => sum + PRICING.ADULT[adult.tier], 0);
    const childrenTotal = children.reduce((sum, child) => sum + (child.age * PRICING.CHILD_PER_YEAR), 0);
    setTotalPrice(adultTotal + childrenTotal);
  }, [adults, children]);

  const addAdult = () => {
    setAdults([...adults, { id: crypto.randomUUID(), tier: 'standard' }]);
  };

  const removeAdult = (id: string) => {
    if (adults.length > 1) {
      setAdults(adults.filter(a => a.id !== id));
    }
  };

  const updateAdultTier = (id: string, tier: Adult['tier']) => {
    setAdults(adults.map(a => a.id === id ? { ...a, tier } : a));
  };

  const addChild = () => {
    setChildren([...children, { id: crypto.randomUUID(), age: 0 }]);
  };

  const removeChild = (id: string) => {
    setChildren(children.filter(c => c.id !== id));
  };

  const updateChildAge = (id: string, age: number) => {
    setChildren(children.map(c => c.id === id ? { ...c, age: Math.max(0, age) } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !token) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/membership', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adults: adults.map(a => ({ tier: a.tier, price: PRICING.ADULT[a.tier] })),
          children: children.map(c => ({ age: c.age, price: c.age * PRICING.CHILD_PER_YEAR })),
          totalPrice
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Je inschrijving voor het oogstjaar 2026 is succesvol verwerkt!' });
        setIsRegistered(true);
        setIsEditing(false);
        fetchStatus(); // Refresh status
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Er is iets misgegaan bij het verzenden.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Kon geen verbinding maken met de server.' });
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return <div className="text-center py-20 text-slate-500 font-bold animate-pulse uppercase tracking-widest">Status controleren...</div>;
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="bg-slate-50 p-12 rounded-3xl border border-dashed border-slate-200 text-center max-w-md">
          <Lock className="mx-auto text-slate-300 mb-6" size={48} />
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Toegang Geweigerd</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Je moet ingelogd zijn om je te kunnen inschrijven voor het oogstjaar.</p>
          <button onClick={() => navigate('/login')} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">Inloggen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Inschrijven Oogstjaar 2026</h1>
        <p className="text-slate-600 text-lg">Welkom terug, <span className="text-green-600 font-bold">{currentUser.name}</span>!</p>
      </div>

      {isRegistered && !isEditing ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl space-y-8 animate-in zoom-in duration-500">
          <div className="flex items-center gap-4 text-green-600">
            <CheckCircle size={40} />
            <div>
              <h2 className="text-2xl font-black text-slate-900">U bent reeds ingeschreven</h2>
              <p className="text-slate-500 font-medium">Bedankt voor je deelname aan De Gullegaard!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className={`p-6 rounded-2xl border flex items-center gap-4 ${isPaid ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
              {isPaid ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-60">Status Betaling</p>
                <p className="text-lg font-black">{isPaid ? 'VOLLEDIG BETAALD' : 'NOG TE BETALEN'}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 flex items-center gap-4">
              <Euro size={24} className="text-slate-400" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-60">Totaalbedrag</p>
                <p className="text-lg font-black">€ {totalPrice}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Uw Gezinssamenstelling</h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <User size={18} className="text-green-600" />
                <span className="font-bold text-slate-700">{adults.length} Volwassenen</span>
              </div>
              {children.length > 0 && (
                <div className="flex items-center gap-2">
                  <Baby size={18} className="text-green-600" />
                  <span className="font-bold text-slate-700">{children.length} Kinderen</span>
                </div>
              )}
            </div>
          </div>

          {!isPaid ? (
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-4 px-8 rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight"
              >
                <Edit2 size={18} /> Aanpassen
              </button>
              <p className="text-sm text-slate-400 italic">Je kunt je inschrijving nog aanpassen zolang er nog niet betaald is.</p>
            </div>
          ) : (
            <div className="pt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-blue-800 leading-relaxed">Je inschrijving is definitief omdat deze reeds betaald is. Neem contact met ons op voor wijzigingen.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {isEditing && (
            <button 
              onClick={() => setIsEditing(false)}
              className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
            >
              <Plus className="rotate-45" size={20} /> Annuleren en terug
            </button>
          )}

          {message && (
            <div className={`p-6 mb-10 rounded-2xl border animate-in fade-in zoom-in ${
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <p className="font-bold flex items-center gap-2 text-lg">
                {message.type === 'success' ? '✓' : '✕'} {message.text}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            {/* Adults Section */}
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                  <User className="text-green-600" size={20} /> Volwassenen
                </h2>
                <button type="button" onClick={addAdult} className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 bg-green-50 px-4 py-2 rounded-full transition-colors">
                  <UserPlus size={16} /> Volwassene toevoegen
                </button>
              </div>

              <div className="space-y-4">
                {adults.map((adult, index) => (
                  <div key={adult.id} className="flex flex-col md:flex-row gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 items-center animate-in slide-in-from-left-4">
                    <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center font-black text-slate-400 border border-slate-100 shrink-0">
                      {index + 1}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-grow w-full">
                      {(['minimum', 'standard', 'high'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateAdultTier(adult.id, t)}
                          className={`p-3 rounded-xl border-2 transition-all text-sm font-bold capitalize ${adult.tier === t ? 'border-green-500 bg-green-500 text-white shadow-md' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                        >
                          {t} (€{PRICING.ADULT[t]})
                        </button>
                      ))}
                    </div>
                    {adults.length > 1 && (
                      <button type="button" onClick={() => removeAdult(adult.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Children Section */}
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                  <Baby className="text-green-600" size={20} /> Kinderen
                </h2>
                <button type="button" onClick={addChild} className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 bg-green-50 px-4 py-2 rounded-full transition-colors">
                  <Plus size={16} /> Kind toevoegen
                </button>
              </div>

              {children.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 italic">Geen kinderen toegevoegd aan de inschrijving.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {children.map((child, index) => (
                    <div key={child.id} className="flex gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 items-center animate-in slide-in-from-right-4">
                      <div className="flex-grow space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Leeftijd kind {index + 1}</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number" min="0" max="18" required 
                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-3 focus:ring-2 focus:ring-green-500 outline-none font-bold" 
                            value={child.age} 
                            onChange={e => updateChildAge(child.id, parseInt(e.target.value) || 0)} 
                          />
                          <span className="text-slate-500 font-bold shrink-0">€ {child.age * PRICING.CHILD_PER_YEAR}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeChild(child.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pricing Summary Sticky Bar */}
            <div className="sticky bottom-8 bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Euro className="text-green-500" size={24} />
                  <span className="text-3xl font-black tracking-tight">€ {totalPrice}</span>
                </div>
                <p className="text-slate-400 text-sm font-medium">Totaalprijs voor het oogstjaar 2026</p>
              </div>
              <button 
                type="submit" disabled={loading}
                className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white font-black py-4 px-12 rounded-2xl transition-all shadow-lg shadow-green-900/40 active:scale-95 disabled:opacity-50 text-lg uppercase tracking-tight"
              >
                {loading ? 'Verzenden...' : (isRegistered ? 'Aanpassing Opslaan' : 'Inschrijving Afronden')}
              </button>
            </div>
          </form>
        </>
      )}

      <div className="mt-12 bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
        <Info className="text-amber-600 shrink-0 mt-1" size={20} />
        <div className="text-sm text-amber-900 leading-relaxed">
          <p className="font-bold mb-1">Belangrijk</p>
          <ul className="list-disc ml-4 space-y-1 opacity-80">
            <li>Omdat je bent ingelogd als <span className="font-bold">{currentUser?.email}</span>, worden je contactgegevens automatisch gekoppeld.</li>
            <li>Zolang er nog niet betaald is, kun je je gezinssamenstelling nog wijzigen op deze pagina.</li>
            <li>Na betaling is je inschrijving definitief.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Registration;
