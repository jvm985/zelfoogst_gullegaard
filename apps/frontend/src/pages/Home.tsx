import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Users, MapIcon, ChevronRight, Calendar } from 'lucide-react';
import logo from '../assets/logo.png';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

const Home = () => {
  const [news, setNews] = useState<NewsPost[]>([]);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => setNews(data.slice(0, 3)))
      .catch(err => console.error('Failed to fetch news:', err));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-24">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-left animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full text-green-700 font-black text-[10px] uppercase tracking-widest mb-6">
            <Sprout size={14} /> Welkom bij GulleGaard
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[0.9]">
            Verse oogst van <span className="text-green-600 italic">GulleGaard</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-lg leading-relaxed font-medium mb-10">
            Samen zaaien, verzorgen en oogsten in Kalmthout. 
            Beleef de seizoenen op het veld en geniet van eerlijk eten.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/oogst" className="bg-green-600 hover:bg-green-700 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg shadow-green-200 uppercase tracking-tight">
              Bekijk de Oogst
            </Link>
            <Link to="/over-ons" className="bg-white hover:bg-slate-50 text-slate-900 font-black py-4 px-10 rounded-2xl transition-all border border-slate-200 shadow-sm uppercase tracking-tight">
              Onze Filosofie
            </Link>
          </div>
        </div>
        
        <div className="relative animate-in fade-in slide-in-from-right-8 duration-700">
           <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50"></div>
           <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-yellow-100 rounded-full blur-3xl opacity-50"></div>
           <div className="relative bg-white p-4 rounded-[3rem] shadow-2xl rotate-2">
             <img 
               src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1000&auto=format&fit=crop" 
               alt="GulleGaard Veld" 
               className="rounded-[2.5rem] w-full aspect-[4/3] object-cover"
             />
             <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 -rotate-3">
               <img src={logo} alt="Logo" className="h-10 w-auto" />
               <div className="pr-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Boerderij</p>
                 <p className="font-bold text-slate-800">Kalmthout</p>
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl hover:border-green-500/50 transition-all group">
          <div className="bg-green-50 p-4 rounded-2xl w-fit mb-6 group-hover:bg-green-100 transition-colors">
            <MapIcon className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Lokaal & Vers</h2>
          <p className="text-slate-600 leading-relaxed font-medium">Direct van de boer naar jouw bord. Onze deelnemers oogsten zelf hun groenten op het veld in Kalmthout.</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl hover:border-green-500/50 transition-all group">
          <div className="bg-green-50 p-4 rounded-2xl w-fit mb-6 group-hover:bg-green-100 transition-colors">
            <Users className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Samen Sterk</h2>
          <p className="text-slate-600 leading-relaxed font-medium">CSA staat voor gemeenschapslandbouw. We delen de risico's en de overvloed van het boerenleven.</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl hover:border-green-500/50 transition-all group">
          <div className="bg-green-50 p-4 rounded-2xl w-fit mb-6 group-hover:bg-green-100 transition-colors">
            <Sprout className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Bio-Logisch</h2>
          <p className="text-slate-600 leading-relaxed font-medium">We werken met respect voor de biodiversiteit en de bodemvruchtbaarheid, zonder pesticiden.</p>
        </div>
      </div>

      {/* News Section */}
      <section className="space-y-10">
        <div className="flex justify-between items-end border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Laatste Nieuws</h2>
            <p className="text-slate-500 font-bold">Blijf op de hoogte van het leven op de boerderij</p>
          </div>
          <Link to="/over-ons" className="text-green-600 font-black flex items-center gap-1 hover:gap-2 transition-all uppercase text-sm tracking-widest">
            Alles lezen <ChevronRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.length > 0 ? (
            news.map(post => (
              <div key={post.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-lg hover:shadow-2xl transition-all flex flex-col group">
                {post.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-8 flex-grow">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
                    <Calendar size={14} className="text-green-600" />
                    {new Date(post.createdAt).toLocaleDateString('nl-NL')}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 leading-tight">{post.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-4">{post.content}</p>
                </div>
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                  <span className="text-green-600 font-black text-[10px] uppercase tracking-widest">Lees meer</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold italic">Nog geen nieuwsberichten geplaatst.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
