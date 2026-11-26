import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Chrome,
  Film,
  Folder,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Moon,
  Plug,
  Plus,
  Search,
  Send,
  Settings,
  Sun,
  Workflow,
  X,
} from 'lucide-react';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { MiroWordmark } from '../shared/MiroWordmark';
import { Button } from '../ui/primitives';
import { cn } from '../../lib/utils';

interface NavGroupDef {
  id: 'workspace' | 'automation' | 'tools' | 'system';
  items: {
    to: string;
    labelKey: keyof typeof import('../../i18n/translations').translations.vi.nav;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    id: 'workspace',
    items: [
      { to: '/overview', labelKey: 'overview', icon: LayoutDashboard },
      { to: '/workspace', labelKey: 'workspace', icon: MessageSquare },
      { to: '/tasks', labelKey: 'tasks', icon: ListChecks },
      { to: '/projects', labelKey: 'projects', icon: Folder },
    ],
  },
  {
    id: 'automation',
    items: [
      { to: '/schedules', labelKey: 'schedules', icon: CalendarClock },
      { to: '/workflows', labelKey: 'workflows', icon: Workflow },
    ],
  },
  {
    id: 'tools',
    items: [
      { to: '/browser', labelKey: 'browser', icon: Chrome },
      { to: '/research', labelKey: 'research', icon: Search },
      { to: '/media', labelKey: 'media', icon: Film },
      { to: '/publishing', labelKey: 'publishing', icon: Send },
      { to: '/knowledge', labelKey: 'knowledge', icon: BookOpen },
    ],
  },
  {
    id: 'system',
    items: [
      { to: '/activity', labelKey: 'activity', icon: Activity },
      { to: '/integrations', labelKey: 'integrations', icon: Plug },
      { to: '/settings', labelKey: 'settings', icon: Settings },
    ],
  },
];

export function GlobalSidebar({ mobile = false }: { mobile?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const collapsed = useMiroStore((s) => (mobile ? false : s.settings.sidebarCollapsed));
  const theme = useMiroStore((s) => s.settings.theme);
  const workspaceName = useMiroStore((s) => s.settings.defaultWorkspace);
  const updateSettings = useMiroStore((s) => s.updateSettings);
  const setCommandPaletteOpen = useMiroStore((s) => s.setCommandPaletteOpen);
  const createConversation = useMiroStore((s) => s.createConversation);
  const setMobileNavOpen = useMiroStore((s) => s.setMobileNavOpen);
  const runningCount = useMiroStore(
    (s) => s.tasks.filter((tk) => tk.status === 'running' || tk.status === 'planning').length
  );

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNewChat = () => {
    createConversation();
    navigate('/workspace');
    if (mobile) setMobileNavOpen(false);
  };

  const cycleTheme = () => {
    const order = ['midnight-lime', 'navy-cream', 'light'] as const;
    const idx = order.indexOf(theme as (typeof order)[number]);
    const next = order[(idx + 1) % order.length];
    updateSettings({ theme: next });
  };

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        'flex flex-col h-full bg-[var(--color-sidebar)] border-r border-[var(--color-border)] select-none shrink-0 transition-[width] duration-200',
        mobile ? 'w-[260px]' : collapsed ? 'w-[56px]' : 'w-[224px]'
      )}
    >
      {/* Top area */}
      <div className="px-3 pt-3 pb-2 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2 h-8">
          <button
            type="button"
            onClick={() => {
              navigate('/workspace');
              if (mobile) setMobileNavOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer focus-visible:outline-2 rounded-[4px]"
          >
            <MiroWordmark compact={collapsed} />
          </button>

          {mobile ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation menu"
              onClick={() => setMobileNavOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
              title={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
              onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
              className="h-7 w-7"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Workspace selector */}
        {!collapsed && (
          <div className="flex items-center justify-between rounded-[6px] bg-[var(--color-surface-1)] border border-[var(--color-border)] px-2.5 py-1.5 text-[12px]">
            <span className="truncate font-medium text-[var(--color-text-primary)]">{workspaceName}</span>
            <span className="font-mono-tech text-[10px] text-[var(--color-text-muted)] shrink-0 ml-1">LOCAL</span>
          </div>
        )}

        {/* Quick Search & New Chat */}
        <div className={cn('flex gap-1.5', collapsed ? 'flex-col items-center' : 'flex-col')}>
          <button
            type="button"
            onClick={() => {
              setCommandPaletteOpen(true);
              if (mobile) setMobileNavOpen(false);
            }}
            aria-label={t.header.commandPalette}
            title={`${t.nav.quickSearch} (Ctrl+K)`}
            className={cn(
              'flex items-center rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)] transition-colors duration-150 cursor-pointer',
              collapsed ? 'h-8 w-8 justify-center' : 'h-8 w-full justify-between px-2.5 text-[12px]'
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span className="truncate">{t.nav.quickSearch}</span>}
            </span>
            {!collapsed && (
              <kbd className="font-mono-tech text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[4px] px-1">
                ⌘K
              </kbd>
            )}
          </button>

          <Button
            variant="primary"
            size={collapsed ? 'icon' : 'sm'}
            onClick={handleNewChat}
            aria-label={t.nav.newChat}
            title={t.nav.newChat}
            className={cn(!collapsed && 'w-full justify-start px-2.5')}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t.nav.newChat}</span>}
          </Button>
        </div>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-1.5 space-y-2" aria-label="Workspace sections">
        {NAV_GROUPS.map((group) => {
          const isGroupCollapsed = collapsedGroups[group.id];
          const groupLabel = t.nav.groups[group.id];
          return (
            <div key={group.id} className="space-y-0.5">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-2.5 py-0.5 text-[10px] font-medium tracking-[0.06em] uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] cursor-pointer"
                >
                  <span>{groupLabel}</span>
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-150',
                      isGroupCollapsed && '-rotate-90'
                    )}
                  />
                </button>
              )}

              {(!isGroupCollapsed || collapsed) && (
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const label = String(t.nav[item.labelKey]);
                    const isActive =
                      location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          title={collapsed ? label : undefined}
                          onClick={() => mobile && setMobileNavOpen(false)}
                          className={cn(
                            'relative flex items-center h-[30px] rounded-[6px] text-[13px] font-medium transition-colors duration-150 whitespace-nowrap',
                            collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
                            isActive
                              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]/70'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] border border-transparent'
                          )}
                        >
                          {isActive && !collapsed && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r bg-[var(--color-accent)]"
                            />
                          )}
                          <Icon className="w-[16px] h-[16px] shrink-0" />
                          {!collapsed && <span className="truncate flex-1">{label}</span>}
                          {!collapsed && item.to === '/tasks' && runningCount > 0 && (
                            <span className="font-mono-tech text-[11px] text-[var(--color-accent-text)]">
                              {runningCount}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom area */}
      <div className="p-2.5 border-t border-[var(--color-border)] space-y-2 shrink-0">
        {!collapsed && (
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-[var(--color-text-muted)]">
            <span className="truncate">{t.nav.runtimeConnected}</span>
            <span className="font-mono-tech text-[10px] text-[var(--color-success)]">OK</span>
          </div>
        )}
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-1.5' : 'justify-between gap-2 px-1')}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-3)] border border-[var(--color-border-strong)] text-[11px] font-semibold text-[var(--color-text-primary)]">
              OP
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">Operator</p>
                <p className="text-[11px] text-[var(--color-text-muted)] truncate">Asia/Bangkok</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Switch theme"
              title={`Theme: ${theme}`}
              onClick={cycleTheme}
              className="h-7 w-7"
            >
              {theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
