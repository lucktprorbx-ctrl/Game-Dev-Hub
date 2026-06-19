import { useState } from 'react';
import { useListBoards, useGetBoard, useUpdateTask } from '@workspace/api-client-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { getGetBoardQueryKey } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';

export function KanbanBoard() {
  const { data: boards, isLoading: boardsLoading } = useListBoards();
  const selectedBoardId = boards?.[0]?.id;
  const { data: board, isLoading: boardLoading } = useGetBoard(selectedBoardId!, {
    query: { enabled: !!selectedBoardId }
  });
  
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return;

    const sourceColId = parseInt(result.source.droppableId, 10);
    const destColId = parseInt(result.destination.droppableId, 10);
    const taskId = parseInt(result.draggableId, 10);

    // Optimistic update logic could go here, but for simplicity we'll just invalidate after mutation
    await updateTask.mutateAsync({
      id: taskId,
      data: {
        columnId: destColId,
        position: result.destination.index
      }
    });

    queryClient.invalidateQueries({ queryKey: getGetBoardQueryKey(board.id) });
  };

  if (boardsLoading || boardLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-80 flex-shrink-0 bg-muted/20 rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!board) {
    return <div className="text-center p-8 text-muted-foreground">No boards available.</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 items-start h-[calc(100vh-200px)]">
        {board.columns.map((column) => (
          <div key={column.id} className="w-80 flex-shrink-0 bg-card border border-border rounded-lg flex flex-col max-h-full">
            <div className="p-3 border-b border-border flex items-center justify-between font-medium">
              <span>{column.name}</span>
              <Badge variant="secondary">{column.tasks.length}</Badge>
            </div>
            
            <Droppable droppableId={column.id.toString()}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]"
                >
                  {column.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`cursor-grab active:cursor-grabbing ${
                            snapshot.isDragging ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''
                          }`}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm leading-tight">{task.title}</span>
                            </div>
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap mb-3">
                                {task.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0 h-4">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>
                                {task.priority && (
                                  <Badge variant={
                                    task.priority === 'high' ? 'destructive' : 
                                    task.priority === 'medium' ? 'default' : 'secondary'
                                  } className="text-[10px] px-1 py-0 h-4 uppercase">
                                    {task.priority}
                                  </Badge>
                                )}
                              </span>
                              {task.assigneeUsername && (
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                    {task.assigneeUsername.charAt(0).toUpperCase()}
                                  </div>
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
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
