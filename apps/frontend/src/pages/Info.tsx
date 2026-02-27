import { Target, History, Heart, Users } from 'lucide-react';

const Info = () => (
  <div className="max-w-4xl mx-auto pb-20">
    <div className="text-center mb-16">
      <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight uppercase">Over GulleGaard</h1>
      <p className="text-xl text-slate-600 leading-relaxed font-medium">
        GulleGaard is een plek waar we niet alleen groenten kweken, maar samen de overvloed 
        van de natuur beleven met respect voor de bodem en de seizoenen.
      </p>
    </div>
    
    <div className="space-y-16">
      {/* Our Mission */}
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100%] opacity-50"></div>
        <h2 className="text-3xl font-black mb-6 text-green-700 flex items-center gap-3">
          <Target size={32} /> Onze Missie
        </h2>
        <div className="space-y-4 text-slate-700 leading-relaxed text-lg">
          <p>
            Op GulleGaard telen we op een ecologische manier een breed scala aan groenten voor onze deelnemers. 
            We geloven in <strong>Community Supported Agriculture (CSA)</strong>: een model waarbij de boer en de 
            burgers samen verantwoordelijk zijn voor de boerderij.
          </p>
          <p>
            Onze missie is om mensen weer in contact te brengen met de oorsprong van hun voedsel. 
            Geen lange transportketens, geen plastic verpakkingen, maar verse groenten rechtstreeks van het veld, 
            gezaaid en verzorgd met passie.
          </p>
        </div>
      </section>

      {/* History */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-2xl font-black mb-6 text-green-500 flex items-center gap-3">
            <History size={28} /> Onze Geschiedenis
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Het project begon in 2018 onder de naam <strong>Het Kruisbos</strong>. Jarenlang was het een vaste waarde 
            in Kalmthout voor verse zelfoogst.
          </p>
          <p className="text-slate-300 leading-relaxed">
            In 2025 sloegen we een nieuwe weg in en werd het veld omgedoopt tot <strong>GulleGaard</strong>. 
            Een nieuwe naam, maar met dezelfde passie voor de grond en de gemeenschap.
          </p>
        </div>

        <div className="bg-green-600 text-white p-10 rounded-[2.5rem] shadow-2xl">
          <h2 className="text-2xl font-black mb-6 text-white flex items-center gap-3">
            <Heart size={28} /> De Landgenoten
          </h2>
          <p className="leading-relaxed mb-4">
            GulleGaard werkt nauw samen met <strong>De Landgenoten</strong>. Zij kopen landbouwgrond aan met 
            het geld van aandeelhouders en schenkers om het te beschermen voor bio-landbouw.
          </p>
          <p className="leading-relaxed">
            Dankzij hen kunnen wij ons focussen op wat we het beste doen: zorgen voor de bodem en 
            het kweken van gezonde, eerlijke groenten voor onze leden.
          </p>
        </div>
      </section>

      {/* Community */}
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <h2 className="text-3xl font-black mb-6 text-green-700 flex items-center gap-3">
          <Users size={32} /> Samen Oogsten
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-slate-600">
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Voor De Natuur</h4>
            <p>We gebruiken geen chemische bestrijdingsmiddelen of kunstmest. De bodemvruchtbaarheid staat centraal.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Voor De Mens</h4>
            <p>Onze boerderij is een ontmoetingsplaats waar we samen vieren en leren over de seizoenen.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default Info;
