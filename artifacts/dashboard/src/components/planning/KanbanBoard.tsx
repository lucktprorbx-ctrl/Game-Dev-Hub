import { useState, useRef, useEffect } from 'react';
import {
  useGetBoard, useUpdateTask, useCreateTask, useDeleteTask,
  useCreateBoardColumn, useUpdateBoardColumn, useDeleteBoardColumn,
  useListUsers,
  getGetBoardQueryKey,
} from '@workspace/api-client-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, GripVertical, X, Pencil, Check, User, UserCog } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getAvatarClasses, getSubroleClasses } from '@/lib/role-colors';
import { motion, AnimatePresence } from 'framer-motion';

interface KanbanBoardProps {
  boardId: number;
}

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

type UserInfo = {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  subroles: string[];
} | null;

function UserAvatar({ user, size = 'sm' }: { user: UserInfo; size?: 'sm' | 'md' }) {
  if (!user) return null;
  const sz = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-xs';
  const classes = getAvatarClasses(user.role, user.subroles);
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.username}
        title={`@${user.username}`}
        className={`${sz} rounded-full object-cover flex-shrink-0 ring-1 ring-border/50`}
      />
    );
  }
  return (
    <div
      title={`@${user.username}`}
      className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${classes}`}
    >
      {user.username.charAt(0).toUpperCase()}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.15 } },
};

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { data: board, isLoading: boardLoading } = useGetBoard(boardId, {
    query: { queryKey: getGetBoardQueryKey(boardId) }
  });
  const { data: users } = useListUsers();

  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const createCol = useCreateBoardColumn();
  const updateCol = useUpdateBoardColumn();
  const deleteCol = useDeleteBoardColumn();
  const queryClient = useQueryClient();

  const [taskDialog, setTaskDialog] = useState<{ open: boolean; columnId: number | null }>({ open: false, columnId: null });
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [taskTags, setTaskTags] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>('');

  const [addingCol, setAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [editingColId, setEditingColId] = useState<number | null>(null);
  const [editingColName, setEditingColName] = useState('');
  const [assigneePopoverTaskId, setAssigneePopoverTaskId] = useState<number | null>(null);
  const newColInputRef = useRef<HTMLInputElement>(null);
  const editColInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (addingCol) newColInputRef.current?.focus(); }, [addingCol]);
  useEffect(() => { if (editingColId !== null) editColInputRef.current?.focus(); }, [editingColId]);

  const invalidateBoard = () => queryClient.invalidateQueries({ queryKey: getGetBoardQueryKey(boardId) });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return;
    if (result.type === 'COLUMN') {
      const colId = parseInt(result.draggableId.replace('col-', ''), 10);
      await updateCol.mutateAsync({ id: colId, data: { position: result.destination.index } });
    } else {
      const taskId = parseInt(result.draggableId, 10);
      const destColId = parseInt(result.destination.droppableId, 10);
      await updateTask.mutateAsync({ id: taskId, data: { columnId: destColId, position: result.destination.index } });
    }
    invalidateBoard();
  };

  const openTaskDialog = (columnId: number) => {
    setTaskDialog({ open: true, columnId });
    setTaskTitle(''); setTaskDesc(''); setTaskPriority(''); setTaskTags(''); setTaskAssigneeId('');
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !taskDialog.columnId) return;
    const tags = taskTags.split(',').map(t => t.trim()).filter(Boolean);
    await createTask.mutateAsync({
      data: {
        boardId,
        columnId: taskDialog.columnId,
        title: taskTitle.trim(),
        description: taskDesc || undefined,
        priority: taskPriority || undefined,
        tags,
        assigneeId: taskAssigneeId ? parseInt(taskAssigneeId, 10) : undefined,
      }
    });
    invalidateBoard();
    setTaskDialog({ open: false, columnId: null });
  };

  const handleDeleteTask = async (id: number) => {
    await deleteTask.mutateAsync({ id });
    invalidateBoard();
  };

  const handleChangeAssignee = async (taskId: number, userId: number | null) => {
    await updateTask.mutateAsync({ id: taskId, data: { assigneeId: userId ?? undefined } });
    invalidateBoard();
    setAssigneePopoverTaskId(null);
  };

  const handleAddColumn = async () => {
    if (!newColName.trim()) { setAddingCol(false); return; }
    await createCol.mutateAsync({ boardId, data: { name: newColName.trim() } });
    invalidateBoard();
    setNewColName(''); setAddingCol(false);
  };

  const handleDeleteColumn = async (id: number) => {
    await deleteCol.mutateAsync({ id });
    invalidateBoard();
  };

  const startEditCol = (id: number, currentName: string) => {
    setEditingColId(id); setEditingColName(currentName);
  };

  const handleRenameColumn = async () => {
    if (!editingColId || !editingColName.trim()) { setEditingColId(null); return; }
    await updateCol.mutateAsync({ id: editingColId, data: { name: editingColName.trim() } });
    invalidateBoard();
    setEditingColId(null);
  };

  if (boardLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-72 flex-shrink-0 bg-muted/20 rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!board) return null;

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 overflow-x-auto pb-4 items-start"
              style={{ minHeight: 'calc(100vh - 340px)' }}
            >
              {[...board.columns].sort((a, b) => a.position - b.position).map((column, colIndex) => (
                <Draggable key={column.id} draggableId={`col-${column.id}`} index={colIndex}>
                  {(colProvided, colSnapshot) => (
                    <div
                      ref={colProvided.innerRef}
                      {...colProvided.draggableProps}
                      className={`w-72 flex-shrink-0 bg-card border border-border rounded-lg flex flex-col transition-shadow ${colSnapshot.isDragging ? 'shadow-xl ring-1 ring-primary/30' : ''}`}
                    >
                      {/* Column header */}
                      <div className="p-2.5 border-b border-border flex items-center gap-1.5 group/col">
                        <span {...colProvided.dragHandleProps} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0">
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                        {editingColId === column.id ? (
                          <Input
                            ref={editColInputRef}
                            value={editingColName}
                            onChange={e => setEditingColName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameColumn();
                              if (e.key === 'Escape') setEditingColId(null);
                            }}
                            className="h-6 text-sm py-0 px-1.5 flex-1 border-border/60"
                          />
                        ) : (
                          <span
                            className="font-medium text-sm flex-1 truncate cursor-pointer"
                            onDoubleClick={() => startEditCol(column.id, column.name)}
                            title="Double-click to rename"
                          >
                            {column.name}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs flex-shrink-0">{column.tasks.length}</Badge>
                        {editingColId === column.id ? (
                          <button onClick={handleRenameColumn} className="text-emerald-400 hover:text-emerald-300 flex-shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => startEditCol(column.id, column.name)} className="opacity-0 group-hover/col:opacity-100 transition-opacity text-muted-foreground hover:text-foreground flex-shrink-0">
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteColumn(column.id)} className="opacity-0 group-hover/col:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tasks */}
                      <Droppable droppableId={column.id.toString()} type="TASK">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-2 flex-1 space-y-2 min-h-[80px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                          >
                            <AnimatePresence initial={false}>
                              {[...column.tasks].sort((a, b) => a.position - b.position).map((task, index) => {
                                const assignee = (task as any).assignee as UserInfo;
                                const createdBy = (task as any).createdBy as UserInfo;
                                return (
                                  <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                    {(provided, snapshot) => (
                                      <motion.div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="show"
                                        exit="exit"
                                        whileHover={!snapshot.isDragging ? { y: -2, transition: { duration: 0.15 } } : undefined}
                                        layout
                                      >
                                        <Card
                                          className={`cursor-grab active:cursor-grabbing group transition-all ${snapshot.isDragging ? 'ring-1 ring-primary shadow-lg shadow-primary/10 scale-[1.02]' : 'hover:border-border/80 hover:shadow-md hover:shadow-black/20'}`}
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
                                            <div className="flex justify-between items-center mt-1">
                                              <div className="flex items-center gap-1.5">
                                                {task.priority && (
                                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium uppercase ${PRIORITY_COLORS[task.priority]}`}>
                                                    {task.priority}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                {/* Creator chip (small) */}
                                                {createdBy && (
                                                  <div title={`Created by @${createdBy.username}`}>
                                                    <UserAvatar user={createdBy} size="sm" />
                                                  </div>
                                                )}

                                                {/* Assignee chip — clickable to edit */}
                                                <Popover
                                                  open={assigneePopoverTaskId === task.id}
                                                  onOpenChange={(open) => setAssigneePopoverTaskId(open ? task.id : null)}
                                                >
                                                  <PopoverTrigger asChild>
                                                    <button
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="flex items-center gap-1 focus:outline-none"
                                                      title="Change assignee"
                                                    >
                                                      {assignee ? (
                                                        <motion.div
                                                          whileHover={{ scale: 1.15 }}
                                                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all ${getAvatarClasses(assignee.role, assignee.subroles)}`}
                                                        >
                                                          {assignee.avatarUrl ? (
                                                            <img src={assignee.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full" />
                                                          ) : null}
                                                          <span>{assignee.displayName || assignee.username}</span>
                                                        </motion.div>
                                                      ) : (
                                                        <motion.div
                                                          whileHover={{ scale: 1.1, opacity: 1 }}
                                                          className="opacity-0 group-hover:opacity-60 flex items-center gap-0.5 text-[10px] text-muted-foreground border border-dashed border-border/60 px-1.5 py-0.5 rounded-full transition-opacity cursor-pointer hover:border-primary/40"
                                                        >
                                                          <UserCog className="w-3 h-3" />
                                                          <span>Assign</span>
                                                        </motion.div>
                                                      )}
                                                    </button>
                                                  </PopoverTrigger>
                                                  <PopoverContent
                                                    className="w-52 p-1.5"
                                                    side="top"
                                                    align="end"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <p className="text-[10px] text-muted-foreground px-2 py-1 uppercase tracking-wider font-semibold">Assign to</p>
                                                    {/* Unassign option */}
                                                    <button
                                                      onClick={() => handleChangeAssignee(task.id, null)}
                                                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted/60 transition-colors text-left ${!assignee ? 'bg-muted/40' : ''}`}
                                                    >
                                                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                        <User className="w-3 h-3 text-muted-foreground" />
                                                      </div>
                                                      <span className="text-muted-foreground text-xs">Unassigned</span>
                                                      {!assignee && <Check className="w-3 h-3 ml-auto text-primary" />}
                                                    </button>
                                                    <div className="my-1 border-t border-border/40" />
                                                    {users?.map(u => {
                                                      const isSelected = assignee?.id === u.id;
                                                      return (
                                                        <button
                                                          key={u.id}
                                                          onClick={() => handleChangeAssignee(task.id, u.id)}
                                                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted/60 transition-colors text-left ${isSelected ? 'bg-muted/40' : ''}`}
                                                        >
                                                          {u.robloxAvatarUrl ? (
                                                            <img src={u.robloxAvatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                                                          ) : (
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${getAvatarClasses(u.role, u.subroles ?? [])}`}>
                                                              {u.robloxUsername.charAt(0)}
                                                            </div>
                                                          )}
                                                          <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-medium truncate">{u.robloxDisplayName || u.robloxUsername}</div>
                                                            {u.subroles?.[0] && (
                                                              <div className={`text-[9px] px-1 rounded-sm inline-block ${getSubroleClasses(u.subroles[0])}`}>{u.subroles[0]}</div>
                                                            )}
                                                          </div>
                                                          {isSelected && <Check className="w-3 h-3 flex-shrink-0 text-primary" />}
                                                        </button>
                                                      );
                                                    })}
                                                  </PopoverContent>
                                                </Popover>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </motion.div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </AnimatePresence>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {/* Add task button */}
                      <div className="p-2 border-t border-border/50">
                        <motion.button
                          whileHover={{ backgroundColor: 'hsl(var(--muted)/0.5)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openTaskDialog(column.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add task
                        </motion.button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Add column */}
              <div className="w-72 flex-shrink-0">
                <AnimatePresence mode="wait">
                  {addingCol ? (
                    <motion.div
                      key="adding"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-card border border-border rounded-lg p-3 space-y-2"
                    >
                      <Input
                        ref={newColInputRef}
                        placeholder="Column name"
                        value={newColName}
                        onChange={e => setNewColName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddColumn();
                          if (e.key === 'Escape') { setAddingCol(false); setNewColName(''); }
                        }}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleAddColumn} disabled={createCol.isPending}>Add</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingCol(false); setNewColName(''); }}>Cancel</Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="add-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ borderColor: 'hsl(var(--primary)/0.4)', color: 'hsl(var(--foreground))' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAddingCol(true)}
                      className="w-full flex items-center gap-2 py-3 px-4 rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Column
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* New Task Dialog */}
      <Dialog open={taskDialog.open} onOpenChange={(open) => setTaskDialog({ open, columnId: open ? taskDialog.columnId : null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title <span className="text-destructive">*</span></label>
              <Input placeholder="Task title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTask()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea placeholder="Optional description..." value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className="resize-none h-20 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Assigned to</label>
              <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Unassigned">
                    {taskAssigneeId ? (() => {
                      const u = users?.find(u => u.id === parseInt(taskAssigneeId, 10));
                      if (!u) return 'Unassigned';
                      return (
                        <div className="flex items-center gap-2">
                          {u.robloxAvatarUrl
                            ? <img src={u.robloxAvatarUrl} alt="" className="w-4 h-4 rounded-full" />
                            : <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${getAvatarClasses(u.role, u.subroles ?? [])}`}>{u.robloxUsername.charAt(0)}</div>
                          }
                          <span>{u.robloxDisplayName || u.robloxUsername}</span>
                        </div>
                      );
                    })() : null}
                  </SelectValue>
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
                        {u.subroles?.[0] && (
                          <span className={`text-[10px] px-1.5 py-0 rounded-full ${getSubroleClasses(u.subroles[0])}`}>{u.subroles[0]}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Priority</label>
              <Select value={taskPriority} onValueChange={(v: any) => setTaskPriority(v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="None" /></SelectTrigger>
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
    </div>
  );
}
