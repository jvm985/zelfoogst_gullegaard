import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ChevronLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/oogst');
      } else {
        setError(data.error || 'Inloggen mislukt. Controleer je gegevens.');
      }
    } catch (err) {
      setError('Kon geen verbinding maken met de server.');
    } finally {
      setLoading(false);
    }
  };

  const performQuickLogin = async (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/oogst');
      } else {
        setError(data.error || 'Inloggen mislukt.');
      }
    } catch (err) {
      setError('Kon geen verbinding maken.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (response.ok) {
        setResetMessage({ type: 'success', text: 'Er is een link verzonden naar je e-mailadres om je wachtwoord te herstellen.' });
      } else {
        setResetMessage({ type: 'error', text: 'Dit e-mailadres is niet bekend in ons systeem.' });
      }
    } catch (err) {
      setResetMessage({ type: 'error', text: 'Er is een fout opgetreden. Probeer het later opnieuw.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        {!showForgotPassword ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-green-900">Welkom bij De Gullegaard</h1>
              <p className="text-gray-500 mt-2">Log in om je oogstaandeel te beheren</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    required
                    disabled={loading}
                    className="w-full border rounded-md p-2 pl-10 focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50"
                    placeholder="je@email.be"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Wachtwoord</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-green-700 font-bold hover:underline"
                  >
                    Wachtwoord vergeten?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    required
                    disabled={loading}
                    className="w-full border rounded-md p-2 pl-10 focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-700 text-white font-bold py-3 rounded-md hover:bg-green-800 transition-colors shadow-md disabled:bg-green-300 flex justify-center items-center gap-2"
              >
                {loading ? 'Laden...' : 'Inloggen'}
              </button>

              <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Snel Inloggen (Testen)</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => performQuickLogin('admin@gullegaard.be', 'Karekiet1')}
                    disabled={loading}
                    className="bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    Als Beheerder
                  </button>
                  <button 
                    type="button" 
                    onClick={() => performQuickLogin('jan@voorbeeld.be', 'test1234')}
                    disabled={loading}
                    className="bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all border border-slate-200 flex items-center justify-center gap-2"
                  >
                    Als Lid
                  </button>
                </div>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Nog geen account? <Link to="/signup" className="text-green-700 font-bold hover:underline">Account aanmaken</Link>
            </p>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => {
                setShowForgotPassword(false);
                setResetMessage(null);
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-green-700 font-bold text-sm mb-6 transition-colors"
            >
              <ChevronLeft size={16} /> Terug naar login
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Wachtwoord vergeten?</h2>
              <p className="text-gray-500 mt-2 text-sm">Vul je e-mailadres in en we sturen je een link om een nieuw wachtwoord aan te maken.</p>
            </div>

            {resetMessage && (
              <div className={`mb-6 p-4 rounded-md text-sm font-medium ${
                resetMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {resetMessage.text}
              </div>
            )}

            {!resetMessage || resetMessage.type === 'error' ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      required
                      className="w-full border rounded-md p-2 pl-10 focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="je@email.be"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 transition-colors shadow-md flex justify-center items-center gap-2"
                >
                  {loading ? 'Verzenden...' : 'Link verzenden'} <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <button 
                  onClick={() => setShowForgotPassword(false)}
                  className="bg-green-700 text-white px-8 py-3 rounded-md font-bold hover:bg-green-800 transition-all"
                >
                  Terug naar login
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
