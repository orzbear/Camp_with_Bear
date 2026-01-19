import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Footprints } from './pages/Footprints';
// Legacy routes (kept for backward compatibility, not linked in navigation)
import { Search } from './pages/Search';
import { Explore } from './pages/Explore';
import { Plan } from './pages/Plan';
import { Recipes } from './pages/Recipes';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main routes */}
          <Route path="/" element={<Footprints />} />
          <Route path="/footprints" element={<Footprints />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Legacy routes (not linked in navigation) */}
          <Route path="/legacy/search" element={<Search />} />
          <Route path="/legacy/explore" element={<Explore />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

