import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, clearAuth, isAuthenticated } from '@/utils/auth';
import { toast } from 'sonner';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const isLoggedIn = isAuthenticated();

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'doctor') return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  return (
    <nav className="glass-effect sticky top-0 z-40 border-b border-slate-200">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Alambana Healthcare</h1>
              <p className="text-xs text-slate-500">Sejal Engitech Pvt Ltd</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/about" className="text-slate-600 hover:text-primary transition-colors" data-testid="nav-about">
              About
            </Link>
            <Link to="/blogs" className="text-slate-600 hover:text-primary transition-colors" data-testid="nav-blogs">
              Blog
            </Link>
            {isLoggedIn ? (
              <>
                <Link to={getDashboardLink()} data-testid="nav-dashboard">
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" className="gap-2" data-testid="nav-logout">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="nav-login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register" data-testid="nav-register">
                  <Button className="rounded-full bg-primary hover:bg-primary/90">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-button"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200" data-testid="mobile-menu">
            <div className="flex flex-col gap-4">
              <Link to="/about" className="text-slate-600 hover:text-primary transition-colors">About</Link>
              <Link to="/blogs" className="text-slate-600 hover:text-primary transition-colors">Blog</Link>
              {isLoggedIn ? (
                <>
                  <Link to={getDashboardLink()}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login"><Button variant="outline" className="w-full">Login</Button></Link>
                  <Link to="/register"><Button className="w-full bg-primary">Get Started</Button></Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
