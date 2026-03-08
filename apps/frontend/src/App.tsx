import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Info from './pages/Info';
import Contact from './pages/Contact';
import HarvestMap from './pages/HarvestMap';
import Teeltplan from './pages/Teeltplan';
import AdminDashboard from './pages/AdminDashboard';
import Registration from './pages/Registration';
import Recipes from './pages/Recipes';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import CompleteSignup from './pages/CompleteSignup';
import ResetPassword from './pages/ResetPassword';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="over-ons" element={<Info />} />
            <Route path="contact" element={<Contact />} />
            <Route path="oogst" element={<HarvestMap />} />
            <Route path="recepten" element={<Recipes />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="complete-signup" element={<CompleteSignup />} />
            <Route path="reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="inschrijven" element={<Registration />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<PrivateRoute roles={['ADMIN']} />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="teeltplan" element={<Teeltplan />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
