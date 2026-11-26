import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Bell,
  Menu,
  MessageSquareText,
  ShieldAlert,
} from 'lucide-react';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { isTaskActive } from '../../domain/taskMachine';
import { Button } from '../ui/primitives';
import { MiroWordmark } from '../shared/MiroWordmark';
import { cn } from '../../lib/utils';

export function GlobalHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tasks = useMiroStore((s) => s.tasks);
  const approvals = useMiroStore((s) => s.approvals);
  const interventions = useMiroStore((s) => s.interventions);
  const notifications = useMiroStore((s) => s.notifications);
  const activeContext = useMiroStore((s) => s.activeContext);
  const lastConversationRouteId = useMiroStore((s) => s.lastConversationRouteId);
  const setActiveConversation = useMiroStore((s) => s.setActiveConversation);
  const setLastConversationRouteId = useMiroStore((s) => s.setLastConversationRouteId);
  const setTaskMonitorOpen = useMiroStore((s) => s.setTaskMonitorOpen);
  const setApprovalCenterOpen = useMiroStore((s) => s.setApprovalCenterOpen);
  const setAiAssistantOpen = useMiroStore((s) => s.setAiAssistantOpen);
  const aiAssistantOpen = useMiroStore((s) => s.aiAssistantOpen);
  const setMobileNavOpen = useMiroStore((s) => s.setMobileNavOpen);

  const activeTaskCount = tasks.filter((tk) => isTaskActive(tk.status)).length;
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const openInterventions = interventions.filter((i) => !i.resolved).length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const attentionTotal = pendingApprovals + openInterventions;

  const segment = location.pathname.split('/')[1] || 'workspace';
  const pageTitleMap: Record<string, string> = {
    overview: t.nav.overview,
    workspace: t.nav.workspace,
    tasks: t.nav.tasks,
    projects: t.nav.projects,
    schedules: t.nav.schedules,
    workflows: t.nav.workflows,
    browser: t.nav.browser,
    research: t.nav.research,
    media: t.nav.media,
    publishing: t.nav.publishing,
    knowledge: t.nav.knowledge,
    activity: t.nav.activity,
    integrations: t.nav.integrations,
    settings: t.nav.settings,
  };
  const primaryCrumb = pageTitleMap[segment] ?? 'Miro';

  const handleBackToConversation = () => {
    if (lastConversationRouteId) {
      setActiveConversation(lastConversationRouteId);
    }
    setLastConversationRouteId(null);
    navigate('/workspace');
  };

  return (
    <header className="flex items-center justify-between gap-3 h-[52px] px-4 bg-[var(--color-header)] border-b border-[var(--color-border)] shrink-0">
      {/* Left: Mobile menu + Breadcrumb + Optional Back to Conversation */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden"
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div className="lg:hidden">
          <MiroWordmark size="sm" />
        </div>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-[13px] min-w-0">
          <span className="font-medium text-[var(--color-text-primary)] whitespace-nowrap">
            {primaryCrumb}
          </span>
          {activeContext.resourceLabel && segment !== 'workspace' && (
            <>
              <span className="text-[var(--color-text-muted)]" aria-hidden="true">/</span>
              <span className="text-[var(--color-text-secondary)] truncate max-w-[220px]">
                {activeContext.resourceLabel}
              </span>
            </>
          )}
        </nav>

        {lastConversationRouteId && segment !== 'workspace' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToConversation}
            className="hidden md:inline-flex h-7 px-2 text-[12px] text-[var(--color-accent-text)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.workspace.backToConversation}</span>
          </Button>
        )}
      </div>

      {/* Right: Subtle Demo Mode label + Global Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          title={t.brand.demoTooltip}
          className="hidden xl:inline-flex items-center text-[11px] text-[var(--color-text-muted)] mr-1.5 select-none whitespace-nowrap"
        >
          {t.brand.demoMode}
        </span>

        {/* Active Task Counter / Task Monitor */}
        <Button
          variant={activeTaskCount > 0 ? 'subtleAccent' : 'secondary'}
          size="sm"
          aria-label={t.header.taskMonitor}
          onClick={() => setTaskMonitorOpen(true)}
          className="h-8 gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="font-mono-tech text-[12px]">{activeTaskCount}</span>
          <span className="hidden sm:inline text-[12px]">{t.header.running}</span>
        </Button>

        {/* Pending Approvals & Interventions */}
        <Button
          variant="ghost"
          size="sm"
          aria-label={t.header.approvals}
          onClick={() => setApprovalCenterOpen(true)}
          className={cn(
            'h-8 px-2 gap-1.5',
            attentionTotal > 0 && 'text-[var(--color-warning)] hover:text-[var(--color-warning)]'
          )}
        >
          <ShieldAlert className="w-4 h-4" />
          {attentionTotal > 0 && (
            <span className="font-mono-tech text-[12px] font-medium">{attentionTotal}</span>
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t.header.notifications}
          onClick={() => setApprovalCenterOpen(true)}
          className="relative"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifs > 0 && (
            <span
              className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
              aria-hidden="true"
            />
          )}
        </Button>

        {/* Global Contextual AI Assistant */}
        {segment !== 'workspace' && (
          <Button
            variant={aiAssistantOpen ? 'subtleAccent' : 'secondary'}
            size="sm"
            aria-label={t.header.aiAssistant}
            onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
            className="h-8 gap-1.5"
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[12px]">Miro AI</span>
          </Button>
        )}
      </div>
    </header>
  );
}
