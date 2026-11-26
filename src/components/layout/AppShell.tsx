import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  Activity,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useMiroStore } from '../../stores/useMiroStore';
import { startMiroExecutionEngine } from '../../services/mock/executionEngine';
import { GlobalSidebar } from './GlobalSidebar';
import { GlobalHeader } from './GlobalHeader';
import { TaskMonitorDrawer } from './TaskMonitorDrawer';
import { ApprovalCenterDrawer } from './ApprovalCenterDrawer';
import { ContextualAiAssistantDrawer } from './ContextualAiAssistantDrawer';
import { CommandPalette } from './CommandPalette';
import { cn } from '../../lib/utils';

export function AppShell() {
  const location = useLocation();
  const theme = useMiroStore((s) => s.settings.theme);
  const language = useMiroStore((s) => s.settings.language);
  const mobileNavOpen = useMiroStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useMiroStore((s) => s.setMobileNavOpen);
  const setCommandPaletteOpen = useMiroStore((s) => s.setCommandPaletteOpen);
  const setTaskMonitorOpen = useMiroStore((s) => s.setTaskMonitorOpen);
  const setApprovalCenterOpen = useMiroStore((s) => s.setApprovalCenterOpen);
  const pendingApprovals = useMiroStore(
    (s) => s.approvals.filter((a) => a.status === 'pending').length
  );

  // Start single global simulated execution engine
  useEffect(() => {
    startMiroExecutionEngine();
  }, []);

  // Apply theme & lang attributes on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;

    const applyResolved = (resolved: 'midnight-lime' | 'navy-cream' | 'light') => {
      root.setAttribute('data-theme', resolved);
      if (resolved === 'light') {
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
      }
    };

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: light)');
      applyResolved(mql.matches ? 'light' : 'midnight-lime');
      const listener = (e: MediaQueryListEvent) =>
        applyResolved(e.matches ? 'light' : 'midnight-lime');
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    } else {
      applyResolved(theme);
    }
  }, [theme, language]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!useMiroStore.getState().commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text-primary)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full shrink-0">
        <GlobalSidebar />
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-[var(--color-overlay)]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileNavOpen(false);
          }}
        >
          <GlobalSidebar mobile />
        </div>
      )}

      {/* Main Column */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <GlobalHeader />
        <main className="flex-1 min-h-0 overflow-hidden relative pb-[56px] lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Compact Bottom Navigation (<= 15% viewport height, 44px+ touch targets) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-30 flex lg:hidden items-center justify-around h-[56px] bg-[var(--color-header)] border-t border-[var(--color-border)] px-1"
      >
        <NavLink
          to="/workspace"
          className={cn(
            'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[11px] font-medium',
            location.pathname.startsWith('/workspace')
              ? 'text-[var(--color-accent-text)]'
              : 'text-[var(--color-text-secondary)]'
          )}
        >
          <MessageSquare className="w-4 h-4 mb-0.5" />
          <span>AI</span>
        </NavLink>
        <NavLink
          to="/overview"
          className={cn(
            'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[11px] font-medium',
            location.pathname.startsWith('/overview')
              ? 'text-[var(--color-accent-text)]'
              : 'text-[var(--color-text-secondary)]'
          )}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Tổng quan</span>
        </NavLink>
        <NavLink
          to="/tasks"
          className={cn(
            'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[11px] font-medium',
            location.pathname.startsWith('/tasks')
              ? 'text-[var(--color-accent-text)]'
              : 'text-[var(--color-text-secondary)]'
          )}
        >
          <ListChecks className="w-4 h-4 mb-0.5" />
          <span>Tác vụ</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setTaskMonitorOpen(true)}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[11px] font-medium text-[var(--color-text-secondary)] cursor-pointer"
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span>Giám sát</span>
        </button>
        <button
          type="button"
          onClick={() => setApprovalCenterOpen(true)}
          className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[11px] font-medium text-[var(--color-text-secondary)] cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4 mb-0.5" />
          <span>Duyệt</span>
          {pendingApprovals > 0 && (
            <span className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-[var(--color-warning)]" />
          )}
        </button>
      </nav>

      {/* Global Overlays */}
      <TaskMonitorDrawer />
      <ApprovalCenterDrawer />
      <ContextualAiAssistantDrawer />
      <CommandPalette />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-strong)',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}
