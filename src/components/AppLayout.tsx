import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, ChevronLeft, ChevronRight, Sun, Moon, Kanban, Zap, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/kalender', icon: Calendar, label: 'Kalender' },
  { to: '/einstellungen', icon: Settings, label: 'Mehr' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/leads');
        // Dispatch custom event for new lead modal
        window.dispatchEvent(new CustomEvent('shortcut:new-lead'));
      }
      if (e.key === 'p' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); navigate('/pipeline'); }
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); navigate('/'); }
      if (e.key === 'k' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); navigate('/kalender'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300 ease-out shrink-0 relative',
          collapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border relative">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  <span className="gradient-text">factonet</span>
                  <span className="text-muted-foreground text-xs font-normal ml-1.5">CRM</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Zap className="h-4 w-4 text-primary" />
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 relative">
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center justify-center rounded-md p-2 mb-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'sidebar-nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  isActive ? 'active' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-[18px] w-[18px] shrink-0', collapsed && 'mx-auto')} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label === 'Mehr' ? 'Einstellungen' : item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-2 space-y-0.5 relative">
          {/* Keyboard shortcuts hint */}
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">Shortcuts</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'D', label: 'Dashboard' },
                  { key: 'N', label: 'Neuer Lead' },
                  { key: 'P', label: 'Pipeline' },
                  { key: 'K', label: 'Kalender' },
                ].map(s => (
                  <span key={s.key} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
                    <kbd className="h-4 min-w-[16px] flex items-center justify-center rounded bg-muted px-1 text-[9px] font-mono font-medium">{s.key}</kbd>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className={cn('h-[18px] w-[18px] shrink-0', collapsed && 'mx-auto')} />
            ) : (
              <Moon className={cn('h-[18px] w-[18px] shrink-0', collapsed && 'mx-auto')} />
            )}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg', collapsed && 'justify-center')}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 ring-2 ring-primary/10">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-colors"
          >
            <LogOut className={cn('h-[18px] w-[18px] shrink-0', collapsed && 'mx-auto')} />
            {!collapsed && <span>Abmelden</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight">
              <span className="gradient-text">factonet</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary ring-1 ring-primary/10">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="p-4 md:p-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[56px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
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
