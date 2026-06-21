import { useListEvents, useCreateEvent, useDeleteEvent, useListUsers, getListEventsQueryKey } from '@workspace/api-client-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarPlus, User } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { getAvatarClasses } from '@/lib/role-colors';

const EVENT_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventDialog, setEventDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [assigneeId, setAssigneeId] = useState('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const { data: events } = useListEvents({
    query: { queryKey: ['events', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')] }
  });
  const { data: users } = useListUsers();

  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });

  const openDialog = (day: Date) => {
    setSelectedDay(day);
    setTitle(''); setStartTime('09:00'); setEndTime('10:00');
    setAllDay(false); setColor(EVENT_COLORS[0]); setAssigneeId('');
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
        assigneeId: assigneeId ? parseInt(assigneeId, 10) : undefined,
      }
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
                    const eventAssignee = (event as any).assignee;
                    const eventCreatedBy = (event as any).createdBy;
                    return (
                      <div
                        key={event.id}
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded-sm flex items-center justify-between group/event"
                        style={{ backgroundColor: `${event.color ?? '#f59e0b'}25`, color: event.color ?? '#f59e0b', borderLeft: `2px solid ${event.color ?? '#f59e0b'}` }}
                      >
                        <span className="truncate flex-1">{event.title}</span>
                        <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                          {eventAssignee?.avatarUrl ? (
                            <img src={eventAssignee.avatarUrl} alt="" title={`@${eventAssignee.username}`} className="w-3 h-3 rounded-full" />
                          ) : eventAssignee ? (
                            <div
                              title={`@${eventAssignee.username}`}
                              className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold ${getAvatarClasses(eventAssignee.role, eventAssignee.subroles)}`}
                            >
                              {eventAssignee.username.charAt(0).toUpperCase()}
                            </div>
                          ) : eventCreatedBy?.avatarUrl ? (
                            <img src={eventCreatedBy.avatarUrl} alt="" title={`@${eventCreatedBy.username}`} className="w-3 h-3 rounded-full opacity-60" />
                          ) : null}
                          <Trash2
                            className="w-2.5 h-2.5 opacity-0 group-hover/event:opacity-100 cursor-pointer"
                            onClick={e => handleDelete(event.id, e)}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
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
              <label className="flex items-center gap-2 cursor-pointer text-sm">
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

            <div>
              <label className="text-sm font-medium mb-1.5 block">Assign to</label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-3.5 h-3.5" /> Unassigned
                    </div>
                  </SelectItem>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      <div className="flex items-center gap-2">
                        {u.robloxAvatarUrl
                          ? <img src={u.robloxAvatarUrl} alt="" className="w-4 h-4 rounded-full" />
                          : <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${getAvatarClasses(u.role, u.subroles ?? [])}`}>{u.robloxUsername.charAt(0)}</div>
                        }
                        <span>{u.robloxDisplayName || u.robloxUsername}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
