import { useMemo, useCallback } from 'react';
import { useListUsers, useListBoards, getListUsersQueryKey, getListBoardsQueryKey } from '@workspace/api-client-react';

const STORAGE_KEY = 'rocheck_notifications_last_read';

export type NotificationItem = {
  id: string;
  type: 'new_member' | 'new_board';
  message: string;
  detail: string;
  avatarUrl?: string | null;
  timestamp: Date;
};

function getLastRead(): Date {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return new Date(raw);
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

export function useNotifications() {
  const { data: users } = useListUsers({ query: { queryKey: getListUsersQueryKey(), refetchInterval: 60_000 } });
  const { data: boards } = useListBoards({ query: { queryKey: getListBoardsQueryKey(), refetchInterval: 60_000 } });

  const notifications = useMemo<NotificationItem[]>(() => {
    const lastRead = getLastRead();
    const items: NotificationItem[] = [];

    const usersArray = Array.isArray(users) ? users : [];
    usersArray.forEach(u => {
      const ts = new Date((u as any).createdAt);
      if (!isNaN(ts.getTime()) && ts > lastRead) {
        items.push({
          id: `member-${u.id}`,
          type: 'new_member',
          message: `${u.robloxDisplayName || u.robloxUsername} joined`,
          detail: u.role === 'admin' ? 'Admin' : 'Collaborator',
          avatarUrl: u.robloxAvatarUrl,
          timestamp: ts,
        });
      }
    });

    const boardsArray = Array.isArray(boards) ? boards : [];
    boardsArray.forEach(b => {
      const ts = new Date(b.createdAt);
      if (!isNaN(ts.getTime()) && ts > lastRead) {
        items.push({
          id: `board-${b.id}`,
          type: 'new_board',
          message: `Board "${b.name}" created`,
          detail: 'Planning',
          timestamp: ts,
        });
      }
    });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [users, boards]);

  const unreadCount = notifications.length;

  const markAllRead = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    window.dispatchEvent(new Event('rocheck:notifications:read'));
  }, []);

  return { notifications, unreadCount, markAllRead };
}
