import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAllEventsPage = location.pathname.includes('all-events');
  const isHomePage = !isAllEventsPage && (location.pathname === '/' || location.pathname === '/home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Events', href: '#upcoming' },
    { name: 'Partners', href: '#partners' },
    { name: 'Contact', href: '#contact' },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md py-4' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
        {/* Logo */}
        {isHomePage ? (
          <a 
            href="#home" 
            onClick={(e) => scrollToSection(e, '#home')}
            className="flex items-center gap-3 z-50"
          >
            <img 
              src="/lekkside-logo.png" 
              alt="Lekkside" 
              className="h-10 w-auto object-contain"
            />
            <span className={`text-xl font-display font-bold uppercase tracking-tight ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
              Lekkside
            </span>
          </a>
        ) : (
          <Link to="/" className="flex items-center gap-3 z-50">
            <img 
              src="/lekkside-logo.png" 
              alt="Lekkside" 
              className="h-10 w-auto object-contain"
            />
            <span className={`text-xl font-display font-bold uppercase tracking-tight text-slate-900`}>
              Lekkside
            </span>
          </Link>
        )}

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {isHomePage ? (
            <>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-primary ${isScrolled ? 'text-slate-800' : 'text-white'}`}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#upcoming"
                onClick={(e) => scrollToSection(e, '#upcoming')}
                className="px-6 py-3 rounded-full bg-primary text-white font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
              >
                Register Now
              </a>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-sm font-bold uppercase tracking-wider transition-colors hover:text-primary text-slate-800"
              >
                Home
              </Link>
              <span className="text-sm font-bold uppercase tracking-wider text-primary">
                Events
              </span>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button 
          className={`md:hidden p-2 z-50 ${isScrolled || !isHomePage ? 'text-slate-900' : 'text-white'}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6 text-slate-900" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Mobile Nav */}
        <div 
          className={`fixed inset-0 bg-white z-40 flex flex-col items-center justify-center gap-8 transition-transform duration-500 ease-in-out md:hidden ${
            mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          {isHomePage ? (
            <>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="text-2xl font-display font-bold uppercase tracking-widest text-slate-900 hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#upcoming"
                onClick={(e) => scrollToSection(e, '#upcoming')}
                className="mt-4 px-8 py-4 rounded-full bg-primary text-white font-bold text-lg uppercase tracking-wider shadow-xl shadow-primary/20"
              >
                Register Now
              </a>
            </>
          ) : (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-display font-bold uppercase tracking-widest text-slate-900 hover:text-primary transition-colors"
              >
                Home
              </Link>
              <span className="text-2xl font-display font-bold uppercase tracking-widest text-primary">
                Events
              </span>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
