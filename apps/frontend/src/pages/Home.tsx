import { Link } from 'react-router-dom';
import { Sprout, Users, MapIcon } from 'lucide-react';

const Home = () => (
  <div className="max-w-5xl mx-auto">
    <div className="text-center mb-16 animate-in fade-in zoom-in duration-700">
      <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
        Eerlijk eten van <span className="text-green-600">eigen bodem</span>
      </h1>
      <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
        De Gullegaard is een gemeenschapsboerderij waar we samen zaaien, verzorgen en oogsten. 
        Verse groenten, rechtstreeks van de boer naar jouw bord.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link to="/oogst" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-green-200">
          Bekijk de Oogst
        </Link>
        <Link to="/over-ons" className="bg-white hover:bg-slate-50 text-slate-900 font-bold py-3 px-8 rounded-full transition-all border border-slate-200 shadow-sm">
          Onze Filosofie
        </Link>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-green-500/50 transition-all group">
        <div className="bg-green-50 p-3 rounded-xl w-fit mb-6 group-hover:bg-green-100 transition-colors">
          <MapIcon className="text-green-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Vers van het veld</h2>
        <p className="text-slate-600 leading-relaxed">Ontdek wat er op dit moment klaar is om te oogsten. Onze deelnemers hebben directe toegang tot het meest verse seizoensaanbod.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-green-500/50 transition-all group">
        <div className="bg-green-50 p-3 rounded-xl w-fit mb-6 group-hover:bg-green-100 transition-colors">
          <Users className="text-green-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Samen Groeien</h2>
        <p className="text-slate-600 leading-relaxed">Word ook deel van onze boerderij! Als deelnemer steun je de lokale boer en geniet je mee van de overvloed van het land.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-green-500/50 transition-all group">
        <div className="bg-green-50 p-3 rounded-xl w-fit mb-6 group-hover:bg-green-100 transition-colors">
          <Sprout className="text-green-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Duurzame Landbouw</h2>
        <p className="text-slate-600 leading-relaxed">Wij werken met respect voor de natuur, zonder pesticiden en met een focus op biodiversiteit en bodemgezondheid.</p>
      </div>
    </div>
  </div>
);

export default Home;
