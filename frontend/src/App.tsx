import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './auth/AuthContext';
import { Explore }    from './pages/Explore';
import { Footprints } from './pages/Footprints';
import { Plan }       from './pages/Plan';
import { Recipes }    from './pages/Recipes';
import { Login }      from './pages/Login';
import { Register }   from './pages/Register';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<Navigate to="/explore" replace />} />
        <Route path="/explore"    element={<Explore />} />
        <Route path="/footprints" element={<Footprints />} />
        <Route path="/plan"       element={<Plan />} />
        <Route path="/recipes"    element={<Recipes />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/legacy/explore" element={<Navigate to="/explore" replace />} />
        <Route path="/legacy/search"  element={<Navigate to="/explore" replace />} />
        <Route path="/dashboard"      element={<Navigate to="/plan"    replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
