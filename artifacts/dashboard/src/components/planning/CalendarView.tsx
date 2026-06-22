import { useListEvents, useCreateEvent, useDeleteEvent, useListUsers, getListEventsQueryKey } from '@workspace/api-client-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, CalendarPlus } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getAvatarClasses } from '@/lib/role-colors';
import { useTranslation } from 'react-i18next';

const EVENT_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

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
        <div
          key={a.id}
          title={`@${a.username}`}
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventDialog, setEventDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [attendeeIds, setAttendeeIds] = useState<number[]>([]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const { data: events } = useListEvents();
  const { data: users } = useListUsers();

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
      data: {
        title: title.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        allDay,
        color,
        attendeeIds,
      } as any
    });
    invalidate();
    setEventDialog(false);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteEvent.mutateAsync({ id });
    invalidate();
  };

  return (
    <Card className="flex flex-col" style={{ minHeight: 'calc(100vh - 260px)' }}>
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">{day}</div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${Math.ceil(days.length / 7)}, minmax(100px, 1fr))` }}>
          {days.map((day) => {
            const dayEvents = events?.filter(e =>
              format(new Date(e.startDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            ) ?? [];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const todayStyle = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => openDialog(day)}
                className={`border-r border-b border-border p-1.5 cursor-pointer group transition-colors hover:bg-muted/20 ${!isCurrentMonth ? 'opacity-40' : ''}`}
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
                    const startStr = !isAllDay && event.startDate
                      ? format(new Date(event.startDate), 'HH:mm')
                      : null;
                    const endStr = !isAllDay && event.endDate
                      ? format(new Date(event.endDate), 'HH:mm')
                      : null;
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
                            <Trash2
                              className="w-2.5 h-2.5 opacity-0 group-hover/event:opacity-100 cursor-pointer ml-0.5"
                              onClick={e => handleDelete(event.id, e)}
                            />
                          </div>
                        </div>
                        {startStr && endStr ? (
                          <div className="text-[9px] mt-0.5 font-medium opacity-80">
                            {startStr} – {endStr}
                          </div>
                        ) : isAllDay ? (
                          <div className="text-[9px] mt-0.5 font-medium opacity-70">Toute la journée</div>
                        ) : null}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} de plus</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Create Event Dialog */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4" />
              New Event — {selectedDay ? format(selectedDay, 'MMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title <span className="text-destructive">*</span></label>
              <Input placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
                All day
              </label>
            </div>

            {!allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Start</label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">End</label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9" />
                </div>
              </div>
            )}

            {/* Multi-attendee */}
            {users && users.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Attendees
                  {attendeeIds.length > 0 && (
                    <span className="ml-2 text-xs text-primary font-normal">{attendeeIds.length} selected</span>
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
              <label className="text-sm font-medium mb-1.5 block">Color</label>
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
              {createEvent.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
