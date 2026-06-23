import { useListEvents, useCreateEvent, useDeleteEvent, useListUsers, getListEventsQueryKey } from '@workspace/api-client-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, CalendarPlus, Calendar, LayoutGrid } from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday,
  addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks,
  isSameDay, getHours, getMinutes, differenceInMinutes, parseISO, addDays,
} from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getAvatarClasses } from '@/lib/role-colors';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
const HOUR_HEIGHT = 48; // px per hour
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const VISIBLE_HOURS = DAY_END_HOUR - DAY_START_HOUR;

type UserInfo = { id: number; username: string; displayName: string | null; avatarUrl: string | null; role: string; subroles: string[] };

function AttendeeAvatars({ attendees }: { attendees: UserInfo[] }) {
  if (attendees.length === 0) return null;
  const shown = attendees.slice(0, 2);
  const extra = attendees.length - shown.length;
  return (
    <div className="flex -space-x-1">
      {shown.map(a => a.avatarUrl ? (
        <img key={a.id} src={a.avatarUrl} alt="" title={`@${a.username}`} className="w-3 h-3 rounded-full ring-1 ring-background" />
      ) : (
        <div key={a.id} title={`@${a.username}`}
          className={`w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-bold ring-1 ring-background ${getAvatarClasses(a.role, a.subroles)}`}
        >
          {a.username.charAt(0).toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-3 h-3 rounded-full bg-muted text-[6px] font-bold flex items-center justify-center ring-1 ring-background">+{extra}</div>
      )}
    </div>
  );
}

export function CalendarView() {
  const { t } = useTranslation();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventDialog, setEventDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [attendeeIds, setAttendeeIds] = useState<number[]>([]);

  const { data: events } = useListEvents();
  const { data: usersRaw } = useListUsers();
  const users = Array.isArray(usersRaw) ? usersRaw : [];
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });

  const openDialog = (day: Date) => {
    setSelectedDay(day);
    setTitle(''); setStartTime('09:00'); setEndTime('10:00');
    setAllDay(false); setColor(EVENT_COLORS[0]); setAttendeeIds([]);
    setEventDialog(true);
  };

  const handleCreate = async () => {
    if (!title.trim() || !selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const start = allDay ? new Date(`${dateStr}T00:00:00`) : new Date(`${dateStr}T${startTime}:00`);
    const end = allDay ? new Date(`${dateStr}T23:59:00`) : new Date(`${dateStr}T${endTime}:00`);
    await createEvent.mutateAsync({
      data: { title: title.trim(), startDate: start.toISOString(), endDate: end.toISOString(), allDay, color, attendeeIds } as any
    });
    invalidate();
    setEventDialog(false);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteEvent.mutateAsync({ id });
    invalidate();
  };

  // Month view helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const monthStartDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthEndDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: monthStartDate, end: monthEndDate });

  // Week view helpers
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: VISIBLE_HOURS }, (_, i) => i + DAY_START_HOUR);

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  const navigatePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };
  const navigateNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  const headerLabel = view === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;

  // Get events for a specific day
  const getEventsForDay = (day: Date) =>
    (events ?? []).filter(e => isSameDay(new Date(e.startDate), day));

  // Calculate position & height for a timed event in week view
  const getEventStyle = (event: any) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate ?? event.startDate);
    const startMins = (getHours(start) - DAY_START_HOUR) * 60 + getMinutes(start);
    const durationMins = Math.max(differenceInMinutes(end, start), 30);
    const top = (startMins / 60) * HOUR_HEIGHT;
    const height = (durationMins / 60) * HOUR_HEIGHT;
    return { top: Math.max(0, top), height: Math.min(height, VISIBLE_HOURS * HOUR_HEIGHT - Math.max(0, top)) };
  };

  return (
    <Card className="flex flex-col overflow-hidden" style={{ minHeight: 'calc(100vh - 260px)' }}>
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold min-w-[180px] text-center">{headerLabel}</h2>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 ml-1" onClick={goToday}>
            {t('calendar.today')}
          </Button>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-1">
          <button
            onClick={() => setView('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'month' ? 'bg-card shadow-sm text-foreground border border-border/40' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {t('calendar.monthView')}
          </button>
          <button
            onClick={() => setView('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'week' ? 'bg-card shadow-sm text-foreground border border-border/40' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {t('calendar.weekView')}
          </button>
        </div>
      </div>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'month' ? (
            <motion.div
              key="month"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/20">
                {dayKeys.map(day => (
                  <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
                    {t(`calendar.days.${day}`)}
                  </div>
                ))}
              </div>
              {/* Month grid */}
              <div
                className="flex-1 grid grid-cols-7"
                style={{ gridTemplateRows: `repeat(${Math.ceil(monthDays.length / 7)}, minmax(90px, 1fr))` }}
              >
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const todayStyle = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => openDialog(day)}
                      className={`border-r border-b border-border p-1.5 cursor-pointer group transition-colors hover:bg-muted/20 ${!isCurrentMonth ? 'opacity-35' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${todayStyle ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                          {format(day, 'd')}
                        </div>
                        <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map(event => {
                          const attendees = ((event as any).attendees ?? []) as UserInfo[];
                          const createdBy = (event as any).createdBy as UserInfo | null;
                          const displayAvatars = attendees.length > 0 ? attendees : createdBy ? [createdBy] : [];
                          const isAllDay = (event as any).allDay;
                          const startStr = !isAllDay && event.startDate ? format(new Date(event.startDate), 'HH:mm') : null;
                          const endStr = !isAllDay && event.endDate ? format(new Date(event.endDate), 'HH:mm') : null;
                          return (
                            <div
                              key={event.id}
                              onClick={e => e.stopPropagation()}
                              className="text-[10px] px-1.5 py-1 rounded-sm group/event"
                              style={{ backgroundColor: `${event.color ?? '#f59e0b'}20`, color: event.color ?? '#f59e0b', borderLeft: `2px solid ${event.color ?? '#f59e0b'}` }}
                            >
                              <div className="flex items-start justify-between gap-0.5">
                                <span className="truncate flex-1 font-semibold leading-tight">{event.title}</span>
                                <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                                  <AttendeeAvatars attendees={displayAvatars} />
                                  <Trash2 className="w-2.5 h-2.5 opacity-0 group-hover/event:opacity-100 cursor-pointer ml-0.5" onClick={e => handleDelete(event.id, e)} />
                                </div>
                              </div>
                              {startStr && endStr ? (
                                <div className="text-[9px] mt-0.5 font-medium opacity-80">{startStr} – {endStr}</div>
                              ) : isAllDay ? (
                                <div className="text-[9px] mt-0.5 font-medium opacity-70">{t('calendar.allDayFull')}</div>
                              ) : null}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-muted-foreground px-1">{t('calendar.moreEvents', { count: dayEvents.length - 3 })}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="week"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Week column headers */}
              <div className="grid border-b border-border bg-muted/20" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
                <div className="py-2" />
                {weekDays.map((day, i) => {
                  const todayStyle = isToday(day);
                  return (
                    <div key={i} className="py-2 text-center border-l border-border/40">
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {t(`calendar.days.${dayKeys[i]}`)}
                      </div>
                      <div className={`text-sm font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors ${todayStyle ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/60 cursor-pointer'}`}
                        onClick={() => openDialog(day)}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scrollable time grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="relative" style={{ height: VISIBLE_HOURS * HOUR_HEIGHT }}>
                  {/* Hour lines & labels */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="absolute w-full border-t border-border/30 flex"
                      style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
                    >
                      <div className="w-12 flex-shrink-0 pr-2 -translate-y-2.5">
                        <span className="text-[10px] text-muted-foreground/60 font-medium float-right">
                          {hour}:00
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Day columns */}
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', left: 0 }}>
                    <div /> {/* time gutter */}
                    {weekDays.map((day, colIdx) => {
                      const dayEvents = getEventsForDay(day);
                      const allDayEvents = dayEvents.filter(e => (e as any).allDay);
                      const timedEvents = dayEvents.filter(e => !(e as any).allDay);
                      return (
                        <div
                          key={colIdx}
                          className={`relative border-l border-border/40 cursor-pointer group ${isToday(day) ? 'bg-primary/[0.03]' : 'hover:bg-muted/10'}`}
                          style={{ height: VISIBLE_HOURS * HOUR_HEIGHT }}
                          onClick={() => openDialog(day)}
                        >
                          {/* Half-hour lines */}
                          {hours.map(hour => (
                            <div
                              key={hour}
                              className="absolute w-full border-t border-border/15"
                              style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                            />
                          ))}

                          {/* Add event indicator on hover */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Plus className="w-3.5 h-3.5 text-primary/60" />
                          </div>

                          {/* All-day events at top */}
                          {allDayEvents.map(event => (
                            <div
                              key={event.id}
                              onClick={e => e.stopPropagation()}
                              className="absolute left-0.5 right-0.5 z-10 group/ev"
                              style={{ top: 2 }}
                            >
                              <div
                                className="text-[10px] px-1.5 py-0.5 rounded font-semibold truncate flex items-center justify-between gap-1"
                                style={{ backgroundColor: `${event.color ?? '#f59e0b'}25`, color: event.color ?? '#f59e0b', borderLeft: `2px solid ${event.color ?? '#f59e0b'}` }}
                              >
                                <span className="truncate">{event.title}</span>
                                <Trash2 className="w-2.5 h-2.5 opacity-0 group-hover/ev:opacity-100 cursor-pointer flex-shrink-0" onClick={e => handleDelete(event.id, e)} />
                              </div>
                            </div>
                          ))}

                          {/* Timed events */}
                          {timedEvents.map(event => {
                            const { top, height } = getEventStyle(event);
                            const attendees = ((event as any).attendees ?? []) as UserInfo[];
                            return (
                              <div
                                key={event.id}
                                onClick={e => e.stopPropagation()}
                                className="absolute left-0.5 right-0.5 rounded overflow-hidden z-10 group/ev cursor-pointer hover:brightness-110 transition-all"
                                style={{
                                  top,
                                  height: Math.max(height, 22),
                                  backgroundColor: `${event.color ?? '#f59e0b'}25`,
                                  borderLeft: `2.5px solid ${event.color ?? '#f59e0b'}`,
                                }}
                              >
                                <div className="p-1 h-full flex flex-col justify-between">
                                  <div className="flex items-start justify-between gap-0.5">
                                    <span className="text-[10px] font-semibold truncate leading-tight" style={{ color: event.color ?? '#f59e0b' }}>
                                      {event.title}
                                    </span>
                                    <Trash2 className="w-2.5 h-2.5 opacity-0 group-hover/ev:opacity-100 flex-shrink-0 cursor-pointer" style={{ color: event.color ?? '#f59e0b' }} onClick={e => handleDelete(event.id, e)} />
                                  </div>
                                  {height > 40 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] opacity-70" style={{ color: event.color ?? '#f59e0b' }}>
                                        {format(new Date(event.startDate), 'HH:mm')} – {format(new Date(event.endDate ?? event.startDate), 'HH:mm')}
                                      </span>
                                      <AttendeeAvatars attendees={attendees} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {/* Create Event Dialog */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4" />
              {t('calendar.newEvent')}{selectedDay ? ` — ${format(selectedDay, 'MMM d, yyyy')}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t('calendar.titleLabel')} <span className="text-destructive">{t('calendar.required')}</span>
              </label>
              <Input
                placeholder={t('calendar.titlePlaceholder')}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
                {t('calendar.allDay')}
              </label>
            </div>

            {!allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t('calendar.startTime')}</label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t('calendar.endTime')}</label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9" />
                </div>
              </div>
            )}

            {users.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {t('calendar.attendees')}
                  {attendeeIds.length > 0 && (
                    <span className="ml-2 text-xs text-primary font-normal">{attendeeIds.length} {t('calendar.selected')}</span>
                  )}
                </label>
                <div className="border border-border/60 rounded-lg max-h-32 overflow-y-auto divide-y divide-border/30">
                  {users.map(u => {
                    const selected = attendeeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setAttendeeIds(prev => selected ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/40 ${selected ? 'bg-muted/30' : ''}`}
                      >
                        {u.robloxAvatarUrl ? (
                          <img src={u.robloxAvatarUrl} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                        ) : (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${getAvatarClasses(u.role, u.subroles ?? [])}`}>
                            {u.robloxUsername.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs flex-1 truncate">{u.robloxDisplayName || u.robloxUsername}</span>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-primary border-primary' : 'border-border/60'}`}>
                          {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('calendar.color')}</label>
              <div className="flex gap-2">
                {EVENT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleCreate} disabled={createEvent.isPending || !title.trim()}>
              {createEvent.isPending ? t('calendar.creating') : t('calendar.createEvent')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
