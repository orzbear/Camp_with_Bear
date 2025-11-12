import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="text-lg font-medium text-gray-800">{user?.email}</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

