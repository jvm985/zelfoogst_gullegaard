import React, { useState, useEffect } from 'react';
import { Settings, Users, Sprout, Send, Edit2, Trash2, Eye, CheckCircle, XCircle, Euro, Baby, User, X, Plus, MapPin, AlignLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Crop {
  id: string;
  name: string;
  description: string | null;
  isHarvestable: boolean;
  fieldLocation: string | null;
}

interface Member {
  id: string;
  name: string;
  email: string;
  isMember: boolean;
  hasPaid: boolean;
  totalFee: number;
  familyComposition: {
    adults: number;
    children: { age: number }[];
  };
  registrationDate: string;
}

// Specific field locations according to instructions
const FIELD_LOCATIONS = [
  "Bloemen", "Blok 1", "Blok 2", "Blok 3",
  "Kruiden", "Blok 4", "Blok 5", "Blok 6",
  "Tunnel 1", "Tunnel 2", "Tunnel 3", "Tunnel 4"
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('crops');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Crop management state
  const [showCropForm, setShowCropForm] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [cropForm, setCropForm] = useState({
    name: '',
    description: '',
    fieldLocation: '',
    isHarvestable: false
  });

  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (activeTab === 'crops') fetchCrops();
    if (activeTab === 'members') fetchMembers();
  }, [activeTab, token]);

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crops', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCrops(data);
      }
    } catch (error) {
      console.error('Failed to fetch crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (id: string) => {
    if (!window.confirm('Weet je zeker dat je dit lid en alle bijbehorende gegevens wilt verwijderen?')) return;
    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchMembers();
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          alert(data.error || 'Fout bij verwijderen van lid');
        } else {
          alert('Fout bij verwijderen van lid (Status: ' + response.status + ')');
        }
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
      alert('Kon geen verbinding maken met de server.');
    }
  };

  const togglePaymentStatus = async (memberId: string) => {
    try {
        const member = members.find(m => m.id === memberId);
        if(!member) return;

        await fetch(`/api/admin/members/${memberId}/payment`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isPaid: !member.hasPaid })
        });
        
        setMembers(members.map(m => m.id === memberId ? { ...m, hasPaid: !m.hasPaid } : m));
    } catch (error) {
        console.error('Failed to update payment status:', error);
    }
  };

  const toggleHarvestMembership = async (memberId: string) => {
    try {
        const member = members.find(m => m.id === memberId);
        if(!member) return;

        await fetch(`/api/admin/members/${memberId}/membership`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isMember: !member.isMember })
        });
        
        setMembers(members.map(m => m.id === memberId ? { ...m, isMember: !m.isMember } : m));
    } catch (error) {
        console.error('Failed to update membership status:', error);
    }
  };

  // --- Crop Handlers ---

  const openAddCrop = () => {
    setEditingCrop(null);
    setCropForm({ name: '', description: '', fieldLocation: FIELD_LOCATIONS[0], isHarvestable: false });
    setShowCropForm(true);
  };

  const openEditCrop = (crop: Crop) => {
    setEditingCrop(crop);
    setCropForm({
      name: crop.name,
      description: crop.description || '',
      fieldLocation: crop.fieldLocation || FIELD_LOCATIONS[0],
      isHarvestable: crop.isHarvestable
    });
    setShowCropForm(true);
  };

  const handleSaveCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCrop 
      ? `/api/crops/${editingCrop.id}`
      : '/api/crops';
    
    const method = editingCrop ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cropForm),
      });
      if (response.ok) {
        setShowCropForm(false);
        fetchCrops();
      }
    } catch (error) {
      console.error('Failed to save crop:', error);
    }
  };

  const toggleCropHarvestable = async (crop: Crop) => {
    try {
      const response = await fetch(`/api/crops/${crop.id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isHarvestable: !crop.isHarvestable }),
      });
      if (response.ok) {
        fetchCrops();
      }
    } catch (error) {
      console.error('Failed to toggle harvestable status:', error);
    }
  };

  const deleteCrop = async (id: string) => {
    if (!window.confirm('Weet je zeker dat je dit gewas wilt verwijderen?')) return;
    try {
      const response = await fetch(`/api/crops/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchCrops();
      }
    } catch (error) {
      console.error('Failed to delete crop:', error);
    }
  };

  const sendNewsletter = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newsletterSubject || !newsletterBody) {
          alert('Vul een onderwerp en bericht in.');
          return;
      }
      setSendingNewsletter(true);
      try {
          const response = await fetch('/api/newsletter', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ subject: newsletterSubject, body: newsletterBody })
          });
          if (response.ok) {
              alert('Nieuwsbrief succesvol verstuurd!');
              setNewsletterSubject('');
              setNewsletterBody('');
          } else {
              const data = await response.json();
              alert(data.error || 'Kon nieuwsbrief niet versturen');
          }
      } catch (error) {
          console.error('Failed to send newsletter:', error);
          alert('Fout bij het versturen van de nieuwsbrief');
      } finally {
          setSendingNewsletter(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-green-100 p-3 rounded-2xl border border-green-200">
          <Settings className="text-green-700" size={28} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Boer Dashboard</h1>
      </div>
      
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 mb-10 w-fit overflow-x-auto shadow-sm">
        <button 
          className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'crops' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('crops')}
        >
          <Sprout size={18}/> Gewassen
        </button>
        <button 
          className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'members' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={18}/> Deelnemers
        </button>
        <button 
          className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'newsletter' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('newsletter')}
        >
          <Send size={18}/> Nieuwsbrief
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
        {activeTab === 'crops' && (
          <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">Gewassenbeheer</h2>
              <button 
                onClick={openAddCrop}
                className="px-6 py-2.5 rounded-xl font-bold transition-all bg-green-600 border-green-500 text-white shadow-lg shadow-green-100 flex items-center gap-2"
              >
                <Plus size={18}/> Nieuw Gewas
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest animate-pulse">Data ophalen...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Naam</th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Locatie</th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Oogstbaar</th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {crops.map((crop) => (
                      <tr key={crop.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{crop.name}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">{crop.description}</div>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-mono text-sm font-bold border border-slate-200">
                            {crop.fieldLocation || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => toggleCropHarvestable(crop)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${
                              crop.isHarvestable 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {crop.isHarvestable ? 'JA' : 'NEE'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => openEditCrop(crop)}
                              className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                              title="Bewerken"
                            >
                              <Edit2 size={18}/></button>
                            <button 
                              onClick={() => deleteCrop(crop.id)}
                              className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Verwijderen"
                            >
                              <Trash2 size={18}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Deelnemersbeheer</h2>
            {loading ? (
              <div className="text-center py-20 text-slate-400 animate-pulse font-bold">Laden...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Naam / E-mail</th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Oogstaandeel</th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Betaald</th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Bedrag</th>
                      <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{member.name}</div>
                          <div className="text-xs text-slate-400">{member.email}</div>
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => toggleHarvestMembership(member.id)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                              member.isMember 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {member.isMember ? 'ACTIEF' : 'GEEN'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => togglePaymentStatus(member.id)}>
                            {member.hasPaid ? (
                              <CheckCircle className="text-green-500 mx-auto" size={24} />
                            ) : (
                              <XCircle className="text-red-300 hover:text-red-500 transition-colors mx-auto" size={24} />
                            )}
                          </button>
                        </td>
                        <td className="p-4 font-bold text-slate-700">€ {member.totalFee}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setSelectedMember(member)}
                              className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                              title="Details bekijken"
                            >
                              <Eye size={18}/>
                            </button>
                            <button 
                              onClick={() => deleteMember(member.id)}
                              className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Lid verwijderen"
                            >
                              <Trash2 size={18}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div className="p-8 max-w-2xl animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Nieuwsbrief Versturen</h2>
            <div className="space-y-6 bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">Onderwerp</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-4 focus:ring-2 focus:ring-green-500 outline-none" 
                  placeholder="Nieuws van de boerderij - Week 12" 
                  value={newsletterSubject}
                  onChange={(e) => setNewsletterSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">Bericht</label>
                <textarea 
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-4 h-48 focus:ring-2 focus:ring-green-500 outline-none" 
                  placeholder="Schrijf hier je bericht..."
                  value={newsletterBody}
                  onChange={(e) => setNewsletterBody(e.target.value)}
                ></textarea>
              </div>
              <button 
                onClick={sendNewsletter}
                disabled={sendingNewsletter}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-black hover:bg-green-700 shadow-lg shadow-green-100 transition-all uppercase tracking-tight disabled:opacity-50"
              >
                {sendingNewsletter ? 'Bezig met versturen...' : 'Verstuur naar alle leden'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Crop Modal (Add/Edit) */}
      {showCropForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-black tracking-tight">{editingCrop ? 'Gewas Aanpassen' : 'Nieuw Gewas Toevoegen'}</h2>
              <button onClick={() => setShowCropForm(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCrop} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Naam Gewas</label>
                <div className="relative">
                  <Sprout className="absolute left-4 top-3.5 text-slate-300" size={20} />
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="Bijv. Winterwortelen"
                    value={cropForm.name}
                    onChange={e => setCropForm({...cropForm, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Vak-locatie</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-slate-300" size={20} />
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none"
                    value={cropForm.fieldLocation}
                    onChange={e => setCropForm({...cropForm, fieldLocation: e.target.value})}
                  >
                    {FIELD_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Beschrijving</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-3.5 text-slate-300" size={20} />
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition-all h-24"
                    placeholder="Wat details over dit gewas..."
                    value={cropForm.description}
                    onChange={e => setCropForm({...cropForm, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input 
                  type="checkbox" id="harvestable"
                  className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                  checked={cropForm.isHarvestable}
                  onChange={e => setCropForm({...cropForm, isHarvestable: e.target.checked})}
                />
                <label htmlFor="harvestable" className="font-bold text-slate-700 cursor-pointer">Dit gewas is nu oogstbaar</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-grow bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 shadow-lg transition-all uppercase tracking-tight">
                  {editingCrop ? 'Opslaan' : 'Toevoegen'}
                </button>
                <button type="button" onClick={() => setShowCropForm(false)} className="px-6 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all">
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Details Modal (Already exists) */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{selectedMember.name}</h2>
                <p className="text-slate-400 text-sm">Lid sinds: {new Date(selectedMember.registrationDate).toLocaleDateString('nl-NL')}</p>
              </div>
              <button onClick={() => setSelectedMember(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Family Section */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <User size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Volwassenen</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{selectedMember.familyComposition?.adults || 0}</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Baby size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Kinderen</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{selectedMember.familyComposition?.children?.length || 0}</div>
                </div>
              </div>

              {/* Children Details */}
              {selectedMember.familyComposition?.children && selectedMember.familyComposition.children.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Leeftijden kinderen</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.familyComposition.children.map((child, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold">
                        {child.age} jaar
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Section */}
              <div className="border-t border-slate-100 pt-8 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Totaal Inschrijvingsgeld</h4>
                  <div className="flex items-center gap-2 text-slate-900">
                    <Euro className="text-green-600" size={24} />
                    <span className="text-3xl font-black">€ {selectedMember.totalFee || 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Betalingsstatus</h4>
                  <span className={`px-4 py-2 rounded-full font-black text-xs tracking-widest ${selectedMember.hasPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedMember.hasPaid ? 'VOLLEDIG BETAALD' : 'NOG TE BETALEN'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => togglePaymentStatus(selectedMember.id)}
                  className="flex-grow bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight"
                >
                  Markeer als {selectedMember.hasPaid ? 'Niet Betaald' : 'Betaald'}
                </button>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="px-8 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
