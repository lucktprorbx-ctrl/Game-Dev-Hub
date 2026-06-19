import { PageTransition } from '@/components/ui/page-transition';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from '@/components/planning/KanbanBoard';
import { CalendarView } from '@/components/planning/CalendarView';

export default function Planning() {
  const { t } = useTranslation();

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.planning')}</h1>
      </div>
      
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-0">
          <KanbanBoard />
        </TabsContent>
        <TabsContent value="calendar" className="mt-0">
          <CalendarView />
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
