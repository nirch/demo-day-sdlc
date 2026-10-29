import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-bg-page">
      <nav className="bg-bg-surface border-b border-border-nav px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-semibold text-text-primary">Demo Day</span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-secondary">{user?.email || user?.name}</span>
            {user?.role !== 'judge' && (
              <button
                onClick={logout}
                className="
                  text-sm font-medium text-text-secondary
                  transition-colors duration-base
                  hover:text-text-primary
                  focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                  rounded-sm px-2 py-1
                "
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className="px-8 py-9 max-w-4xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
