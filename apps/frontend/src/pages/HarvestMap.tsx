import { useState, useEffect } from 'react';
import { Map as MapIcon, Clock, Leaf, AlertTriangle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Crop {
  id: string;
  name: string;
  description: string | null;
}

interface RotationGroup {
  id: string;
  name: string;
}

interface Cultivation {
  id: string;
  crop: Crop;
  status: string;
  startDate: string;
  endDate: string;
  harvestDate: string | null;
}

interface Bed {
  id: string;
  name: string;
  cultivations: Cultivation[];
}

interface Block {
  id: string;
  name: string;
  row: number;
  col: number;
  length: number;
  beds: Bed[];
  rotationGroups: RotationGroup[];
}

interface Field {
  id: string;
  name: string;
  blocks: Block[];
}

const HarvestMap = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const { token } = useAuth();
  const now = new Date();

  useEffect(() => {
    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const settings = await res.json();
                if (settings.active_year) {
                    setActiveYear(parseInt(settings.active_year));
                }
            }
        } catch (error) { console.error(error); }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        // We use activeYear here which is either current year or the one from settings
        const response = await fetch(`/api/teeltplan/fields?year=${activeYear}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setFields(data);
        }
      } catch (error) {
        console.error('Failed to fetch fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [token, activeYear]);

  const getStatus = (cult: Cultivation) => {
    const start = new Date(cult.startDate);
    const end = new Date(cult.endDate);
    const harvest = cult.harvestDate ? new Date(cult.harvestDate) : null;

    if (now > end) return 'VOLTOOID';
    if (harvest && now >= harvest) return 'OOGSTKLAAR';
    if (now >= start) return 'GROEIEND';
    return 'GEPLAND';
  };

  if (loading && fields.length === 0) {
    return <div className="text-center p-12 text-slate-500 animate-pulse font-bold uppercase tracking-widest">Oogstkaart laden...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Oogstkaart <span className="text-green-600">{activeYear}</span></h1>
          <p className="text-slate-500 font-medium italic">Klik op een blok voor de actuele status van de gewassen.</p>
        </div>
      </div>

      {fields.length === 0 && !loading ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center space-y-4 shadow-xl">
            <AlertTriangle size={48} className="mx-auto text-orange-400" />
            <h2 className="text-2xl font-black text-slate-900">Geen teeltplan gevonden</h2>
            <p className="text-slate-500">Er zijn voor het jaar {activeYear} nog geen gewassen ingepland.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-16">
            {fields.map(field => {
                const maxRow = Math.max(...field.blocks.map(b => b.row), 0);
                const maxCol = Math.max(...field.blocks.map(b => b.col), 0);
                const grid = [];
                for (let r = 0; r <= maxRow; r++) {
                    const row = [];
                    for (let c = 0; c <= maxCol; c++) {
                        row.push(field.blocks.find(b => b.row === r && b.col === c));
                    }
                    grid.push(row);
                }

                return (
                    <div key={field.id} className="space-y-6">
                        <div className="flex items-center gap-3 ml-2">
                            <MapIcon className="text-green-600" size={20} />
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{field.name}</h2>
                        </div>

                        <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-4 overflow-x-auto">
                                <div className="min-w-[800px] md:min-w-0 space-y-4">
                                {grid.map((row, rowIndex) => (
                                    <div key={rowIndex} className="flex gap-4">
                                    {row.map((block, colIndex) => {
                                        if (!block) return <div key={`empty-${rowIndex}-${colIndex}`} className="flex-1 h-48 bg-slate-50/20 rounded-3xl border-2 border-dashed border-slate-100" />;
                                        
                                        const allCults = block.beds.flatMap(bed => bed.cultivations);
                                        const harvestableCount = allCults.filter(c => getStatus(c) === 'OOGSTKLAAR').length;

                                        return (
                                        <div 
                                            key={block.id}
                                            onClick={() => setSelectedBlock(block)}
                                            className={`flex-1 group relative h-48 p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col ${
                                            selectedBlock?.id === block.id 
                                                ? 'ring-4 ring-green-500/20 border-green-500 bg-green-50/30' 
                                                : 'border-slate-100 hover:border-green-200 hover:bg-slate-50/50 shadow-sm bg-white'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg block w-fit mb-1 ${
                                                        selectedBlock?.id === block.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {block.name}
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {block.rotationGroups?.map(rg => (
                                                            <span key={rg.id} className="text-[7px] font-black uppercase text-slate-300 tracking-tighter">{rg.name}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {harvestableCount > 0 && (
                                                    <Leaf size={16} className="text-green-500 animate-bounce" />
                                                )}
                                            </div>

                                            <div className="flex-grow space-y-1 overflow-hidden mt-2">
                                            {allCults.length > 0 ? (
                                                allCults.slice(0, 4).map((cult, i) => {
                                                    const status = getStatus(cult);
                                                    return (
                                                        <div 
                                                            key={`${cult.id}-${i}`} 
                                                            className={`text-[10px] font-bold truncate flex items-center gap-1.5 ${
                                                                status === 'OOGSTKLAAR' ? 'text-green-700' : status === 'GROEIEND' ? 'text-slate-600' : 'text-slate-300'
                                                            }`}
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                                status === 'OOGSTKLAAR' ? 'bg-green-500' : status === 'GROEIEND' ? 'bg-amber-400' : 'bg-slate-100'
                                                            }`} />
                                                            {cult.crop.name}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="h-full flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-slate-200 uppercase italic">Onbeplant</span>
                                                </div>
                                            )}
                                            {allCults.length > 4 && (
                                                <div className="text-[9px] font-black text-slate-300 uppercase pl-3">
                                                    +{allCults.length - 4} meer...
                                                </div>
                                            )}
                                            </div>

                                            {allCults.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100/50 flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{harvestableCount} klaar</span>
                                                <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-green-500" 
                                                        style={{ width: `${(harvestableCount / allCults.length) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>
                );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-8 animate-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black mb-8 pb-4 border-b border-white/10 flex justify-between items-center">
                Blok Info
                {selectedBlock && <span className="text-green-500 text-sm font-black">{selectedBlock.name}</span>}
              </h2>

              {selectedBlock ? (
                <div className="space-y-6">
                  {selectedBlock.beds.some(b => b.cultivations.length > 0) ? (
                    selectedBlock.beds.map(bed => (
                      bed.cultivations.map((cult, i) => {
                        const status = getStatus(cult);
                        return (
                            <div key={`${bed.id}-${i}`} className={`animate-in fade-in slide-in-from-bottom-2 ${status === 'GEPLAND' ? 'opacity-40' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-sm font-black text-white">{cult.crop.name}</h3>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{bed.name}</span>
                                </div>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-black text-[9px] tracking-widest uppercase ${
                                status === 'OOGSTKLAAR' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                                status === 'GROEIEND' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                'bg-white/5 border-white/10 text-slate-500'
                                }`}>
                                {status === 'OOGSTKLAAR' ? <Leaf size={10} /> : status === 'GROEIEND' ? <Clock size={10} /> : <Calendar size={10} />}
                                {status === 'OOGSTKLAAR' ? 'Oogstklaar' : status === 'GROEIEND' ? 'Groeiend' : 'Binnenkort'}
                                </div>
                            </div>
                        );
                      })
                    ))
                  ) : (
                    <p className="text-slate-500 italic text-center py-10">Dit blok is momenteel onbeplant.</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-20">
                  <MapIcon size={48} className="mx-auto text-slate-700 mb-4" />
                  <p className="text-slate-400 font-medium leading-relaxed">Selecteer een blok op de kaart voor de actuele status.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HarvestMap;
