import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, Map as MapIcon, BookOpen, Settings, Phone, Info, LogIn, LogOut, User, Home as HomeIcon, Menu, X, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { to: "/", label: "Home", icon: <HomeIcon size={18}/> },
    { to: "/over-ons", label: "Missie", icon: <Info size={18}/> },
    { to: "/contact", label: "Contact", icon: <Phone size={18}/> },
    { to: "/oogst", label: "Oogst", icon: <MapIcon size={18}/> },
    { to: "/recepten", label: "Recepten", icon: <BookOpen size={18}/> },
    { to: "/inschrijven", label: "Inschrijven", icon: <Users size={18}/> },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
            <Sprout className="text-green-600 w-10 h-10 md:w-12 md:h-12 hover:scale-110 transition-transform" />
            <span className="text-xl md:text-2xl font-bold tracking-tight hidden sm:inline text-green-700">De Zelfoogsttuin</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex gap-6 items-center">
            {navItems.map(item => (
              <NavLink 
                key={item.to}
                to={item.to} 
                className={({ isActive }) => `flex items-center gap-1 font-medium transition-colors ${isActive ? 'text-green-700 font-bold' : 'text-slate-600 hover:text-green-600'}`}
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
            
            <div className="h-6 w-px bg-slate-200 ml-2"></div>

            {user ? (
              <div className="flex items-center gap-4 ml-2">
                {user.role === 'ADMIN' && (
                  <>
                    <Link to="/teeltplan" className="text-green-700 hover:text-green-800 flex items-center gap-1 font-bold transition-colors">
                      <MapIcon size={18}/> Teeltplan
                    </Link>
                    <Link to="/admin" className="text-green-700 hover:text-green-800 flex items-center gap-1 font-bold transition-colors">
                      <Settings size={18}/> Beheer
                    </Link>
                  </>
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

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col p-4 gap-2">
              {navItems.map(item => (
                <NavLink 
                  key={item.to}
                  to={item.to} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${isActive ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
              
              <div className="h-px bg-slate-100 my-2"></div>

              {user ? (
                <div className="space-y-2">
                  {user.role === 'ADMIN' && (
                    <>
                      <Link 
                        to="/teeltplan" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl font-bold text-green-700 hover:bg-green-50 transition-all"
                      >
                        <MapIcon size={18}/> Teeltplan
                      </Link>
                      <Link 
                        to="/admin" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 rounded-xl font-bold text-green-700 hover:bg-green-50 transition-all"
                      >
                        <Settings size={18}/> Beheer Paneel
                      </Link>
                    </>
                  )}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{user.name}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-red-500 font-bold flex items-center gap-2"
                    >
                      <LogOut size={18} /> Uitloggen
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-green-600 text-white p-4 rounded-xl font-black text-center shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                >
                  <LogIn size={18}/> Inloggen
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
             <Sprout className="text-green-600 opacity-50" size={48} />
          </div>
          <p className="text-slate-400 text-sm">&copy; 2026 De Zelfoogsttuin. Geteeld met passie.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
