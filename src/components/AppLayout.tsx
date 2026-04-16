import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Kanban, LogOut, Sun, Moon, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: 'D' },
  { to: '/leads', icon: Users, label: 'Leads', shortcut: 'N' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline', shortcut: 'P' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/leads');
        window.dispatchEvent(new CustomEvent('shortcut:new-lead'));
      }
      if (e.key === 'p' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); navigate('/pipeline'); }
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); navigate('/'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar — slim icon rail, expands on hover */}
      <aside className="hidden md:flex flex-col w-[72px] hover:w-[220px] transition-all duration-300 ease-out shrink-0 group/sidebar border-r border-border/50 bg-card/50 backdrop-blur-xl relative overflow-hidden">
        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-primary/[0.02] pointer-events-none" />

        {/* Logo */}
        <div className="flex h-16 items-center px-5 relative">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
            <Zap className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="ml-3 text-lg font-bold tracking-tight opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <span className="gradient-text">factonet</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'sidebar-nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive ? 'active' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
                {isActive && (
                  <kbd className="ml-auto opacity-0 group-hover/sidebar:opacity-50 transition-opacity duration-200 text-[9px] font-mono bg-muted rounded px-1 py-0.5">
                    {item.shortcut}
                  </kbd>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-1 relative">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200"
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 ring-1 ring-primary/15">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">Abmelden</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight gradient-text">factonet</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={signOut} className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="p-4 md:p-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation — 3 items only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.map(item => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl min-w-[72px] transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                <span className={cn('text-[10px] font-medium', isActive && 'font-bold')}>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav"
                    className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
