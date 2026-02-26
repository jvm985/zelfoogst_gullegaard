import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const CompleteSignup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<{name: string, email: string} | null>(null);
  const [verifyingToken, setVerifyingToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Geen token gevonden.');
      setVerifyingToken(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-signup-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (response.ok) {
          setUserData(data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Kon verbinding niet maken.');
      } finally {
        setVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }
    if (password.length < 6) {
        setError('Wachtwoord moet minimaal 6 tekens lang zijn.');
        return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingToken) {
    return <div className="text-center py-20 text-slate-500 font-bold animate-pulse uppercase">Link verifiëren...</div>;
  }

  if (error && !userData) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-100 text-center space-y-6">
          <AlertCircle className="text-red-500 mx-auto" size={48} />
          <h1 className="text-2xl font-black text-slate-900">Ongeldige Link</h1>
          <p className="text-slate-600">{error}</p>
          <button onClick={() => navigate('/signup')} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all">Nieuwe link aanvragen</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-green-100 text-center space-y-6">
          <CheckCircle className="text-green-500 mx-auto" size={48} />
          <h1 className="text-2xl font-black text-slate-900">Gelukt!</h1>
          <p className="text-slate-600">Je wachtwoord is ingesteld en je account is nu actief. Je wordt over enkele seconden doorverwezen naar de login pagina.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">Account Voltooien</h1>
          <p className="text-slate-500 mt-2">Hallo {userData?.name}, kies een veilig wachtwoord voor je account.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-500 ml-1">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-500 ml-1">Bevestig Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-[0.98] disabled:opacity-50 mt-4 uppercase tracking-tight"
          >
            {loading ? 'Verwerken...' : 'Account Activeren'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteSignup;
