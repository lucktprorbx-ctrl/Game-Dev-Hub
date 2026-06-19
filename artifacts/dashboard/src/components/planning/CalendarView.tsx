import { useListEvents } from '@workspace/api-client-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const { data: events } = useListEvents({
    query: {
      queryKey: ['events', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')]
    }
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)]">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {days.map((day, idx) => {
            const dayEvents = events?.filter(e => {
              const eventDate = new Date(e.startDate);
              return format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
            }) || [];

            return (
              <div 
                key={day.toISOString()} 
                className={`min-h-[100px] border-r border-b border-border p-2 ${!isSameMonth(day, monthStart) ? 'bg-muted/20 opacity-50' : ''}`}
              >
                <div className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="text-xs truncate px-1.5 py-0.5 rounded-sm bg-accent/20 text-accent font-medium"
                      style={event.color ? { backgroundColor: `${event.color}33`, color: event.color } : {}}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
