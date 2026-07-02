import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { cn } from '../lib/cn';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'whitespace-nowrap rounded-md px-2 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
      isActive ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white'
    );

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link
          to="/"
          className="flex flex-none items-center gap-2 font-bold text-white"
        >
          <span className="text-xl">🎬</span>
          <span className="hidden sm:inline">Kino</span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <NavLink to="/" className={linkClass} end>
            Repertuar
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/my-reservations" className={linkClass}>
                Moje rezerwacje
              </NavLink>
              <span className="ml-2 hidden text-sm text-slate-400 lg:inline">
                {user?.email}
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="ml-2"
                onClick={handleLogout}
              >
                Wyloguj
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Logowanie
              </NavLink>
              <Link to="/register">
                <Button size="sm" className="ml-1">
                  Rejestracja
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
