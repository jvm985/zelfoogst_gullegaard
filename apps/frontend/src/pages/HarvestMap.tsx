import { useState, useEffect } from 'react';
import { Map as MapIcon, CheckCircle, Clock, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Crop {
  id: string;
  name: string;
  description: string | null;
  isHarvestable: boolean;
  fieldLocation: string | null;
}

const HarvestMap = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await fetch('/api/crops', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
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

    fetchCrops();
  }, [token]);

  // Define the specific field layout: 3 rows, 4 columns
  const fieldLayout = [
    { cells: ["Bloemen", "Blok 1", "Blok 2", "Blok 3"] },
    { cells: ["Kruiden", "Blok 4", "Blok 5", "Blok 6"] },
    { cells: ["Tunnel 1", "Tunnel 2", "Tunnel 3", "Tunnel 4"] }
  ];

  const cropsAtSelectedLocation = crops.filter(c => c.fieldLocation === selectedLocation);

  if (loading) {
    return <div className="text-center p-12 text-slate-500 animate-pulse font-bold uppercase tracking-widest">Veldindeling laden...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Wat kunnen we oogsten?</h1>
        <p className="text-slate-500 font-medium italic">Klik op een vak voor meer details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Visual Map Container */}
        <div className="lg:col-span-3 space-y-8">
          <div className="relative group">
            {/* Street indicator - Full width, directly against the grid */}
            <div className="w-full bg-slate-700 py-3 rounded-t-3xl flex items-center justify-center gap-4 text-white/80 font-black uppercase tracking-[0.5em] text-xs shadow-inner">
              <div className="h-px w-12 bg-white/20 hidden sm:block"></div>
              Straatkant
              <div className="h-px w-12 bg-white/20 hidden sm:block"></div>
            </div>

            {/* Field Grid */}
            <div className="bg-white p-4 md:p-8 rounded-b-[2.5rem] border-x border-b border-slate-200 shadow-2xl space-y-4 overflow-x-auto">
              <div className="min-w-[800px] md:min-w-0 space-y-4">
                {fieldLayout.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-4 gap-4">
                    {row.cells.map(cellName => {
                      const allCropsInCell = crops.filter(c => c.fieldLocation === cellName);
                      const harvestableInCell = allCropsInCell.filter(c => c.isHarvestable);
                      const hasSomeHarvestable = harvestableInCell.length > 0;

                      return (
                        <div 
                          key={cellName}
                          onClick={() => setSelectedLocation(cellName)}
                          className={`group relative h-48 p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col ${
                            selectedLocation === cellName 
                              ? 'ring-4 ring-green-500/20 border-green-500 bg-green-50/30' 
                              : 'border-slate-100 hover:border-green-200 hover:bg-slate-50/50 shadow-sm'
                          } ${
                            allCropsInCell.length === 0 ? 'bg-slate-50/30 border-dashed border-slate-200' : 'bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                              selectedLocation === cellName ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {cellName}
                            </span>
                            {hasSomeHarvestable && (
                              <Leaf size={16} className="text-green-500 animate-bounce" />
                            )}
                          </div>

                          <div className="flex-grow space-y-1.5 overflow-hidden">
                            {allCropsInCell.map(crop => (
                              <div 
                                key={crop.id} 
                                className={`text-xs font-bold truncate flex items-center gap-1.5 ${
                                  crop.isHarvestable ? 'text-green-700' : 'text-slate-400'
                                }`}
                              >
                                {crop.isHarvestable ? (
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0" />
                                )}
                                {crop.name}
                              </div>
                            ))}
                            {allCropsInCell.length === 0 && (
                              <div className="h-full flex items-center justify-center opacity-10">
                                <Leaf size={24} className="text-slate-400" />
                              </div>
                            )}
                          </div>

                          {allCropsInCell.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100/50 flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase">{harvestableInCell.length} klaar</span>
                              <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                      className="h-full bg-green-500" 
                                      style={{ width: `${(harvestableInCell.length / allCropsInCell.length) * 100}%` }}
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

          <div className="flex flex-wrap items-center gap-8 px-10 py-6 bg-white rounded-3xl border border-slate-100 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="text-sm font-bold text-slate-700">Oogstklaar</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-slate-200 rounded-full" />
              <span className="text-sm font-bold text-slate-500">Nog niet klaar</span>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-8 animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-black mb-8 pb-4 border-b border-white/10 flex justify-between items-center">
              Vak Info
              {selectedLocation && <span className="text-green-500 text-sm font-black">{selectedLocation}</span>}
            </h2>

            {selectedLocation ? (
              <div className="space-y-8">
                {cropsAtSelectedLocation.length > 0 ? (
                  cropsAtSelectedLocation.map(crop => (
                    <div key={crop.id} className="animate-in fade-in slide-in-from-bottom-2">
                      <h3 className="text-lg font-black text-white mb-2">{crop.name}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">{crop.description || 'Geen extra info.'}</p>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] tracking-widest uppercase ${
                        crop.isHarvestable ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-slate-500'
                      }`}>
                        {crop.isHarvestable ? <CheckCircle size={14} /> : <Clock size={14} />}
                        {crop.isHarvestable ? 'Oogstklaar' : 'Groeiend'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-center py-10">Dit vak is momenteel leeg.</p>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <MapIcon size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-400 font-medium leading-relaxed">Selecteer een vak op de kaart voor meer informatie over de gewassen.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarvestMap;
