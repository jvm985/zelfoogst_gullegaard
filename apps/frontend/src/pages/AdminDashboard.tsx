import React, { useState, useEffect } from 'react';
import { Settings, Users, Eye, CheckCircle, XCircle, Calendar, Trash2, Sprout, RefreshCw, ArrowRight, ShieldCheck, Grid3X3, Plus, Edit2, Filter, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Member {
  id: string; name: string; email: string; isMember: boolean; hasPaid: boolean; totalFee: number;
  familyComposition: { adults: number; children: { age: number }[]; }; registrationDate: string;
}

interface NewsPost { id: string; title: string; content: string; imageUrl?: string; createdAt: string; }

interface Crop {
  id: string; name: string; description: string | null; familyId: string | null; family?: { name: string };
  rotationGroupId: string | null; rotationGroup?: { name: string }; nutrientLevel: number;
  daysToMaturity: number; sowStart: string; sowEnd: string; minTemp: number | null;
  rowSpacing: number; plantSpacing: number; canBePrePost: boolean;
  seedsPerSqm: number; pricePerSeedSqm: number;
}

const NUTRIENT_LEVELS = [
  { value: 1, label: 'Sluimerend (Laag)', color: 'bg-blue-100 text-blue-700' },
  { value: 2, label: 'Gemiddeld', color: 'bg-green-100 text-green-700' },
  { value: 3, label: 'Gulzig (Hoog)', color: 'bg-orange-100 text-orange-700' }
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [rotationGroups, setRotationGroups] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Filter state
  const [cropFilter, setCropFilter] = useState<string>('all');

  // Settings state
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  
  // News state
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '' });
  const [savingNews, setSavingNews] = useState(false);

  // Crop state
  const [showCropForm, setShowCropForm] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [cropForm, setCropForm] = useState({
    name: '', description: '', familyId: '', nutrientLevel: 1, daysToMaturity: 60,
    sowStart: '03-01', sowEnd: '06-30', minTemp: 10, rowSpacing: 30, plantSpacing: 30,
    canBePrePost: false, rotationGroupId: '', seedsPerSqm: 0, pricePerSeedSqm: 0
  });

  // Veld config state
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [blockForm, setBlockForm] = useState({ name: '', bedCount: 5, length: 10, bedWidth: 0.75, rotationGroupIds: [] as string[] });
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{row: number, col: number} | null>(null);

  // Rotation state
  const [sourceYear, setSourceYear] = useState(2026);
  const [targetYear, setTargetYear] = useState(2027);
  const [isRotating, setIsRotating] = useState(false);
  const [blockMapping, setBlockMapping] = useState<Record<string, string>>({});
  const [rotationBlocks, setRotationBlocks] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
    if (activeTab === 'news') fetchNews();
    if (activeTab === 'teeltplan') fetchTeeltplanConfig();
    if (activeTab === 'crops') fetchCrops();
    if (activeTab === 'fields') fetchFields();
  }, [activeTab, token]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/members', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setMembers(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) setNews(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNews(true);
    try {
      const response = await fetch('/api/news', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newsForm),
      });
      if (response.ok) { setNewsForm({ title: '', content: '', imageUrl: '' }); fetchNews(); }
    } catch (error) { console.error(error); } finally { setSavingNews(false); }
  };

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const [cropsRes, familiesRes, groupsRes] = await Promise.all([
        fetch('/api/crops'),
        fetch('/api/teeltplan/families'),
        fetch('/api/teeltplan/rotation-groups')
      ]);
      if (cropsRes.ok) setCrops(await cropsRes.json());
      if (familiesRes.ok) setFamilies(await familiesRes.json());
      if (groupsRes.ok) setRotationGroups(await groupsRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teeltplan/fields', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
          const data = await res.json();
          setFields(data);
          if (data.length > 0 && !selectedFieldId) setSelectedFieldId(data[0].id);
      }
      const groupsRes = await fetch('/api/teeltplan/rotation-groups');
      if (groupsRes.ok) setRotationGroups(await groupsRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchTeeltplanConfig = async () => {
    setLoading(true);
    try {
      const [yearsRes, settingsRes, fieldsRes] = await Promise.all([
        fetch('/api/teeltplan/available-years', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/settings'),
        fetch('/api/teeltplan/fields', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (yearsRes.ok) setAvailableYears(await yearsRes.json());
      if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.active_year) setActiveYear(parseInt(settings.active_year));
      }
      if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          const allBlocks = fieldsData.flatMap((f: any) => f.blocks);
          setRotationBlocks(allBlocks);
          const initialMapping: Record<string, string> = {};
          allBlocks.forEach((b: any) => { initialMapping[b.id] = b.id; });
          setBlockMapping(initialMapping);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCrop ? 'PATCH' : 'POST';
    const url = editingCrop ? `/api/crops/${editingCrop.id}` : '/api/crops';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(cropForm) });
    if (res.ok) { setShowCropForm(false); fetchCrops(); }
  };

  const handleAddField = async () => {
    const res = await fetch('/api/teeltplan/fields', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name: newFieldName }) });
    if (res.ok) { setNewFieldName(''); fetchFields(); }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/teeltplan/blocks', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name: blockForm.name, fieldId: selectedFieldId, row: pendingPosition?.row, col: pendingPosition?.col, bedCount: blockForm.bedCount, length: blockForm.length, bedWidth: blockForm.bedWidth }) });
    if (res.ok) { setShowAddBlockModal(false); fetchFields(); }
  };

  const handleUpdateBlock = async () => {
    const res = await fetch(`/api/teeltplan/blocks/${editingBlock.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(blockForm) });
    if (res.ok) { setEditingBlock(null); fetchFields(); }
  };

  const updateActiveYear = async (year: number) => {
      const res = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ key: 'active_year', value: year }) });
      if (res.ok) { setActiveYear(year); alert(`Actief teeltjaar ingesteld op ${year}`); }
  };

  const handleStartRotation = async () => {
    if (!window.confirm('Plan roteren?')) return;
    setIsRotating(true);
    try {
      const res = await fetch('/api/teeltplan/clone-year', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ sourceYear, targetYear, mapping: blockMapping }) });
      if (res.ok) { alert('Nieuw seizoen aangemaakt!'); fetchTeeltplanConfig(); }
    } catch (e) { console.error(e); } finally { setIsRotating(false); }
  };

  const togglePaymentStatus = async (id: string) => {
    const m = members.find(m => m.id === id);
    if(!m) return;
    await fetch(`/api/admin/members/${id}/payment`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ isPaid: !m.hasPaid }) });
    setMembers(members.map(m => m.id === id ? { ...m, hasPaid: !m.hasPaid } : m));
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const filteredCrops = crops
    .filter(c => cropFilter === 'all' || c.rotationGroupId === cropFilter)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-green-100 p-3 rounded-2xl border border-green-200"><Settings className="text-green-700" size={28} /></div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Beheer Dashboard</h1>
      </div>
      
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 mb-10 w-fit overflow-x-auto shadow-sm gap-1">
        {[
            { id: 'members', label: 'Deelnemers', icon: <Users size={18}/> },
            { id: 'teeltplan', label: 'Seizoen', icon: <RefreshCw size={18}/> },
            { id: 'crops', label: 'Gewassen', icon: <Sprout size={18}/> },
            { id: 'fields', label: 'Veldindeling', icon: <Grid3X3 size={18}/> },
            { id: 'news', label: 'Nieuws', icon: <Calendar size={18}/> }
        ].map(tab => (
            <button key={tab.id} className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setActiveTab(tab.id)}>
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
        {activeTab === 'members' && (
          <div className="p-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Deelnemersbeheer</h2>
            {loading ? <div className="text-center py-20 text-slate-400 animate-pulse font-bold">Laden...</div> : (
              <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-slate-100"><th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Naam / E-mail</th><th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Betaald</th><th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Bedrag</th><th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Details</th></tr></thead><tbody className="divide-y divide-slate-50">{members.map((m) => (<tr key={m.id} className="hover:bg-slate-50 transition-colors"><td className="p-4"><div className="font-bold text-slate-800">{m.name}</div><div className="text-xs text-slate-400">{m.email}</div></td><td className="p-4 text-center"><button onClick={() => togglePaymentStatus(m.id)}>{m.hasPaid ? (<CheckCircle className="text-green-500 mx-auto" size={24} />) : (<XCircle className="text-red-300 hover:text-red-500 mx-auto" size={24} />)}</button></td><td className="p-4 font-bold text-slate-700">€ {m.totalFee}</td><td className="p-4 text-right"><div className="flex justify-end gap-2"><button className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-green-600 hover:text-white transition-all shadow-sm"><Eye size={18}/></button></div></td></tr>))}</tbody></table></div>
            )}
          </div>
        )}

        {activeTab === 'teeltplan' && (
            <div className="p-8 animate-in fade-in duration-500 space-y-12">
                <section>
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Actief Teeltjaar</h2>
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex items-center justify-between">
                        <div><p className="text-slate-500 font-medium mb-2">Dit jaar wordt standaard getoond aan alle leden en boeren.</p><span className="text-4xl font-black text-green-600">{activeYear}</span></div>
                        <select value={activeYear} onChange={e => updateActiveYear(parseInt(e.target.value))} className="bg-white border-2 border-slate-200 rounded-xl px-6 py-3 font-bold text-slate-700 shadow-sm cursor-pointer">{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                </section>
                <section className="pt-12 border-t border-slate-100">
                    <div className="flex items-center gap-4 mb-8"><div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><RefreshCw size={24} /></div><div><h2 className="text-2xl font-black text-slate-900 tracking-tight">Nieuw Seizoen Genereren</h2><p className="text-slate-500 font-medium">Kopieer en roteer de gewassen naar een nieuw jaar.</p></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50 rounded-3xl border border-slate-100 mb-8"><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Kopieer van</label><input type="number" value={sourceYear} onChange={e => setSourceYear(parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-2xl p-4 font-bold outline-none"/></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Doeljaar (Nieuw)</label><input type="number" value={targetYear} onChange={e => setTargetYear(parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-2xl p-4 font-bold outline-none"/></div></div>
                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-slate-800 ml-1 flex items-center gap-2"><ShieldCheck className="text-green-600" /> Blok Rotatie Instellen</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rotationBlocks.map(b => (
                                <div key={b.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                                    <span className="text-sm font-bold text-slate-700">{b.name}</span>
                                    <ArrowRight className="text-slate-300" size={16} />
                                    <select value={blockMapping[b.id] || ''} onChange={e => setBlockMapping({ ...blockMapping, [b.id]: e.target.value })} className="flex-grow bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
                                        {rotationBlocks.map(ob => <option key={ob.id} value={ob.id}>{ob.name}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleStartRotation} disabled={isRotating} className="mx-auto mt-10 block bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 flex items-center gap-3">{isRotating ? <RefreshCw size={24} className="animate-spin" /> : <RefreshCw size={24} />} Genereer Nieuw Seizoen</button>
                </section>
            </div>
        )}

        {activeTab === 'crops' && (
            <div className="p-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h2 className="text-2xl font-black text-slate-900">Botanische Bibliotheek</h2>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-initial min-w-[200px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select value={cropFilter} onChange={e => setCropFilter(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-4 py-2 font-bold text-sm outline-none focus:border-green-500 appearance-none">
                                <option value="all">Alle Rotatiegroepen</option>
                                {rotationGroups.map(rg => <option key={rg.id} value={rg.id}>{rg.name}</option>)}
                            </select>
                        </div>
                        <button onClick={() => { setEditingCrop(null); setCropForm({ name:'', description:'', familyId: families[0]?.id||'', nutrientLevel:1, daysToMaturity:60, sowStart:'03-01', sowEnd:'06-30', minTemp:10, rowSpacing:30, plantSpacing:30, canBePrePost:false, rotationGroupId: rotationGroups[0]?.id||'', seedsPerSqm: 0, pricePerSeedSqm: 0 }); setShowCropForm(true); }} className="whitespace-nowrap px-6 py-2.5 rounded-xl font-bold bg-green-600 text-white shadow-lg flex items-center gap-2"><Plus size={18}/> Nieuw Gewas</button>
                    </div>
                </div>
                <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-slate-100"><th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Gewas</th><th className="p-4 text-xs font-black text-slate-400 uppercase text-center">Familie</th><th className="p-4 text-xs font-black text-slate-400 uppercase text-center">Rotatiegroep</th><th className="p-4 text-xs font-black text-slate-400 uppercase text-right">Acties</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredCrops.map((c) => (<tr key={c.id} className="hover:bg-slate-50 transition-colors"><td className="p-4"><div className="font-bold text-slate-800">{c.name}</div></td><td className="p-4 text-center text-xs font-black text-slate-400 uppercase tracking-tighter">{c.family?.name || '-'}</td><td className="p-4 text-center"><span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{c.rotationGroup?.name || '-'}</span></td><td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => { setEditingCrop(c); setCropForm({ name: c.name, description: c.description || '', familyId: c.familyId || '', nutrientLevel: c.nutrientLevel, daysToMaturity: c.daysToMaturity, sowStart: c.sowStart, sowEnd: c.sowEnd, minTemp: c.minTemp || 10, rowSpacing: c.rowSpacing, plantSpacing: c.plantSpacing, canBePrePost: c.canBePrePost, rotationGroupId: c.rotationGroupId || '', seedsPerSqm: c.seedsPerSqm, pricePerSeedSqm: c.pricePerSeedSqm }); setShowCropForm(true); }} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-amber-500 hover:text-white transition-all"><Edit2 size={18}/></button><button onClick={() => { if(window.confirm('Wissen?')) fetch(`/api/crops/${c.id}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}}).then(fetchCrops); }} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button></div></td></tr>))}</tbody></table></div>
            </div>
        )}

        {activeTab === 'fields' && (
            <div className="p-8 animate-in fade-in duration-500 space-y-10">
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                    <div className="flex justify-between items-center"><h2 className="text-xl font-black text-slate-900">Veld Configuratie</h2>{selectedFieldId && (<button onClick={() => { if(window.confirm('Verwijderen?')) fetch(`/api/teeltplan/fields/${selectedFieldId}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}}).then(fetchFields); }} className="text-red-400 hover:text-red-600 flex items-center gap-1 font-black text-xs uppercase"><Trash2 size={16} /> Verwijder Veld</button>)}</div>
                    <div className="flex flex-wrap gap-4 items-end"><div className="flex-grow min-w-[200px] space-y-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Veld Naam</label><input type="text" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} placeholder="Bijv: Hoofdveld" className="w-full bg-white border border-slate-200 rounded-2xl p-4 font-bold outline-none"/></div><button onClick={handleAddField} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"><Plus size={18} /> Veld Toevoegen</button></div>
                    {fields.length > 0 && (<div className="pt-6 border-t border-slate-200 space-y-6"><div className="flex items-center gap-4"><label className="text-xs font-black text-slate-400 uppercase ml-1">Selecteer Veld:</label><select value={selectedFieldId || ''} onChange={e => setSelectedFieldId(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none">{fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div><div className="grid grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => { const r = Math.floor(i / 4), c = i % 4, block = selectedField?.blocks.find((b: any) => b.row === r && b.col === c); return (<div key={i} className={`h-40 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 p-4 cursor-pointer ${block ? 'bg-white border-green-500 shadow-md border-solid' : 'bg-white/50 border-slate-200 border-dashed hover:border-green-300 hover:bg-green-50/50'}`} onClick={() => { if (block) { setEditingBlock(block); setBlockForm({ name: block.name, bedCount: block.beds.length, length: block.length, bedWidth: block.bedWidth || 0.75, rotationGroupIds: block.rotationGroups?.map((rg: any) => rg.id) || [] }); } else { setPendingPosition({ row: r, col: c }); setBlockForm({ name: `Blok ${i+1}`, bedCount: 5, length: 10, bedWidth: 0.75, rotationGroupIds: [] }); setShowAddBlockModal(true); } }}>{block ? (<><span className="font-black text-slate-900">{block.name}</span><span className="text-[10px] font-bold text-slate-400 uppercase">{block.beds.length} bedden ({block.length}m)</span><span className="text-[9px] font-black text-green-600 uppercase">Breedte: {block.bedWidth}m</span><Edit2 size={14} className="text-green-600 mt-1" /></>) : (<><Plus size={20} className="text-slate-300" /><span className="text-[10px] font-black text-slate-300 uppercase">Blok Toevoegen</span></>)}</div>);})}</div></div>)}
                </div>
            </div>
        )}

        {activeTab === 'news' && (
          <div className="p-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Nieuws Beheren</h2>
            <form onSubmit={handleSaveNews} className="mb-12 bg-slate-50 p-8 rounded-2xl border border-slate-200 space-y-6">
              <div className="space-y-2"><label className="text-sm font-bold text-slate-500 ml-1">Titel</label><input type="text" required className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-4 outline-none" value={newsForm.title} onChange={(e) => setNewsForm({...newsForm, title: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-bold text-slate-500 ml-1">Bericht</label><textarea required className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-4 h-32 outline-none" value={newsForm.content} onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}></textarea></div>
              <button type="submit" disabled={savingNews} className="bg-green-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-tight disabled:opacity-50">{savingNews ? 'Opslaan...' : 'Plaatsen'}</button>
            </form>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 mb-4">Gepubliceerd Nieuws</h3>
              {news.map(post => (
                <div key={post.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</span>
                      <h4 className="font-black text-slate-900">{post.title}</h4>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{post.content}</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if(window.confirm('Bericht verwijderen?')) {
                        await fetch(`/api/news/${post.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                        fetchNews();
                      }
                    }}
                    className="p-2 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {news.length === 0 && <p className="text-slate-400 italic text-center py-10">Nog geen nieuwsberichten gepubliceerd.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCropForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"><div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-300"><div className="p-8 bg-slate-900 text-white flex justify-between items-center"><h2 className="text-2xl font-black tracking-tight">{editingCrop ? 'Gewas Bewerken' : 'Nieuw Gewas'}</h2><button onClick={() => setShowCropForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button></div><form onSubmit={handleSaveCrop} className="p-8 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="md:col-span-2 space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Naam Gewas</label><input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-green-500 shadow-sm" value={cropForm.name} onChange={e => setCropForm({...cropForm, name: e.target.value})} /></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Familie</label><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none cursor-pointer" value={cropForm.familyId} onChange={e => setCropForm({...cropForm, familyId: e.target.value})}>{families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Rotatie Groep</label><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none cursor-pointer" value={cropForm.rotationGroupId} onChange={e => setCropForm({...cropForm, rotationGroupId: e.target.value})}>{rotationGroups.map(rg => <option key={rg.id} value={rg.id}>{rg.name}</option>)}</select></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Voeding</label><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none" value={cropForm.nutrientLevel} onChange={e => setCropForm({...cropForm, nutrientLevel: parseInt(e.target.value)})}>{NUTRIENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}</select></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Plantgoed / m²</label><input type="number" step="0.1" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" value={cropForm.seedsPerSqm} onChange={e => setCropForm({...cropForm, seedsPerSqm: parseFloat(e.target.value)})} /></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Prijs per Plantgoed m² (€)</label><input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" value={cropForm.pricePerSeedSqm} onChange={e => setCropForm({...cropForm, pricePerSeedSqm: parseFloat(e.target.value)})} /></div></div><div className="flex gap-4 pt-4"><button type="submit" className="flex-grow bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all uppercase shadow-xl shadow-green-100">Opslaan</button></div></form></div></div>
      )}

      {showAddBlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"><div className="p-8 bg-slate-900 text-white flex justify-between items-center"><h2 className="text-2xl font-black tracking-tight">Nieuw Blok</h2><button onClick={() => setShowAddBlockModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button></div><form onSubmit={handleAddBlock} className="p-8 space-y-6"><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Naam</label><input type="text" required value={blockForm.name} onChange={e => setBlockForm({...blockForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-green-500 shadow-sm" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Aantal Bedden</label><input type="number" required value={blockForm.bedCount} onChange={e => setBlockForm({...blockForm, bedCount: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" /></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bedlengte (m)</label><input type="number" required value={blockForm.length} onChange={e => setBlockForm({...blockForm, length: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" /></div><div className="space-y-2 col-span-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bedbreedte (m)</label><input type="number" step="0.01" required value={blockForm.bedWidth} onChange={e => setBlockForm({...blockForm, bedWidth: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" /></div></div><button type="submit" className="w-full bg-green-600 text-white p-4 rounded-2xl font-black uppercase tracking-tight hover:bg-green-700 shadow-xl shadow-green-100 transition-all">Blok Aanmaken</button></form></div></div>
      )}

      {editingBlock && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"><div className="p-8 bg-slate-900 text-white flex justify-between items-center"><h2 className="text-2xl font-black tracking-tight">Blok Instellingen</h2><button onClick={() => setEditingBlock(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button></div><div className="p-8 space-y-6"><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Naam</label><input type="text" value={blockForm.name} onChange={e => setBlockForm({...blockForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-green-500 shadow-sm" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bedden</label><input type="number" value={blockForm.bedCount} onChange={e => setBlockForm({...blockForm, bedCount: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" /></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bedlengte (m)</label><input type="number" value={blockForm.length} onChange={e => setBlockForm({...blockForm, length: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" /></div><div className="space-y-2 col-span-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bedbreedte (m)</label><input type="number" step="0.01" value={blockForm.bedWidth} onChange={e => setBlockForm({...blockForm, bedWidth: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" /></div></div><div className="flex gap-4 pt-4"><button onClick={handleUpdateBlock} className="flex-grow bg-green-600 text-white p-4 rounded-2xl font-black uppercase hover:bg-green-700 shadow-xl shadow-green-100 transition-all">Opslaan</button><button onClick={() => { if(window.confirm('Wissen?')) fetch(`/api/teeltplan/blocks/${editingBlock.id}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}}).then(fetchFields).then(() => setEditingBlock(null)); }} className="bg-red-50 text-red-600 p-4 rounded-2xl font-black hover:bg-red-100 transition-all"><Trash2 size={24} /></button></div></div></div></div>
      )}
    </div>
  );
};

export default AdminDashboard;
