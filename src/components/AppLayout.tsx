import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, ChevronLeft, ChevronRight, Sun, Moon, Kanban, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/kalender', icon: Calendar, label: 'Kalender' },
  { to: '/einstellungen', icon: Settings, label: 'Einstellungen' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300 ease-out shrink-0 relative',
          collapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />

        {/* Logo Area */}
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

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 relative">
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center justify-center rounded-md p-2 mb-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'sidebar-nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  isActive
                    ? 'active'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
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
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border p-2 space-y-0.5 relative">
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

          {/* User Info */}
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
            collapsed && 'justify-center'
          )}>
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
      <main className="flex-1 overflow-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
