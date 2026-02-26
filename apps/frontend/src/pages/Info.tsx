import { Leaf, Target, User } from 'lucide-react';

const Info = () => (
  <div className="max-w-4xl mx-auto">
    <div className="text-center mb-16">
      <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight uppercase">Over De Gullegaard</h1>
      <p className="text-xl text-slate-600 leading-relaxed">
        De Gullegaard is een CSA (Community Supported Agriculture) boerderij. 
        Dit betekent dat we samen de risico's en de overvloed van het boerenleven delen.
      </p>
    </div>
    
    <div className="space-y-12">
      <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg">
        <h2 className="text-2xl font-black mb-4 text-green-600 flex items-center gap-3">
          <Target className="text-green-600" /> Onze Missie
        </h2>
        <p className="text-slate-700 leading-relaxed text-lg font-medium">
          Wij streven naar regeneratieve landbouw die de bodem verbetert en zorgt voor biodiversiteit. 
          Onze groenten worden geteeld zonder chemische bestrijdingsmiddelen of kunstmest. 
          Gezonde grond betekent gezonde mensen.
        </p>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg">
          <h2 className="text-2xl font-black mb-4 text-green-600 flex items-center gap-3">
            <Leaf className="text-green-600" /> Duurzaamheid
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Onze ecologische voetafdruk houden we zo klein mogelijk door lokale afzet, 
            minimale bewerking van de grond en het bevorderen van natuurlijke vijanden.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg">
          <h2 className="text-2xl font-black mb-4 text-green-600 flex items-center gap-3">
            <User className="text-green-600" /> De Boer
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Passie voor landbouw, liefde voor de grond en het belang van lokale voedselketens staan centraal. 
            Onze boer is het hart van de boerderij en werkt nauw samen met de gemeenschap.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default Info;
