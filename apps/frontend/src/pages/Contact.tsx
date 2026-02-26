import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact = () => (
  <div className="max-w-5xl mx-auto">
    <div className="text-center mb-16">
      <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight uppercase">Contact</h1>
      <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Heb je vragen over ons project of wil je langskomen? We horen graag van je.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl space-y-8">
        <h2 className="text-2xl font-black mb-6 text-green-600 uppercase tracking-tight">Onze Gegevens</h2>
        
        <div className="flex items-start gap-4">
          <div className="bg-green-50 p-3 rounded-xl"><MapPin className="text-green-600" size={24} /></div>
          <div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Adres</p>
            <p className="text-slate-800 text-lg font-bold italic">Boerenweg 1, 9000 Gent</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-green-50 p-3 rounded-xl"><Mail className="text-green-600" size={24} /></div>
          <div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
            <p className="text-slate-800 text-lg font-bold italic">info@gullegaard.be</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-green-50 p-3 rounded-xl"><Phone className="text-green-600" size={24} /></div>
          <div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Telefoon</p>
            <p className="text-slate-800 text-lg font-bold italic">+32 400 00 00 00</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl space-y-8">
        <h2 className="text-2xl font-black mb-6 text-green-600 uppercase tracking-tight flex items-center gap-3">
          <Clock /> Openingsuren
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-slate-100">
            <span className="text-slate-600 font-bold">Maandag - Vrijdag</span>
            <span className="text-slate-900 font-black">08:00 - 18:00</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-100">
            <span className="text-slate-600 font-bold">Zaterdag</span>
            <span className="text-slate-900 font-black">09:00 - 16:00</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-600 font-bold">Zondag</span>
            <span className="text-red-600 font-black uppercase tracking-widest">Gesloten</span>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
          <p className="text-slate-500 text-sm italic leading-relaxed text-center">
            "De boerderij is altijd open voor de natuur, maar wij rusten ook graag op zondag."
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default Contact;
