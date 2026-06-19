import { useState } from 'react';
import {
  useListBoards, useGetBoard, useUpdateTask, useCreateTask, useDeleteTask,
  useCreateBoard, getGetBoardQueryKey, getListBoardsQueryKey
} from '@workspace/api-client-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Columns2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export function KanbanBoard() {
  const { data: boards, isLoading: boardsLoading } = useListBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const activeBoardId = selectedBoardId ?? boards?.[0]?.id ?? null;

  const { data: board, isLoading: boardLoading } = useGetBoard(activeBoardId!, {
    query: { enabled: !!activeBoardId, queryKey: getGetBoardQueryKey(activeBoardId!) }
  });

  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const createBoard = useCreateBoard();
  const queryClient = useQueryClient();

  const [taskDialog, setTaskDialog] = useState<{ open: boolean; columnId: number | null }>({ open: false, columnId: null });
  const [newBoardDialog, setNewBoardDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [taskTags, setTaskTags] = useState('');
  const [boardName, setBoardName] = useState('');

  const invalidateBoard = () => {
    if (activeBoardId) queryClient.invalidateQueries({ queryKey: getGetBoardQueryKey(activeBoardId) });
    queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() });
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return;
    const destColId = parseInt(result.destination.droppableId, 10);
    const taskId = parseInt(result.draggableId, 10);
    await updateTask.mutateAsync({
      id: taskId,
      data: { columnId: destColId, position: result.destination.index }
    });
    invalidateBoard();
  };

  const openTaskDialog = (columnId: number) => {
    setTaskDialog({ open: true, columnId });
    setTaskTitle(''); setTaskDesc(''); setTaskPriority(''); setTaskTags('');
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskDialog.columnId || !activeBoardId) return;
    const tags = taskTags.split(',').map(t => t.trim()).filter(Boolean);
    await createTask.mutateAsync({
      data: {
        boardId: activeBoardId,
        columnId: taskDialog.columnId,
        title: taskTitle.trim(),
        description: taskDesc || undefined,
        priority: taskPriority || undefined,
        tags,
      }
    });
    invalidateBoard();
    setTaskDialog({ open: false, columnId: null });
  };

  const handleDeleteTask = async (id: number) => {
    await deleteTask.mutateAsync({ id });
    invalidateBoard();
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    const newBoard = await createBoard.mutateAsync({ data: { name: boardName.trim() } });
    queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() });
    setSelectedBoardId((newBoard as any).id);
    setNewBoardDialog(false);
    setBoardName('');
  };

  if (boardsLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-72 flex-shrink-0 bg-muted/20 rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Board selector toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {boards?.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBoardId(b.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              activeBoardId === b.id
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            {b.name}
          </button>
        ))}
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setNewBoardDialog(true)}>
          <Plus className="w-3.5 h-3.5" /> New Board
        </Button>
      </div>

      {boardLoading && (
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-72 flex-shrink-0 bg-muted/20 rounded-lg p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      )}

      {!boardLoading && !board && (
        <div className="text-center py-16 text-muted-foreground">
          <Columns2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No board selected. Create one to get started.</p>
        </div>
      )}

      {board && !boardLoading && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 items-start" style={{ minHeight: 'calc(100vh - 320px)' }}>
            {board.columns.map((column) => (
              <div key={column.id} className="w-72 flex-shrink-0 bg-card border border-border rounded-lg flex flex-col">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="font-medium text-sm">{column.name}</span>
                  <Badge variant="secondary" className="text-xs">{column.tasks.length}</Badge>
                </div>

                <Droppable droppableId={column.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 flex-1 space-y-2 min-h-[80px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-grab active:cursor-grabbing group transition-shadow ${
                                snapshot.isDragging ? 'ring-1 ring-primary shadow-lg shadow-primary/10 scale-[1.02]' : 'hover:border-border/80'
                              }`}
                            >
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <span className="font-medium text-sm leading-snug flex-1">{task.title}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                                )}
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap mb-2">
                                    {task.tags.map(tag => (
                                      <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/50">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                                <div className="flex justify-between items-center">
                                  {task.priority ? (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium uppercase ${PRIORITY_COLORS[task.priority]}`}>
                                      {task.priority}
                                    </span>
                                  ) : <span />}
                                  {task.assigneeUsername && (
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                                      {task.assigneeUsername.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="p-2 border-t border-border/50">
                  <button
                    onClick={() => openTaskDialog(column.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* New Task Dialog */}
      <Dialog open={taskDialog.open} onOpenChange={(open) => setTaskDialog({ open, columnId: open ? taskDialog.columnId : null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title <span className="text-destructive">*</span></label>
              <Input
                placeholder="Task title"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea placeholder="Optional description..." value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className="resize-none h-20 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Priority</label>
              <Select value={taskPriority} onValueChange={(v: any) => setTaskPriority(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags <span className="text-muted-foreground text-xs">(comma separated)</span></label>
              <Input placeholder="ui, bug, feature..." value={taskTags} onChange={e => setTaskTags(e.target.value)} className="h-9" />
            </div>
            <Button className="w-full" onClick={handleCreateTask} disabled={createTask.isPending || !taskTitle.trim()}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Board Dialog */}
      <Dialog open={newBoardDialog} onOpenChange={setNewBoardDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Board name"
              value={boardName}
              onChange={e => setBoardName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateBoard()}
              autoFocus
            />
            <Button className="w-full" onClick={handleCreateBoard} disabled={createBoard.isPending || !boardName.trim()}>
              {createBoard.isPending ? 'Creating...' : 'Create Board'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
