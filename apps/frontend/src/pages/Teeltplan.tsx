import { useState, useEffect, useRef, Fragment } from 'react';
import { 
  Calendar, Map as MapIcon, ClipboardList, Plus, CheckCircle, Clock, AlertTriangle,
  ChevronRight, ChevronLeft, Filter, Leaf, Settings, Trash2, Save, Grid3X3,
  Move, X, Edit2, ShieldCheck, RefreshCw, ArrowRight, ChevronDown, Sprout,
  Thermometer, Ruler, BarChart3, Scale, Euro, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RotationGroup { id: string; name: string; }
interface CropFamily { id: string; name: string; }
interface Crop {
  id: string; name: string; description: string | null; familyId: string | null; family?: CropFamily;
  rotationGroupId: string | null; rotationGroup?: RotationGroup; nutrientLevel: number;
  daysToMaturity: number; sowStart: string; sowEnd: string; minTemp: number | null;
  rowSpacing: number; plantSpacing: number; canBePrePost: boolean;
  seedsPerSqm: number; pricePerSeedSqm: number;
}
interface Bed { id: string; name: string; width: number; length: number; cultivations: Cultivation[]; }
interface Block { id: string; name: string; row: number; col: number; length: number; bedWidth: number; beds: Bed[]; rotationGroups: RotationGroup[]; }
interface Field { id: string; name: string; blocks: Block[]; }
interface Cultivation {
  id: string; cropId: string; crop: Crop; bedId: string;
  bed: { id: string, name: string, block: { id: string, name: string, bedWidth: number, length: number, rotationGroups: RotationGroup[] } };
  year: number; quantity: number; startDate: string; sowDate: string | null;
  harvestDate: string | null; endDate: string;
}

const NUTRIENT_LEVELS = [
  { value: 1, label: 'Sluimerend (Laag)', color: 'bg-blue-100 text-blue-700' },
  { value: 2, label: 'Gemiddeld', color: 'bg-green-100 text-green-700' },
  { value: 3, label: 'Gulzig (Hoog)', color: 'bg-orange-100 text-orange-700' }
];
const MONTHS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

const Teeltplan = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'tasks' | 'order'>('overview');
  const [fields, setFields] = useState<Field[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [rotationGroups, setRotationGroups] = useState<RotationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{id: string, name: string, blockId: string, blockName: string, bedWidth: number, rotationGroups: RotationGroup[] } | null>(null);
  const [selectedCultivation, setSelectedCultivation] = useState<Cultivation | null>(null);
  const [planForm, setPlanForm] = useState({
    cropId: '', year: 2026, quantity: 10, startDate: '', sowDate: '', harvestDate: '', endDate: ''
  });

  const [blockForm, setBlockForm] = useState({ rotationGroupIds: [] as string[] });

  const [dragState, setDragState] = useState<{id: string, mode: 'move' | 'resize-start' | 'resize-end', initialX: number, initialStart: number, initialEnd: number, targetBedId?: string} | null>(null);
  const [dragPreview, setDragPreview] = useState<{left: number, width: number} | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchInitialData(); }, [token]);
  useEffect(() => { fetchData(); }, [token, currentWeek, activeYear]);

  const fetchInitialData = async () => {
    try {
      const [cropsRes, groupsRes, settingsRes] = await Promise.all([
        fetch('/api/crops'),
        fetch('/api/teeltplan/rotation-groups'),
        fetch('/api/settings')
      ]);
      if (cropsRes.ok) setCrops(await cropsRes.json());
      if (groupsRes.ok) setRotationGroups(await groupsRes.json());
      if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.active_year) setActiveYear(parseInt(settings.active_year));
      }
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fieldsRes, tasksRes] = await Promise.all([
        fetch(`/api/teeltplan/fields?year=${activeYear}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/teeltplan/tasks/weekly?date=${currentWeek.toISOString()}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (fieldsRes.ok) {
        const data = await fieldsRes.json();
        setFields(data);
        if (data.length > 0 && !selectedBlockId) {
            const firstBlock = data[0].blocks[0];
            if (firstBlock) setSelectedBlockId(firstBlock.id);
        }
      }
      if (tasksRes.ok) setWeeklyTasks(await tasksRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSaveCultivation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedBed) return;
    try {
      const method = selectedCultivation ? 'PATCH' : 'POST';
      const url = selectedCultivation ? `/api/teeltplan/cultivations/${selectedCultivation.id}` : '/api/teeltplan/cultivations';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...planForm, bedId: selectedBed.id, quantity: parseFloat(planForm.quantity.toString()) })
      });
      if (res.ok) { setShowPlanModal(false); fetchData(); }
      else { const err = await res.json(); alert(err.error || 'Fout'); }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCultivationDirect = async (id: string) => {
    try {
      const res = await fetch(`/api/teeltplan/cultivations/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleUpdateBlockRotation = async () => {
    if (!selectedBlockId) return;
    try {
      const res = await fetch(`/api/teeltplan/blocks/${selectedBlockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rotationGroupIds: blockForm.rotationGroupIds })
      });
      if (res.ok) { setShowRotationModal(false); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const openPlanModal = (bed: any, block: any, cultivation?: Cultivation) => {
    setSelectedBed({ id: bed.id, name: bed.name, blockId: block.id, blockName: block.name, bedWidth: block.bedWidth, rotationGroups: block.rotationGroups || [] });
    if (cultivation) {
      setSelectedCultivation(cultivation);
      setPlanForm({ cropId: cultivation.cropId, year: cultivation.year, quantity: cultivation.quantity, startDate: cultivation.startDate.split('T')[0], sowDate: cultivation.sowDate ? cultivation.sowDate.split('T')[0] : '', harvestDate: cultivation.harvestDate ? cultivation.harvestDate.split('T')[0] : '', endDate: cultivation.endDate.split('T')[0] });
    } else {
      setSelectedCultivation(null);
      setPlanForm({ cropId: '', year: activeYear, quantity: block.length, startDate: new Date(activeYear, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0], sowDate: '', harvestDate: '', endDate: '' });
    }
    setShowPlanModal(true);
  };

  const getTimelinePos = (dateStr: string) => {
    const d = new Date(dateStr), startOfYear = new Date(activeYear, 0, 1).getTime(), endOfYear = new Date(activeYear, 11, 31, 23, 59, 59).getTime();
    return Math.max(0, Math.min(100, ((d.getTime() - startOfYear) / (endOfYear - startOfYear)) * 100));
  };

  const getDateFromPos = (percent: number) => {
    const dayIndex = Math.floor((percent / 100) * 365);
    return new Date(activeYear, 0, 1 + dayIndex).toISOString().split('T')[0];
  };

  const getCultivationStatus = (cult: Cultivation) => {
    const now = new Date();
    const start = new Date(cult.startDate);
    const end = new Date(cult.endDate);
    const harvest = cult.harvestDate ? new Date(cult.harvestDate) : null;

    if (now > end) return 'VOLTOOID';
    if (harvest && now >= harvest) return 'OOGSTKLAAR';
    if (now >= start) return 'GROEIEND';
    return 'GEPLAND';
  };

  const handleTimelineMouseDown = (e: React.MouseEvent, cult: Cultivation, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    const s = getTimelinePos(cult.startDate), eP = getTimelinePos(cult.endDate);
    setDragState({ id: cult.id, mode, initialX: e.clientX, initialStart: s, initialEnd: eP, targetBedId: cult.bedId });
    setDragPreview({ left: s, width: eP - s });
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const delta = ((e.clientX - dragState.initialX) / (rect.width - 192)) * 100;
    let ns = dragState.initialStart, ne = dragState.initialEnd;
    if (dragState.mode === 'move') { ns += delta; ne += delta; }
    else if (dragState.mode === 'resize-start') ns += delta;
    else if (dragState.mode === 'resize-end') ne += delta;
    setDragPreview({ left: ns, width: ne - ns });
  };

  const handleTimelineMouseUp = async () => {
    if (!dragState || !dragPreview) return;
    try {
      await fetch(`/api/teeltplan/cultivations/${dragState.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ startDate: getDateFromPos(dragPreview.left), endDate: getDateFromPos(dragPreview.left + dragPreview.width), bedId: dragState.targetBedId }) });
      fetchData();
    } catch (e) { console.error(e); }
    setDragState(null); setDragPreview(null);
  };

  const handleMouseEnterBed = (bedId: string) => { if (dragState && dragState.mode === 'move' && dragState.targetBedId !== bedId) setDragState({ ...dragState, targetBedId: bedId }); };
  const toggleTaskStatus = async (taskId: string, currentStatus: string) => { const status = currentStatus === 'DONE' ? 'TODO' : 'DONE'; try { await fetch(`/api/teeltplan/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) }); fetchData(); } catch (error) { console.error(error); } };
  const changeWeek = (offset: number) => { const n = new Date(currentWeek); n.setDate(currentWeek.getDate() + (offset * 7)); setCurrentWeek(n); };
  const formatDate = (d: string) => new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
  const getWeekNumber = (d: Date) => { const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), dn = dt.getUTCDay() || 7; dt.setUTCDate(dt.getUTCDate() + 4 - dn); return Math.ceil((((dt.getTime() - new Date(Date.UTC(dt.getUTCFullYear(), 0, 1)).getTime()) / 86400000) + 1) / 7); };

  const getStackedCultivations = (cults: Cultivation[], preview?: { id: string, start: string, end: string }) => {
    const allItems = [...cults];
    if (preview) {
        const existingIdx = allItems.findIndex(c => c.id === preview.id);
        if (existingIdx !== -1) allItems.splice(existingIdx, 1);
        allItems.push({ id: preview.id, startDate: preview.start, endDate: preview.end } as any);
    }
    const sorted = allItems.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), lanes: number[] = [];
    return sorted.map(c => {
        const start = new Date(c.startDate).getTime(), end = new Date(c.endDate).getTime();
        let laneIndex = -1;
        for (let i = 0; i < lanes.length; i++) { if (lanes[i] < start) { laneIndex = i; break; } }
        if (laneIndex === -1) { lanes.push(end); laneIndex = lanes.length - 1; } else { lanes[laneIndex] = end; }
        return { ...c, lane: laneIndex };
    });
  };

  const getOrderList = () => {
      const allCults = fields.flatMap(f => f.blocks).flatMap(b => b.beds).flatMap(bed => bed.cultivations);
      const groups: Record<string, any[]> = {};
      allCults.forEach(c => {
          if (!groups[c.crop.name]) groups[c.crop.name] = [];
          groups[c.crop.name].push(c);
      });

      const list = Object.entries(groups).map(([name, cults]) => {
          const crop = crops.find(cr => cr.name === name);
          const sortedCults = cults.sort((a, b) => new Date(a.sowDate || a.startDate).getTime() - new Date(b.sowDate || b.startDate).getTime());
          const totalQty = sortedCults.reduce((sum, c) => {
              const block = fields.flatMap(f=>f.blocks).find(b => b.beds.some(bd => bd.id === c.bedId));
              return sum + (c.quantity * (block?.bedWidth || 0.75) * (crop?.seedsPerSqm || 0));
          }, 0);
          const totalCost = sortedCults.reduce((sum, c) => {
              const block = fields.flatMap(f=>f.blocks).find(b => b.beds.some(bd => bd.id === c.bedId));
              return sum + (c.quantity * (block?.bedWidth || 0.75) * (crop?.pricePerSeedSqm || 0));
          }, 0);
          return { name, crop, cults: sortedCults, totalQty, totalCost, firstDate: sortedCults[0]?.sowDate || sortedCults[0]?.startDate };
      }).sort((a, b) => new Date(a.firstDate).getTime() - new Date(b.firstDate).getTime());

      const grandTotal = list.reduce((sum, item) => sum + item.totalCost, 0);
      return { list, grandTotal };
  };

  if (loading && fields.length === 0) return <div className="text-center py-20 font-black text-slate-400 animate-pulse">LADEN...</div>;

  const allBlocks = fields.flatMap(f => f.blocks);
  const selectedBlock = allBlocks.find(b => b.id === selectedBlockId) || allBlocks[0];
  const filteredCrops = selectedBed ? crops.filter(c => selectedBed.rotationGroups.some(rg => rg.id === c.rotationGroupId)) : crops;
  const selectedCrop = crops.find(c => c.id === planForm.cropId);
  const { list: orderList, grandTotal } = getOrderList();

  return (
    <div className="max-w-[98%] mx-auto px-4 pb-20" onMouseMove={handleTimelineMouseMove} onMouseUp={handleTimelineMouseUp}>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        <div><h1 className="text-4xl font-black text-slate-900 tracking-tight">Teeltplan <span className="text-green-600">{activeYear}</span></h1><p className="text-slate-500 font-medium font-bold">Beheer je velden per blok.</p></div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'Overzicht', icon: <MapIcon size={18} /> },
            { id: 'timeline', label: 'Tijdlijn', icon: <BarChart3 size={18} /> },
            { id: 'order', label: 'Bestellijst', icon: <ShoppingCart size={18} /> },
            { id: 'tasks', label: 'Taaklijst', icon: <ClipboardList size={18} /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap px-10 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-slate-500 hover:bg-slate-50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {(activeTab === 'overview' || activeTab === 'timeline') && selectedBlock && (
        <div className="bg-white p-6 rounded-3xl mb-8 border border-slate-100 flex flex-wrap justify-between items-center gap-6 shadow-sm ring-1 ring-slate-50">
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <MapIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 z-10" size={20} />
                    <select value={selectedBlockId || ''} onChange={e => setSelectedBlockId(e.target.value)} className="bg-slate-900 text-white pl-12 pr-10 py-4 rounded-2xl font-black text-lg outline-none focus:ring-4 focus:ring-green-500/20 appearance-none cursor-pointer transition-all shadow-xl shadow-slate-200">
                        {allBlocks.map(b => (<option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={20} />
                </div>
                <div>
                    <div className="flex flex-wrap gap-2 mb-1">{selectedBlock.rotationGroups?.map(rg => (<span key={rg.id} className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-200">{rg.name}</span>))}</div>
                    <button onClick={() => { setBlockForm({ rotationGroupIds: selectedBlock.rotationGroups?.map(rg => rg.id) || [] }); setShowRotationModal(true); }} className="text-[10px] font-black text-slate-400 hover:text-green-600 uppercase flex items-center gap-1 transition-colors tracking-tighter"><Edit2 size={10} /> ROTATIEGROEPEN AANPASSEN</button>
                </div>
            </div>
            <div className="flex gap-10">
                <div className="text-center"><span className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Capaciteit</span><span className="text-2xl font-black text-slate-900">{selectedBlock.beds.length} bedden × {selectedBlock.length}m</span></div>
                <div className="text-center"><span className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Oppervlakte</span><span className="text-2xl font-black text-green-600">{selectedBlock.beds.length * selectedBlock.length * selectedBlock.bedWidth} m²</span></div>
            </div>
        </div>
      )}

      {activeTab === 'timeline' && selectedBlock && (
        <div ref={timelineRef} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in select-none">
            <div className="overflow-x-auto"><div className="min-w-[1400px]">
                <div className="flex border-b border-slate-100 bg-slate-900 text-white"><div className="w-48 shrink-0 p-4 border-r border-white/10 font-black uppercase text-[10px] tracking-widest">Bed-indeling</div><div className="flex flex-grow">{MONTHS.map(m => (<div key={m} className="flex-1 text-center py-4 border-r border-white/5 font-black text-xs uppercase tracking-widest">{m}</div>))}</div></div>
                <div className="divide-y divide-slate-50">{selectedBlock.beds.map((bed, index) => {
                    const isTarget = dragState?.targetBedId === bed.id;
                    const previewData = (isTarget && dragPreview) ? { id: dragState.id, start: getDateFromPos(dragPreview.left), end: getDateFromPos(dragPreview.left + dragPreview.width) } : undefined;
                    const stacked = getStackedCultivations(bed.cultivations, previewData);
                    const maxLanes = stacked.length > 0 ? Math.max(...stacked.map(s => s.lane)) + 1 : 1;
                    const rowHeight = maxLanes * 48;

                    return (
                        <div key={bed.id} onMouseEnter={() => handleMouseEnterBed(bed.id)} className={`flex transition-all border-b border-slate-200 relative ${isTarget ? 'bg-green-100/50' : (index % 2 === 0 ? 'bg-white' : 'bg-slate-100/50')}`} style={{ height: `${rowHeight}px` }}>
                            <div className={`w-48 shrink-0 px-4 flex items-center border-r border-slate-200 text-[10px] font-black text-slate-500 uppercase ${index % 2 === 0 ? 'bg-white' : 'bg-slate-100/20'}`}>{bed.name}</div>
                            <div className="flex-grow relative">
                                <div className="absolute inset-0 flex">{MONTHS.map((_, i) => <div key={i} className="flex-1 border-r border-slate-100/50" />)}</div>
                                {stacked.map(cult => {
                                    const start = getTimelinePos(cult.startDate), end = getTimelinePos(cult.endDate), width = end - start;
                                    const isPreview = isTarget && cult.id === dragState?.id;
                                    const isDraggingFromHere = dragState?.id === cult.id && !isTarget;
                                    const status = getCultivationStatus(cult);

                                    if (isDraggingFromHere) return null;

                                    return (
                                        <div key={cult.id} onMouseDown={(e) => !isPreview && handleTimelineMouseDown(e, cult, 'move')} className={`absolute h-10 rounded-xl flex items-center justify-between px-2 transition-all z-10 group/item ${isPreview ? 'bg-green-600/40 border-2 border-dashed border-green-600 cursor-grabbing pointer-events-none' : (status === 'VOLTOOID' ? 'bg-slate-200 text-slate-500 border border-slate-300' : status === 'OOGSTKLAAR' ? 'bg-green-600 text-white shadow-lg shadow-green-100 border border-green-700' : status === 'GROEIEND' ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-orange-100 text-orange-700 cursor-move border border-orange-200')}`} style={{ left: `${start}%`, width: `${width}%`, top: `${cult.lane * 44 + 4}px` }}>
                                            {!isPreview && <div onMouseDown={(e) => handleTimelineMouseDown(e, cult, 'resize-start')} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-l-xl" />}
                                            {!isPreview && <div onMouseDown={(e) => handleTimelineMouseDown(e, cult, 'resize-end')} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-r-xl" />}
                                            <span className="text-[9px] font-black uppercase tracking-tighter truncate flex-grow text-center px-1">{cult.crop?.name}</span>
                                            {!isPreview && <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                <button onMouseDown={(e) => { e.stopPropagation(); openPlanModal(bed, selectedBlock, cult); }} className="p-1 hover:bg-white/20 rounded-lg"><Edit2 size={12} /></button>
                                            </div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}</div></div></div>
        </div>
      )}

      {activeTab === 'overview' && selectedBlock && (
        <div className="animate-in fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {selectedBlock.beds.map(bed => {
                const now = new Date();
                const activeC = bed.cultivations.filter(c => new Date(c.endDate) >= now);
                return (
                    <div key={bed.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col hover:border-green-200 transition-all group/bed">
                        <div className="bg-slate-900 p-4 text-white flex justify-between items-center transition-colors group-hover/bed:bg-slate-800"><h3 className="text-xs font-black uppercase tracking-widest">{bed.name}</h3><button onClick={() => openPlanModal(bed, selectedBlock)} className="p-1.5 bg-green-600 hover:bg-green-500 rounded-lg transition-all shadow-lg shadow-green-900/20"><Plus size={14}/></button></div>
                        <div className="p-4 space-y-3 flex-grow">
                            {activeC.length > 0 ? activeC.map(cult => {
                                const status = getCultivationStatus(cult);
                                return (
                                    <div key={cult.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2 group hover:bg-white hover:border-green-100 transition-all cursor-default">
                                        <div className="flex justify-between items-start"><div className="flex items-center gap-2"><Leaf size={14} className="text-green-500" /><span className="font-black text-xs text-slate-800">{cult.crop.name}</span></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openPlanModal(bed, selectedBlock, cult)} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-green-600"><Edit2 size={12}/></button><button onClick={() => { if(window.confirm('Wissen?')) handleDeleteCultivationDirect(cult.id); }} className="p-1 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-600"><Trash2 size={12}/></button></div></div>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <span>{cult.quantity}m</span>
                                            <span className={`px-1.5 py-0.5 rounded ${status === 'OOGSTKLAAR' ? 'bg-green-600 text-white' : status === 'GROEIEND' ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {status.charAt(0) + status.slice(1).toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }) : <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-50 rounded-2xl"><span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Bed Vrij</span></div>}
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {activeTab === 'order' && (
          <div className="animate-in fade-in space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl flex justify-between items-center">
                  <div><h2 className="text-2xl font-black tracking-tight mb-1">Bestellijst Plantgoed</h2><p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Overzicht benodigdheden {activeYear}</p></div>
                  <div className="text-right"><span className="block text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Totaalbedrag</span><span className="text-3xl font-black text-green-400">€ {grandTotal.toFixed(2)}</span></div>
              </div>
              
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="py-4 px-6">Gewas / Datum</th>
                              <th className="py-4 px-6 text-center">Oppervlakte</th>
                              <th className="py-4 px-6 text-center">Afmetingen</th>
                              <th className="py-4 px-6 text-center">Hoeveelheid</th>
                              <th className="py-4 px-6 text-right">Prijs</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {orderList.map(item => (
                              <Fragment key={item.name}>
                                  <tr className="bg-green-50/30">
                                      <td colSpan={3} className="py-3 px-6"><div className="flex items-center gap-2"><Sprout size={14} className="text-green-600"/><span className="font-black text-slate-900 uppercase text-sm">{item.name}</span></div></td>
                                      <td className="py-3 px-6 text-center font-black text-slate-900 text-sm">{item.totalQty.toFixed(0)}</td>
                                      <td className="py-3 px-6 text-right font-black text-green-700 text-sm">€ {item.totalCost.toFixed(2)}</td>
                                  </tr>
                                  {item.cults.map((c: any) => {
                                      const block = allBlocks.find(b => b.beds.some(bd => bd.id === c.bedId));
                                      const area = c.quantity * (block?.bedWidth || 0.75);
                                      const qty = area * (item.crop?.seedsPerSqm || 0);
                                      const price = area * (item.crop?.pricePerSeedSqm || 0);
                                      return (
                                          <tr key={c.id} className="text-xs hover:bg-slate-50 transition-colors">
                                              <td className="py-3 px-10 text-slate-500 font-bold">{formatDate(c.sowDate || c.startDate)}</td>
                                              <td className="py-3 px-6 text-center text-slate-900 font-black">{area.toFixed(2)} m²</td>
                                              <td className="py-3 px-6 text-center text-slate-400 font-bold">{c.quantity}m × {block?.bedWidth}m</td>
                                              <td className="py-3 px-6 text-center text-slate-600 font-bold">{qty.toFixed(0)}</td>
                                              <td className="py-3 px-6 text-right text-slate-600 font-bold">€ {price.toFixed(2)}</td>
                                          </tr>
                                      );
                                  })}
                              </Fragment>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl"><button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button><div className="text-center"><span className="text-[10px] font-black uppercase text-white/50 block mb-1">Week {getWeekNumber(currentWeek)}</span><span className="text-xl font-black">{formatDate(currentWeek.toISOString())} - {formatDate(new Date(new Date(currentWeek).setDate(currentWeek.getDate() + 6)).toISOString())}</span></div><button onClick={() => changeWeek(1)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={24} /></button></div>
          <div className="grid grid-cols-1 gap-4">{weeklyTasks.length > 0 ? (weeklyTasks.map((t) => (<div key={t.id} className={`bg-white p-6 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-6 transition-all ${t.status === 'DONE' ? 'border-green-100 opacity-60' : 'border-slate-50 shadow-sm hover:border-green-200'}`}><button onClick={() => toggleTaskStatus(t.id, t.status)} className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${t.status === 'DONE' ? 'bg-green-500 text-white' : 'border-2 border-slate-100 text-slate-200 hover:border-green-500'}`}><CheckCircle size={24} /></button><div className="flex-grow text-center md:text-left"><span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-tighter">{t.type.replace('_', ' ')}</span><h3 className="text-lg font-black text-slate-800">{t.cultivation.crop.name}</h3><p className="text-slate-500 font-medium">{t.description}</p></div><div className="shrink-0 flex flex-col items-center md:items-end gap-1"><div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase"><MapIcon size={14} />{t.cultivation.bed.block.name}, {t.cultivation.bed.name}</div></div></div>))) : (<div className="bg-white rounded-[2.5rem] p-20 border-2 border-dashed border-slate-100 text-center"><ClipboardList size={40} className="mx-auto text-slate-200 mb-4"/><h3 className="text-xl font-black text-slate-400">Geen taken</h3></div>)}</div>
        </div>
      )}

      {/* Modals */}
      {showRotationModal && selectedBlock && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center"><h2 className="text-2xl font-black tracking-tight">Rotatiegroepen</h2><button onClick={() => setShowRotationModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button></div>
                <div className="p-8 space-y-6">
                    <p className="text-sm font-bold text-slate-500">Selecteer welke gewasgroepen op dit blok mogen staan dit seizoen:</p>
                    <div className="flex flex-wrap gap-2">
                        {rotationGroups.map(rg => (
                            <button key={rg.id} type="button" onClick={() => { const current = blockForm.rotationGroupIds; const nc = current.includes(rg.id) ? current.filter(id => id !== rg.id) : [...current, rg.id]; setBlockForm({ ...blockForm, rotationGroupIds: nc }); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm ${blockForm.rotationGroupIds.includes(rg.id) ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{rg.name}</button>
                        ))}
                    </div>
                    <button onClick={handleUpdateBlockRotation} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase shadow-xl hover:bg-slate-800 transition-all">Bijwerken</button>
                </div>
            </div>
        </div>
      )}

      {showPlanModal && selectedBed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"><div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-300"><div className="p-8 bg-slate-900 text-white flex justify-between items-center"><div><h2 className="text-2xl font-black tracking-tight">{selectedCultivation ? 'Teelt Bewerken' : 'Nieuwe Teelt Inplannen'}</h2><p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">{selectedBed.blockName}, {selectedBed.name}</p></div><button onClick={() => setShowPlanModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button></div><form onSubmit={handleSaveCultivation} className="p-8 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="md:col-span-2 space-y-2"><div className="flex justify-between items-center"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gewas</label><span className="text-[10px] font-black text-green-600 uppercase flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full"><ShieldCheck size={12} /> Strikte Rotatie</span></div><select value={planForm.cropId} onChange={e => setPlanForm({...planForm, cropId: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-green-500 shadow-sm cursor-pointer"><option value="">Kies een gewas...</option>{filteredCrops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Lengte (m)</label><input type="number" step="0.1" value={planForm.quantity} onChange={e => setPlanForm({...planForm, quantity: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold" /></div>
                
                {selectedCrop && (
                    <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Scale size={18} className="text-slate-400" />
                            <div>
                                <span className="font-bold">{ (planForm.quantity * selectedBed.bedWidth * selectedCrop.seedsPerSqm).toFixed(0) }</span>
                                <span className="text-xs uppercase ml-1 opacity-60">stuks/gram benodigd</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-400 text-xs mr-2">Kosten:</span>
                            <span className="font-black text-slate-900">€ { (planForm.quantity * selectedBed.bedWidth * selectedCrop.pricePerSeedSqm).toFixed(2) }</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-green-600">Start (Prep)</label><input type="date" value={planForm.startDate} onChange={e => setPlanForm({...planForm, startDate: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-green-500 shadow-sm" /></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-orange-600">Zaai/Plant</label><input type="date" value={planForm.sowDate} onChange={e => setPlanForm({...planForm, sowDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-orange-500 shadow-sm" /></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-green-600">Oogst Start</label><input type="date" value={planForm.harvestDate} onChange={e => setPlanForm({...planForm, harvestDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-green-500 shadow-sm" /></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-red-600">Eind Datum</label><input type="date" value={planForm.endDate} onChange={e => setPlanForm({...planForm, endDate: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-red-500 shadow-sm" /></div></div><div className="flex gap-4 pt-4"><button type="submit" className="flex-grow bg-green-600 text-white p-4 rounded-2xl font-black uppercase hover:bg-green-700 shadow-xl shadow-green-100 transition-all">{selectedCultivation ? 'Wijzigingen Opslaan' : 'In Planning Zetten'}</button>{selectedCultivation && (<button type="button" onClick={() => { if(window.confirm('Teelt verwijderen?')) fetch(`/api/teeltplan/cultivations/${selectedCultivation.id}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}}).then(fetchData).then(() => setShowPlanModal(false)); }} className="bg-red-50 text-red-600 p-4 rounded-2xl font-black hover:bg-red-100 transition-all"><Trash2 size={24} /></button>)}</div></form></div></div>
      )}
    </div>
  );
};

export default Teeltplan;
