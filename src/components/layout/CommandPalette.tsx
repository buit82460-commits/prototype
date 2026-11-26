import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  CalendarClock,
  Chrome,
  Film,
  Folder,
  Globe,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Moon,
  Plug,
  Plus,
  Search,
  Send,
  Settings,
  Workflow,
} from 'lucide-react';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { launchTaskFromInstruction } from '../../services/mock/executionEngine';
import { cn } from '../../lib/utils';

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const open = useMiroStore((s) => s.commandPaletteOpen);
  const setOpen = useMiroStore((s) => s.setCommandPaletteOpen);
  const tasks = useMiroStore((s) => s.tasks);
  const projects = useMiroStore((s) => s.projects);
  const schedules = useMiroStore((s) => s.schedules);
  const mediaAssets = useMiroStore((s) => s.mediaAssets);
  const profiles = useMiroStore((s) => s.browserProfiles);
  const theme = useMiroStore((s) => s.settings.theme);
  const updateSettings = useMiroStore((s) => s.updateSettings);
  const setTaskMonitorOpen = useMiroStore((s) => s.setTaskMonitorOpen);

  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    setQuery('');
    fn();
  };

  const items = useMemo<PaletteItem[]>(() => {
    const navItems: PaletteItem[] = [
      { id: 'nav-ws', group: 'Điều hướng', label: t.nav.workspace, icon: <MessageSquare className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/workspace')) },
      { id: 'nav-ov', group: 'Điều hướng', label: t.nav.overview, icon: <LayoutDashboard className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/overview')) },
      { id: 'nav-tk', group: 'Điều hướng', label: t.nav.tasks, icon: <ListChecks className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/tasks')) },
      { id: 'nav-pj', group: 'Điều hướng', label: t.nav.projects, icon: <Folder className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/projects')) },
      { id: 'nav-sc', group: 'Điều hướng', label: t.nav.schedules, icon: <CalendarClock className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/schedules')) },
      { id: 'nav-wf', group: 'Điều hướng', label: t.nav.workflows, icon: <Workflow className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/workflows')) },
      { id: 'nav-br', group: 'Điều hướng', label: t.nav.browser, icon: <Chrome className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/browser')) },
      { id: 'nav-rs', group: 'Điều hướng', label: t.nav.research, icon: <Search className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/research')) },
      { id: 'nav-md', group: 'Điều hướng', label: t.nav.media, icon: <Film className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/media')) },
      { id: 'nav-pb', group: 'Điều hướng', label: t.nav.publishing, icon: <Send className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/publishing')) },
      { id: 'nav-kn', group: 'Điều hướng', label: t.nav.knowledge, icon: <BookOpen className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/knowledge')) },
      { id: 'nav-ac', group: 'Điều hướng', label: t.nav.activity, icon: <Activity className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/activity')) },
      { id: 'nav-in', group: 'Điều hướng', label: t.nav.integrations, icon: <Plug className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/integrations')) },
      { id: 'nav-st', group: 'Điều hướng', label: t.nav.settings, icon: <Settings className="w-4 h-4" />, onSelect: () => closeAnd(() => navigate('/settings')) },
    ];

    const quickActions: PaletteItem[] = [
      {
        id: 'act-new-sched',
        group: 'Hành động nhanh',
        label: 'Tạo lịch nghiên cứu 10 video KANS 377 (08:00 mỗi ngày)',
        sublabel: 'Kịch bản A',
        icon: <Plus className="w-4 h-4 text-[var(--color-accent-text)]" />,
        onSelect: () =>
          closeAnd(() => {
            launchTaskFromInstruction({
              instruction: 'Tạo lịch nghiên cứu 10 video TikTok về KANS 377 vào 8 giờ sáng mỗi ngày.',
              overrideScenario: 'schedule_create',
              trigger: 'manual',
            });
            navigate('/workspace');
          }),
      },
      {
        id: 'act-monitor',
        group: 'Hành động nhanh',
        label: t.header.taskMonitor,
        sublabel: 'Mở bảng giám sát tác vụ toàn cục',
        icon: <Activity className="w-4 h-4" />,
        onSelect: () => closeAnd(() => setTaskMonitorOpen(true)),
      },
      {
        id: 'act-theme',
        group: 'Hành động nhanh',
        label: `Đổi giao diện (hiện tại: ${theme})`,
        icon: <Moon className="w-4 h-4" />,
        onSelect: () =>
          closeAnd(() => {
            const order = ['midnight-lime', 'navy-cream', 'light'] as const;
            const idx = order.indexOf(theme as (typeof order)[number]);
            updateSettings({ theme: order[(idx + 1) % order.length] });
          }),
      },
      {
        id: 'act-lang',
        group: 'Hành động nhanh',
        label: language === 'vi' ? 'Chuyển sang Tiếng Anh (English)' : 'Switch to Vietnamese (Tiếng Việt)',
        icon: <Globe className="w-4 h-4" />,
        onSelect: () => closeAnd(() => updateSettings({ language: language === 'vi' ? 'en' : 'vi' })),
      },
    ];

    const taskItems: PaletteItem[] = tasks.slice(0, 6).map((tk) => ({
      id: `tk-${tk.id}`,
      group: 'Tác vụ',
      label: tk.title,
      sublabel: `${t.status[tk.status]} · ${tk.resource.label}`,
      icon: <ListChecks className="w-4 h-4" />,
      onSelect: () => closeAnd(() => navigate(`/tasks/${tk.id}`)),
    }));

    const projectItems: PaletteItem[] = projects.map((p) => ({
      id: `pj-${p.id}`,
      group: 'Dự án',
      label: p.name,
      sublabel: p.accentTag,
      icon: <Folder className="w-4 h-4" />,
      onSelect: () => closeAnd(() => navigate(`/projects/${p.id}`)),
    }));

    const scheduleItems: PaletteItem[] = schedules.map((sc) => ({
      id: `sc-${sc.id}`,
      group: 'Lịch trình',
      label: sc.name,
      sublabel: `${sc.time} · ${sc.timezone}`,
      icon: <CalendarClock className="w-4 h-4" />,
      onSelect: () => closeAnd(() => navigate(`/schedules/${sc.id}`)),
    }));

    const profileItems: PaletteItem[] = profiles.map((p) => ({
      id: `pf-${p.id}`,
      group: 'Trình duyệt',
      label: `${p.name} · ${p.alias}`,
      sublabel: p.connectionState,
      icon: <Chrome className="w-4 h-4" />,
      onSelect: () => closeAnd(() => navigate(`/browser/${p.id}`)),
    }));

    const mediaItems: PaletteItem[] = mediaAssets.map((m) => ({
      id: `md-${m.id}`,
      group: 'Media Studio',
      label: m.name,
      sublabel: `${m.collection} · ${m.durationSec}s`,
      icon: <Film className="w-4 h-4" />,
      onSelect: () => closeAnd(() => navigate(`/media/${m.id}`)),
    }));

    const all = [
      ...quickActions,
      ...navItems,
      ...taskItems,
      ...projectItems,
      ...scheduleItems,
      ...profileItems,
      ...mediaItems,
    ];

    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.sublabel?.toLowerCase().includes(q) ?? false) ||
        i.group.toLowerCase().includes(q)
    );
  }, [query, tasks, projects, schedules, profiles, mediaAssets, theme, language, t]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => (items.length ? (i + 1) % items.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
      } else if (e.key === 'Enter' && items[selectedIdx]) {
        e.preventDefault();
        items[selectedIdx].onSelect();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, selectedIdx, setOpen]);

  if (!open) return null;

  const grouped = items.reduce<Record<string, { item: PaletteItem; flatIdx: number }[]>>((acc, item, idx) => {
    (acc[item.group] ??= []).push({ item, flatIdx: idx });
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-[var(--color-overlay)] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={t.header.commandPalette}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-[600px] rounded-[12px] bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-[var(--color-border)]">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm trang, tác vụ, dự án, lịch trình, profile hoặc hành động..."
            className="flex-1 bg-transparent text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
          <kbd className="font-mono-tech text-[11px] text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[4px] px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
          {items.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--color-text-muted)]">
              Không tìm thấy kết quả phù hợp cho "{query}".
            </p>
          ) : (
            Object.entries(grouped).map(([group, entries]) => (
              <div key={group} className="space-y-0.5">
                <p className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">
                  {group}
                </p>
                {entries.map(({ item, flatIdx }) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setSelectedIdx(flatIdx)}
                    onClick={item.onSelect}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-[6px] px-2.5 py-2 text-left text-[13px] transition-colors cursor-pointer',
                      flatIdx === selectedIdx
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0 text-[var(--color-text-muted)]">{item.icon}</span>
                      <span className="truncate font-medium">{item.label}</span>
                    </span>
                    {item.sublabel && (
                      <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[180px] shrink-0">
                        {item.sublabel}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/60 text-[11px] text-[var(--color-text-muted)]">
          <span>↑↓ Di chuyển · Enter Chọn · Esc Đóng</span>
          <span className="font-mono-tech">miro. command</span>
        </div>
      </div>
    </div>
  );
}
