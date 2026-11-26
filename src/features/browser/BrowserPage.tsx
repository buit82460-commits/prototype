import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Chrome,
  Eye,
  Plug,
  RefreshCw,
  Search,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { formatTimeInZone } from '../../lib/format';
import { Button, Card, StatusTag } from '../../components/ui/primitives';
import { OwnershipBanner } from '../../components/shared/OwnershipBanner';
import { cn } from '../../lib/utils';

export function BrowserPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const profiles = useMiroStore((s) => s.browserProfiles);
  const tasks = useMiroStore((s) => s.tasks);
  const ownerships = useMiroStore((s) => s.ownerships);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const setProfileConnection = useMiroStore((s) => s.setProfileConnection);
  const updateProfile = useMiroStore((s) => s.updateProfile);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [search, setSearch] = useState('');
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

  const selectedProfile = profileId ? profiles.find((p) => p.id === profileId) : null;

  useEffect(() => {
    setActiveContext(
      selectedProfile
        ? {
            resourceKind: 'browser',
            resourceId: selectedProfile.id,
            resourceLabel: `${selectedProfile.name} · ${selectedProfile.alias}`,
          }
        : { resourceLabel: undefined }
    );
  }, [selectedProfile, setActiveContext]);

  const connectedCount = profiles.filter(
    (p) => p.connectionState === 'connected' || p.connectionState === 'busy'
  ).length;

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(
      (p) => p.name.toLowerCase().includes(q) || p.alias.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const connectionTone = (state: string) => {
    if (state === 'connected') return 'success';
    if (state === 'busy') return 'accent';
    if (state === 'disconnected') return 'error';
    if (state === 'reconnecting') return 'info';
    return 'warning';
  };

  // Profile Detail View
  if (selectedProfile) {
    const activeTab =
      selectedProfile.tabs.find((tb) => tb.id === selectedTabId) ??
      selectedProfile.tabs.find((tb) => tb.active) ??
      selectedProfile.tabs[0];
    const currentTask = tasks.find((tk) => tk.id === selectedProfile.currentTaskId);

    const handleReconnect = () => {
      setProfileConnection(selectedProfile.id, 'reconnecting');
      toast.info(`Đang kết nối lại ${selectedProfile.name} (Mô phỏng)...`);
      setTimeout(() => {
        setProfileConnection(selectedProfile.id, 'connected');
        toast.success(`${selectedProfile.name} đã kết nối trở lại`);
      }, 900);
    };

    const handleSimulateNavigate = (url: string, title: string) => {
      updateProfile(selectedProfile.id, (p) => ({
        ...p,
        lastActivity: new Date().toISOString(),
        tabs: p.tabs.map((tb) =>
          tb.id === activeTab?.id
            ? { ...tb, url, title, pageSummary: `Đang xem trang mô phỏng ${title}.` }
            : tb
        ),
        observations: [`Người dùng điều hướng thủ công tới ${url} (Demo).`, ...p.observations].slice(0, 8),
      }));
    };

    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[1360px] space-y-5">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => navigate('/browser')}>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Tất cả Profile</span>
              </Button>
              <h1 className="text-h2 text-[var(--color-text-primary)]">
                {selectedProfile.name}
                <span className="ml-2 text-h4 font-normal text-[var(--color-text-secondary)]">
                  · {selectedProfile.alias}
                </span>
              </h1>
              <StatusTag tone={connectionTone(selectedProfile.connectionState)}>
                {selectedProfile.connectionState}
              </StatusTag>
              <StatusTag tone={selectedProfile.identityVerification === 'verified' ? 'success' : 'warning'}>
                Identity: {selectedProfile.identityVerification}
              </StatusTag>
            </div>

            <div className="flex items-center gap-2">
              {selectedProfile.connectionState === 'disconnected' ||
              selectedProfile.connectionState === 'unverified' ? (
                <Button variant="primary" size="sm" onClick={handleReconnect}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Kết nối lại (Mô phỏng)</span>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setProfileConnection(selectedProfile.id, 'disconnected');
                    toast.warning(`Đã ngắt kết nối ${selectedProfile.name}`);
                  }}
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>Ngắt kết nối</span>
                </Button>
              )}
            </div>
          </div>

          <OwnershipBanner
            resourceId={selectedProfile.id}
            resourceKind="browser"
            taskId={currentTask?.id}
            editSummary={`Thao tác trực tiếp trên ${selectedProfile.name}`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Main Tabs + Simulated Browser Viewport */}
            <div className="lg:col-span-8 space-y-4">
              <Card className="p-0 overflow-hidden">
                {/* Browser Tab Strip */}
                <div className="flex items-center gap-1 px-3 pt-2.5 bg-[var(--color-surface-2)] border-b border-[var(--color-border)] overflow-x-auto">
                  {selectedProfile.tabs.map((tb) => (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => setSelectedTabId(tb.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-t-[6px] text-[12px] border-t border-x truncate max-w-[240px] cursor-pointer',
                        tb.id === activeTab?.id
                          ? 'bg-[var(--color-surface-1)] border-[var(--color-border)] text-[var(--color-text-primary)] font-medium'
                          : 'bg-transparent border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                      )}
                    >
                      {tb.title}
                    </button>
                  ))}
                </div>

                {/* Address Bar */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[var(--color-surface-1)] border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Chrome className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    <span className="truncate font-mono-tech text-[12px] text-[var(--color-text-secondary)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[4px] px-2.5 py-1 flex-1">
                      {activeTab?.url ?? 'about:blank'}
                    </span>
                  </div>
                  <StatusTag tone="neutral">Simulated Demo Viewport</StatusTag>
                </div>

                {/* Viewport Surface */}
                <div className="p-5 bg-[var(--color-canvas)] min-h-[300px] space-y-4">
                  {selectedProfile.connectionState === 'disconnected' ? (
                    <div className="py-12 text-center space-y-3">
                      <p className="text-h4 text-[var(--color-text-primary)]">Phiên trình duyệt đang ngắt kết nối</p>
                      <p className="text-[13px] text-[var(--color-text-secondary)] max-w-[440px] mx-auto">
                        Miro Bridge không nhận được tín hiệu từ {selectedProfile.name}. Nhấn "Kết nối lại" để khôi phục phiên mô phỏng.
                      </p>
                      <Button variant="primary" size="sm" onClick={handleReconnect}>
                        <Plug className="w-3.5 h-3.5" />
                        <span>Kết nối lại ngay</span>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-h4 text-[var(--color-text-primary)]">{activeTab?.title}</h2>
                        <span className="font-mono-tech text-[11px] text-[var(--color-accent-text)]">
                          Không lưu cookie hay mật khẩu thật
                        </span>
                      </div>
                      <p className="text-[13px] text-[var(--color-text-secondary)]">{activeTab?.pageSummary}</p>
                      {activeTab?.highlightElement && (
                        <div className="rounded-[8px] border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]/50 p-3 text-[12px] text-[var(--color-text-primary)]">
                          Phần tử đang quan sát: <span className="font-medium">{activeTab.highlightElement}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleSimulateNavigate('https://demo.tiktok.local/search?q=KANS+377', 'TikTok Demo — KANS 377')
                          }
                        >
                          Mở trang mẫu KANS 377
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleSimulateNavigate('https://demo.tiktok.local/trends/beauty', 'TikTok Trends — Beauty (Demo)')
                          }
                        >
                          Mở xu hướng làm đẹp (Demo)
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Inspector */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="space-y-2.5 text-[13px]">
                <h3 className="text-h4 text-[var(--color-text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-accent-text)]" />
                  <span>Quyền hạn phiên mô phỏng</span>
                </h3>
                <ul className="space-y-1.5 text-[12px] text-[var(--color-text-secondary)]">
                  {selectedProfile.permissions.map((perm) => (
                    <li key={perm} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]" />
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
                  Nguyên mẫu không truy cập trình duyệt thật và không bao giờ hiển thị cookie, mật khẩu hay token.
                </p>
              </Card>

              <Card className="space-y-2.5">
                <h3 className="text-h4 text-[var(--color-text-primary)]">Quan sát gần đây</h3>
                <div className="space-y-1.5">
                  {selectedProfile.observations.map((obs, idx) => (
                    <p key={idx} className="rounded-[6px] bg-[var(--color-surface-2)] px-3 py-2 text-[12px] text-[var(--color-text-secondary)]">
                      {obs}
                    </p>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile Table View
  return (
    <div className="h-full flex flex-col p-4 sm:p-6 gap-4 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.browser}</h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {connectedCount}/{profiles.length} profile mô phỏng đang kết nối · Tách biệt rõ trạng thái kết nối và xác minh danh tính.
          </p>
        </div>
        <div className="relative w-full sm:w-[260px]">
          <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm profile..."
            className="h-9 w-full rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] pl-8 pr-3 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-focus-ring)] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
        <table className="w-full border-collapse text-left min-w-[820px]">
          <thead className="sticky top-0 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
            <tr className="h-[36px] text-[12px] font-medium text-[var(--color-text-secondary)]">
              <th className="px-3">Profile</th>
              <th className="px-3">Kết nối</th>
              <th className="px-3">Xác minh danh tính</th>
              <th className="px-3">Tab mở</th>
              <th className="px-3">Quyền điều khiển</th>
              <th className="px-3">Hoạt động cuối</th>
              <th className="px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {filtered.map((p) => {
              const own = ownerships[p.id]?.state ?? 'ai_controlled';
              return (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/browser/${p.id}`)}
                  className="h-[52px] hover:bg-[var(--color-hover)]/60 cursor-pointer transition-colors"
                >
                  <td className="px-3">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{p.name}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{p.alias}</p>
                  </td>
                  <td className="px-3">
                    <StatusTag tone={connectionTone(p.connectionState)}>{p.connectionState}</StatusTag>
                  </td>
                  <td className="px-3">
                    <StatusTag tone={p.identityVerification === 'verified' ? 'success' : p.identityVerification === 'expired' ? 'error' : 'warning'}>
                      {p.identityVerification}
                    </StatusTag>
                  </td>
                  <td className="px-3 font-mono-tech text-[12px] text-[var(--color-text-secondary)]">
                    {p.tabs.length}
                  </td>
                  <td className="px-3 text-[12px] text-[var(--color-text-secondary)]">
                    {t.ownership[own]}
                  </td>
                  <td className="px-3 font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                    {formatTimeInZone(p.lastActivity, timezone)}
                  </td>
                  <td className="px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/browser/${p.id}`)}>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quan sát</span>
                      </Button>
                      {p.connectionState === 'disconnected' && (
                        <Button
                          variant="subtleAccent"
                          size="sm"
                          onClick={() => {
                            setProfileConnection(p.id, 'connected');
                            toast.success(`Đã kết nối lại ${p.name}`);
                          }}
                        >
                          Kết nối lại
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
