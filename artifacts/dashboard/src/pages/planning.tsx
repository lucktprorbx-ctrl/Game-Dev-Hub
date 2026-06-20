import { useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { useListBoards, useCreateBoard, useDeleteBoard, getListBoardsQueryKey } from '@workspace/api-client-react';
import { KanbanBoard } from '@/components/planning/KanbanBoard';
import { CalendarView } from '@/components/planning/CalendarView';
import { NotesView } from '@/components/planning/NotesView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Columns2, ArrowLeft, Trash2, CalendarDays, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface SelectedBoard {
  id: number;
  name: string;
  color: string | null;
}

const BOARD_COLORS = [
  'bg-amber-500/20 border-amber-500/30',
  'bg-indigo-500/20 border-indigo-500/30',
  'bg-emerald-500/20 border-emerald-500/30',
  'bg-pink-500/20 border-pink-500/30',
  'bg-sky-500/20 border-sky-500/30',
  'bg-violet-500/20 border-violet-500/30',
];

const DOT_COLORS = [
  'bg-amber-400', 'bg-indigo-400', 'bg-emerald-400',
  'bg-pink-400', 'bg-sky-400', 'bg-violet-400',
];

export default function Planning() {
  const { t } = useTranslation();
  const { data: boardsData, isLoading } = useListBoards();
  const boards = Array.isArray(boardsData) ? boardsData : [];
  const [selectedBoard, setSelectedBoard] = useState<SelectedBoard | null>(null);
  const [newBoardDialog, setNewBoardDialog] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const queryClient = useQueryClient();

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    await createBoard.mutateAsync({ data: { name: boardName.trim() } });
    queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() });
    setNewBoardDialog(false);
    setBoardName('');
  };

  const handleDeleteBoard = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteBoard.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() });
      if (selectedBoard?.id === id) setSelectedBoard(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (selectedBoard) {
    return (
      <PageTransition>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelectedBoard(null)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> {t('planning.boards')}
            </button>
            <span className="text-muted-foreground/40">/</span>
            <h1 className="text-2xl font-bold tracking-tight">{selectedBoard.name}</h1>
          </div>

          <Tabs defaultValue="kanban" className="w-full flex-1">
            <TabsList className="mb-4">
              <TabsTrigger value="kanban" className="gap-1.5">
                <Columns2 className="w-3.5 h-3.5" />{t('planning.kanban')}
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />{t('planning.calendar')}
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5">
                <FileText className="w-3.5 h-3.5" />{t('planning.notes')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="kanban" className="mt-0">
              <KanbanBoard boardId={selectedBoard.id} />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <CalendarView />
            </TabsContent>
            <TabsContent value="notes" className="mt-0">
              <NotesView boardId={selectedBoard.id} />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('planning.title')}</h1>
        <Button size="sm" className="gap-1.5" onClick={() => setNewBoardDialog(true)}>
          <Plus className="w-4 h-4" /> {t('planning.newBoard')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : boards.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
        >
          {boards.map((board, idx) => (
            <motion.div
              key={board.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              <Card
                className={`cursor-pointer group hover:border-primary/30 transition-all border ${BOARD_COLORS[idx % BOARD_COLORS.length]}`}
                onClick={() => setSelectedBoard({ id: board.id, name: board.name, color: board.color })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_COLORS[idx % DOT_COLORS.length]}`} />
                      <Columns2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <button
                      onClick={(e) => handleDeleteBoard(e, board.id)}
                      disabled={deletingId === board.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{board.name}</h3>
                  {board.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{board.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-auto">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Columns2 className="w-8 h-8 text-primary/60" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t('planning.noBoardsTitle')}</h3>
          <p className="text-muted-foreground text-sm mb-4">{t('planning.noBoardsDesc')}</p>
          <Button onClick={() => setNewBoardDialog(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> {t('planning.newBoard')}
          </Button>
        </div>
      )}

      <Dialog open={newBoardDialog} onOpenChange={setNewBoardDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('planning.newBoardDialog')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder={t('planning.boardNamePlaceholder')}
              value={boardName}
              onChange={e => setBoardName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateBoard()}
              autoFocus
            />
            <Button className="w-full" onClick={handleCreateBoard} disabled={createBoard.isPending || !boardName.trim()}>
              {createBoard.isPending ? t('planning.creating') : t('planning.createBoard')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
