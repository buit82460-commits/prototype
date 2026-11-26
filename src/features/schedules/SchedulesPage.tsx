import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  ArrowLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Schedule } from '../../domain/types';
import { useMiroStore } from '../../stores/useMiroStore';
import { useTranslation } from '../../i18n/useTranslation';
import { launchTaskFromInstruction } from '../../services/mock/executionEngine';
import { formatTimeInZone } from '../../lib/format';
import { generateId, cn } from '../../lib/utils';
import {
  Button,
  Card,
  Input,
  SegmentedTabs,
  Select,
  StatusTag,
  Switch,
  Textarea,
} from '../../components/ui/primitives';
import { OwnershipBanner } from '../../components/shared/OwnershipBanner';

export function SchedulesPage() {
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const schedules = useMiroStore((s) => s.schedules);
  const profiles = useMiroStore((s) => s.browserProfiles);
  const tasks = useMiroStore((s) => s.tasks);
  const ownerships = useMiroStore((s) => s.ownerships);
  const timezone = useMiroStore((s) => s.settings.timezone);
  const upsertSchedule = useMiroStore((s) => s.upsertSchedule);
  const updateSchedule = useMiroStore((s) => s.updateSchedule);
  const deleteSchedule = useMiroStore((s) => s.deleteSchedule);
  const duplicateSchedule = useMiroStore((s) => s.duplicateSchedule);
  const setActiveContext = useMiroStore((s) => s.setActiveContext);

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarScope, setCalendarScope] = useState<'month' | 'week' | 'day'>('month');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [lastHumanEdit, setLastHumanEdit] = useState('');

  const selectedSchedule = scheduleId ? schedules.find((sc) => sc.id === scheduleId) : null;
  const linkedTaskId = searchParams.get('taskId') ?? selectedSchedule?.taskId;
  const linkedTask = tasks.find((tk) => tk.id === linkedTaskId);

  useEffect(() => {
    setActiveContext(
      selectedSchedule
        ? {
            resourceKind: 'schedule',
            resourceId: selectedSchedule.id,
            resourceLabel: selectedSchedule.name,
            projectId: selectedSchedule.projectId,
            taskId: linkedTaskId,
          }
        : { resourceLabel: undefined }
    );
  }, [selectedSchedule, linkedTaskId, setActiveContext]);

  const filtered = useMemo(() => {
    if (!search.trim()) return schedules;
    const q = search.toLowerCase();
    return schedules.filter(
      (sc) => sc.name.toLowerCase().includes(q) || sc.targetResourceLabel.toLowerCase().includes(q)
    );
  }, [schedules, search]);

  const handleCreateSchedule = () => {
    const id = generateId('sched');
    const prof = profiles[0];
    const next: Schedule = {
      id,
      name: 'Lịch trình tự động mới',
      instruction: 'Mô tả tác vụ Miro sẽ tự động chạy theo lịch này...',
      enabled: false,
      triggerType: 'recurring',
      time: '08:00',
      date: new Date().toISOString().slice(0, 10),
      recurrence: 'daily',
      timezone: timezone || 'Asia/Bangkok',
      targetResourceId: prof?.id ?? 'profile-20',
      targetResourceLabel: prof ? `${prof.name} · ${prof.alias}` : 'Profile 20',
      maxRunsPerDay: 1,
      missedRunPolicy: 'queue_next',
      approvalPolicy: 'require_approval',
      nextRun: new Date(Date.now() + 24 * 3600_000).toISOString(),
      status: 'draft',
      configuringField: null,
      history: [],
    };
    upsertSchedule(next);
    navigate(`/schedules/${id}`);
    toast.success('Đã tạo bản nháp lịch trình mới');
  };

  const handleRunNow = (sc: Schedule) => {
    launchTaskFromInstruction({
      instruction: sc.instruction,
      profileId: sc.targetResourceId,
      projectId: sc.projectId,
      trigger: 'schedule',
      overrideScenario: 'tiktok_research',
      openLive: false,
    });
    updateSchedule(sc.id, { lastRun: new Date().toISOString() });
    toast.success(`Đang chạy mô phỏng lịch "${sc.name}"`);
  };

  // Detail Editor View
  if (selectedSchedule) {
    const own = ownerships[selectedSchedule.id];
    const isHuman = own?.state === 'human_controlled';
    const aiRunning = linkedTask && (linkedTask.status === 'running' || linkedTask.status === 'planning');
    const fieldsDisabled = Boolean(aiRunning && !isHuman);

    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[1280px] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => navigate('/schedules')}>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Danh sách lịch trình</span>
              </Button>
              <StatusTag
                tone={
                  selectedSchedule.status === 'active'
                    ? 'success'
                    : selectedSchedule.status === 'configuring'
                    ? 'accent'
                    : 'neutral'
                }
              >
                {selectedSchedule.status}
              </StatusTag>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleRunNow(selectedSchedule)}>
                <Play className="w-3.5 h-3.5" />
                <span>{t.actions.runNow}</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  updateSchedule(selectedSchedule.id, { status: selectedSchedule.enabled ? 'active' : 'paused' });
                  toast.success('Đã lưu cấu hình lịch trình');
                }}
              >
                {t.actions.save}
              </Button>
            </div>
          </div>

          <OwnershipBanner
            resourceId={selectedSchedule.id}
            resourceKind="schedule"
            taskId={linkedTask?.id}
            editSummary={lastHumanEdit || 'Cập nhật thủ công biểu mẫu lịch trình'}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Main Form */}
            <Card className="lg:col-span-8 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-h3 text-[var(--color-text-primary)]">{selectedSchedule.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[var(--color-text-secondary)]">Kích hoạt</span>
                  <Switch
                    checked={selectedSchedule.enabled}
                    ariaLabel="Toggle schedule enabled"
                    onCheckedChange={(v) =>
                      updateSchedule(selectedSchedule.id, { enabled: v, status: v ? 'active' : 'paused' })
                    }
                  />
                </div>
              </div>

              <Input
                label="Tên lịch trình"
                value={selectedSchedule.name}
                highlighted={selectedSchedule.configuringField === 'name'}
                disabled={fieldsDisabled}
                onChange={(e) => {
                  updateSchedule(selectedSchedule.id, { name: e.target.value });
                  setLastHumanEdit(`Đổi tên thành "${e.target.value}"`);
                }}
              />

              <Textarea
                label="Hướng dẫn tác vụ cho Miro"
                value={selectedSchedule.instruction}
                highlighted={selectedSchedule.configuringField === 'instruction'}
                disabled={fieldsDisabled}
                onChange={(e) => {
                  updateSchedule(selectedSchedule.id, { instruction: e.target.value });
                  setLastHumanEdit('Cập nhật hướng dẫn tác vụ');
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Loại kích hoạt"
                  value={selectedSchedule.triggerType}
                  disabled={fieldsDisabled}
                  onChange={(e) =>
                    updateSchedule(selectedSchedule.id, {
                      triggerType: e.target.value as Schedule['triggerType'],
                    })
                  }
                >
                  <option value="recurring">Định kỳ</option>
                  <option value="once">Chạy một lần</option>
                  <option value="event">Theo sự kiện</option>
                </Select>
                <Input
                  label="Ngày bắt đầu"
                  type="date"
                  value={selectedSchedule.date}
                  disabled={fieldsDisabled}
                  onChange={(e) => updateSchedule(selectedSchedule.id, { date: e.target.value })}
                />
                <Input
                  label="Giờ chạy"
                  type="time"
                  value={selectedSchedule.time}
                  highlighted={selectedSchedule.configuringField === 'time'}
                  disabled={fieldsDisabled}
                  onChange={(e) => {
                    updateSchedule(selectedSchedule.id, { time: e.target.value });
                    setLastHumanEdit(`Đổi giờ chạy sang ${e.target.value}`);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Tần suất lặp lại"
                  value={selectedSchedule.recurrence}
                  highlighted={selectedSchedule.configuringField === 'time'}
                  disabled={fieldsDisabled}
                  onChange={(e) => {
                    updateSchedule(selectedSchedule.id, {
                      recurrence: e.target.value as Schedule['recurrence'],
                    });
                    setLastHumanEdit(`Đổi tần suất sang ${e.target.value}`);
                  }}
                >
                  <option value="daily">Hàng ngày</option>
                  <option value="weekdays">Thứ 2 – Thứ 6</option>
                  <option value="weekly">Hàng tuần</option>
                  <option value="hourly">Mỗi giờ</option>
                  <option value="once">Một lần</option>
                </Select>

                <Select
                  label="Múi giờ (IANA)"
                  value={selectedSchedule.timezone}
                  disabled={fieldsDisabled}
                  onChange={(e) => updateSchedule(selectedSchedule.id, { timezone: e.target.value })}
                >
                  <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Tài nguyên mục tiêu"
                  value={selectedSchedule.targetResourceId}
                  highlighted={selectedSchedule.configuringField === 'targetResourceId'}
                  disabled={fieldsDisabled}
                  onChange={(e) => {
                    const p = profiles.find((pr) => pr.id === e.target.value);
                    updateSchedule(selectedSchedule.id, {
                      targetResourceId: e.target.value,
                      targetResourceLabel: p ? `${p.name} · ${p.alias}` : e.target.value,
                    });
                  }}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.alias}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Giới hạn chạy/ngày"
                  type="number"
                  min={1}
                  max={24}
                  value={selectedSchedule.maxRunsPerDay}
                  disabled={fieldsDisabled}
                  onChange={(e) =>
                    updateSchedule(selectedSchedule.id, { maxRunsPerDay: Number(e.target.value) || 1 })
                  }
                />

                <Select
                  label="Khi lỡ lịch chạy"
                  value={selectedSchedule.missedRunPolicy}
                  disabled={fieldsDisabled}
                  onChange={(e) =>
                    updateSchedule(selectedSchedule.id, {
                      missedRunPolicy: e.target.value as Schedule['missedRunPolicy'],
                    })
                  }
                >
                  <option value="queue_next">Xếp vào lượt tiếp theo</option>
                  <option value="run_immediately">Chạy ngay khi sẵn sàng</option>
                  <option value="skip">Bỏ qua lượt lỡ</option>
                </Select>
              </div>

              <Select
                label="Chính sách phê duyệt"
                value={selectedSchedule.approvalPolicy}
                highlighted={selectedSchedule.configuringField === 'approvalPolicy'}
                disabled={fieldsDisabled}
                onChange={(e) =>
                  updateSchedule(selectedSchedule.id, {
                    approvalPolicy: e.target.value as Schedule['approvalPolicy'],
                  })
                }
              >
                <option value="auto">Tự động thực thi không cần hỏi lại</option>
                <option value="require_approval">Tạo yêu cầu phê duyệt trước mỗi lần chạy</option>
              </Select>
            </Card>

            {/* Right Summary & History */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="space-y-2.5 text-[13px]">
                <h2 className="text-h4 text-[var(--color-text-primary)]">Tóm tắt lịch trình</h2>
                <div className="space-y-1.5 text-[var(--color-text-secondary)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Lần chạy tiếp theo</span>
                    <span className="font-mono-tech text-[var(--color-text-primary)]">
                      {formatTimeInZone(selectedSchedule.nextRun, selectedSchedule.timezone)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Lần chạy gần nhất</span>
                    <span className="font-mono-tech">
                      {formatTimeInZone(selectedSchedule.lastRun, selectedSchedule.timezone)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Tài nguyên</span>
                    <span className="truncate max-w-[170px]">{selectedSchedule.targetResourceLabel}</span>
                  </div>
                </div>
              </Card>

              <Card className="space-y-3">
                <h2 className="text-h4 text-[var(--color-text-primary)]">Lịch sử thực thi</h2>
                {selectedSchedule.history.length === 0 ? (
                  <p className="text-[12px] text-[var(--color-text-muted)]">Chưa có lượt chạy lịch sử.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSchedule.history.map((h) => (
                      <div key={h.id} className="rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] p-2.5 text-[12px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">
                            {formatTimeInZone(h.runAt, selectedSchedule.timezone)}
                          </span>
                          <StatusTag tone={h.status === 'completed' ? 'success' : h.status === 'partial' ? 'warning' : 'error'}>
                            {h.status}
                          </StatusTag>
                        </div>
                        <p className="text-[var(--color-text-secondary)]">{h.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calendar Grid Helpers
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    calendarDays.push(d);
  }

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSchedulesForDay = (day: Date) =>
    filtered.filter((sc) => {
      if (sc.recurrence === 'daily' || sc.recurrence === 'hourly') return true;
      if (sc.recurrence === 'weekdays') return day.getDay() >= 1 && day.getDay() <= 5;
      if (sc.recurrence === 'weekly') return day.getDay() === 1;
      return isSameDay(new Date(sc.date), day);
    });

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 gap-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-h1 text-[var(--color-text-primary)]">{t.nav.schedules}</h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Quản lý lịch tự động hóa theo múi giờ IANA. Lịch tạo từ Chat và tạo thủ công đồng bộ chung một kho dữ liệu.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateSchedule}>
          <Plus className="w-4 h-4" />
          <span>{t.actions.createSchedule}</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="relative flex-1 max-w-[320px]">
          <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm lịch trình hoặc profile..."
            className="h-9 w-full rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] pl-8 pr-3 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus-ring)] focus:outline-none"
          />
        </div>

        <SegmentedTabs
          value={viewMode}
          onChange={setViewMode}
          items={[
            { value: 'list', label: t.common.list },
            { value: 'calendar', label: t.common.calendar },
          ]}
        />
      </div>

      {viewMode === 'list' ? (
        <div className="flex-1 overflow-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
          <table className="w-full border-collapse text-left min-w-[760px]">
            <thead className="sticky top-0 bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="h-[36px] text-[12px] font-medium text-[var(--color-text-secondary)]">
                <th className="px-3">Tên lịch trình</th>
                <th className="px-3">Bật/Tắt</th>
                <th className="px-3">Tần suất</th>
                <th className="px-3">Lần chạy tới</th>
                <th className="px-3">Tài nguyên</th>
                <th className="px-3">Trạng thái</th>
                <th className="px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filtered.map((sc) => (
                <tr
                  key={sc.id}
                  onClick={() => navigate(`/schedules/${sc.id}`)}
                  className="h-[52px] hover:bg-[var(--color-hover)]/60 cursor-pointer transition-colors"
                >
                  <td className="px-3">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{sc.name}</p>
                    <p className="text-[11px] font-mono-tech text-[var(--color-text-muted)]">{sc.time} · {sc.timezone}</p>
                  </td>
                  <td className="px-3" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={sc.enabled}
                      ariaLabel={`Toggle ${sc.name}`}
                      onCheckedChange={(v) =>
                        updateSchedule(sc.id, { enabled: v, status: v ? 'active' : 'paused' })
                      }
                    />
                  </td>
                  <td className="px-3 text-[12px] capitalize text-[var(--color-text-secondary)]">{sc.recurrence}</td>
                  <td className="px-3 font-mono-tech text-[12px] text-[var(--color-text-secondary)]">
                    {formatTimeInZone(sc.nextRun, sc.timezone)}
                  </td>
                  <td className="px-3 text-[12px] text-[var(--color-text-secondary)]">{sc.targetResourceLabel}</td>
                  <td className="px-3">
                    <StatusTag
                      tone={sc.status === 'active' ? 'success' : sc.status === 'configuring' ? 'accent' : 'neutral'}
                    >
                      {sc.status}
                    </StatusTag>
                  </td>
                  <td className="px-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Chạy ngay" aria-label={`Run ${sc.name}`} onClick={() => handleRunNow(sc)}>
                        <Play className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Nhân bản"
                        aria-label={`Duplicate ${sc.name}`}
                        onClick={() => {
                          duplicateSchedule(sc.id);
                          toast.info('Đã nhân bản lịch trình');
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa"
                        aria-label={`Delete ${sc.name}`}
                        onClick={() => {
                          deleteSchedule(sc.id);
                          toast.info('Đã xóa lịch trình');
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 hover:text-[var(--color-error)]" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" aria-label="Previous period" onClick={() => setAnchorDate(addDays(anchorDate, calendarScope === 'month' ? -30 : -7))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-h4 text-[var(--color-text-primary)] min-w-[150px] text-center">
                {format(anchorDate, 'MMMM yyyy')}
              </span>
              <Button variant="secondary" size="icon" aria-label="Next period" onClick={() => setAnchorDate(addDays(anchorDate, calendarScope === 'month' ? 30 : 7))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <SegmentedTabs
              value={calendarScope}
              onChange={setCalendarScope}
              items={[
                { value: 'month', label: 'Tháng' },
                { value: 'week', label: 'Tuần' },
                { value: 'day', label: 'Ngày' },
              ]}
            />
          </div>

          {calendarScope === 'day' ? (
            <Card className="flex-1 overflow-y-auto space-y-2.5">
              <p className="text-h4 text-[var(--color-text-primary)]">
                Lịch chạy ngày {format(selectedDate, 'dd/MM/yyyy')}
              </p>
              {getSchedulesForDay(selectedDate).map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => navigate(`/schedules/${sc.id}`)}
                  className="flex w-full items-center justify-between rounded-[8px] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3.5 py-3 text-left hover:border-[var(--color-accent-border)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tech text-[13px] font-medium text-[var(--color-accent-text)]">
                      {sc.time}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{sc.name}</p>
                      <p className="text-[12px] text-[var(--color-text-muted)]">{sc.targetResourceLabel}</p>
                    </div>
                  </div>
                  <StatusTag tone={sc.enabled ? 'success' : 'neutral'}>{sc.enabled ? 'Bật' : 'Tắt'}</StatusTag>
                </button>
              ))}
            </Card>
          ) : (
            <div className="flex-1 overflow-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
              <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-[11px] font-medium text-[var(--color-text-muted)]">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                  <div key={d} className="px-2.5 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 divide-x divide-y divide-[var(--color-border-subtle)] min-w-[680px]">
                {(calendarScope === 'month' ? calendarDays : weekDays).map((day) => {
                  const dayEvents = getSchedulesForDay(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const inMonth = isSameMonth(day, anchorDate);
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'min-h-[96px] p-2 space-y-1 cursor-pointer transition-colors',
                        !inMonth && calendarScope === 'month' && 'opacity-45',
                        isSelected && 'bg-[var(--color-surface-2)]/70'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full font-mono-tech text-[11px]',
                          isSameDay(day, new Date())
                            ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] font-semibold'
                            : 'text-[var(--color-text-secondary)]'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/schedules/${ev.id}`);
                            }}
                            className={cn(
                              'flex w-full items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] truncate border text-left cursor-pointer',
                              isSelected
                                ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent-border)] text-[var(--color-text-primary)]'
                                : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            )}
                          >
                            <CalendarClock className="w-3 h-3 shrink-0" />
                            <span className="font-mono-tech">{ev.time}</span>
                            <span className="truncate">{ev.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
