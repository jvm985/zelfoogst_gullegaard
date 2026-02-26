import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, User, Send } from 'lucide-react';

const SignUp = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Registratie mislukt.');
      }
    } catch (err) {
      setError('Kon geen verbinding maken met de server.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Send className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Check je mailbox!</h1>
          <p className="text-slate-600 leading-relaxed">
            We hebben een bevestigingsmail gestuurd naar <strong>{formData.email}</strong>. 
            Klik op de link in de mail om je account te activeren en je wachtwoord in te stellen.
          </p>
          <Link to="/login" className="block text-green-700 font-bold hover:underline">Terug naar login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">Account Aanmaken</h1>
          <p className="text-slate-500 mt-2">Word deel van de Gullegaard gemeenschap</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-500 ml-1">Volledige Naam</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="Jan Janssen"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-500 ml-1">E-mailadres</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input 
                type="email" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="je@email.be"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-[0.98] disabled:opacity-50 mt-4 uppercase tracking-tight"
          >
            {loading ? 'Verzenden...' : 'Bevestigingsmail sturen'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Heb je al een account? <Link to="/login" className="text-green-700 font-bold hover:underline">Log hier in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
