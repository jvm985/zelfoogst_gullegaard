import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Users, Map as MapIcon, BookOpen, Settings, Phone, Info, LogIn, LogOut, User } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="De Gullegaard Logo" className="h-16 w-auto hover:opacity-80 transition-opacity" />
            <span className="text-2xl font-bold tracking-tight hidden sm:inline text-green-700">De Gullegaard</span>
          </Link>
          
          <nav className="hidden lg:flex gap-6 items-center">
            <Link to="/over-ons" className="text-slate-600 hover:text-green-600 flex items-center gap-1 font-medium transition-colors"><Info size={18}/> Info</Link>
            <Link to="/contact" className="text-slate-600 hover:text-green-600 flex items-center gap-1 font-medium transition-colors"><Phone size={18}/> Contact</Link>
            <Link to="/oogst" className="text-slate-600 hover:text-green-600 flex items-center gap-1 font-medium transition-colors"><MapIcon size={18}/> Oogst</Link>
            <Link to="/recepten" className="text-slate-600 hover:text-green-600 flex items-center gap-1 font-medium transition-colors"><BookOpen size={18}/> Recepten</Link>
            <Link to="/inschrijven" className="text-slate-600 hover:text-green-600 flex items-center gap-1 font-medium transition-colors"><Users size={18}/> Inschrijven</Link>
            
            <div className="h-6 w-px bg-slate-200 ml-2"></div>

            {user ? (
              <div className="flex items-center gap-4 ml-2">
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="text-green-700 hover:text-green-800 flex items-center gap-1 font-bold transition-colors">
                    <Settings size={18}/> Beheer
                  </Link>
                )}
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                  <User size={16} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">{user.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                  title="Uitloggen"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 flex items-center gap-2 ml-4">
                <LogIn size={18}/> Inloggen
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
             <img src={logo} alt="Logo" className="h-12 w-auto opacity-50" />
          </div>
          <p className="text-slate-400 text-sm">&copy; 2026 De Gullegaard Boerderij. Geteeld met passie.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
