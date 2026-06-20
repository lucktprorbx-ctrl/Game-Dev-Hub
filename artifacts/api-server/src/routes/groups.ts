import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

interface RobloxGroupResponse {
  id: number;
  name: string;
  description?: string;
  memberCount: number;
}

interface RobloxGamesListItem {
  id: number; // universeId
  rootPlaceId: number | null;
  name: string;
  description: string | null;
  creator: { name: string };
}

interface RobloxGameStats {
  id: number; // universeId
  playing: number;
  visits: number;
  favoritedCount: number;
  isAllGenre: boolean;
  isPrivateServer?: boolean;
}

router.get("/groups/:groupId", requireAuth, async (req, res): Promise<void> => {
  const { groupId } = req.params;

  try {
    // Fetch group info
    const groupRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}`);
    if (!groupRes.ok) {
      res.status(404).json({ error: "Group not found" });
      return;
    }
    const groupData = await groupRes.json() as RobloxGroupResponse;

    // Fetch games for the group
    const gamesListRes = await fetch(
      `https://games.roblox.com/v1/games/list?groupId=${groupId}&limit=50&sortToken=&model.sortOrder=2`
    );

    let games: Array<{
      universeId: number;
      rootPlaceId: number | null;
      name: string;
      description: string | null;
      playing: number;
      visits: number;
      favoritedCount: number;
      isPrivate: boolean;
      thumbnailUrl: string | null;
    }> = [];

    if (gamesListRes.ok) {
      const gamesListData = await gamesListRes.json() as { games?: RobloxGamesListItem[] };
      const gamesList = gamesListData.games ?? [];

      if (gamesList.length > 0) {
        const universeIds = gamesList.map(g => g.id).join(",");

        // Fetch stats for all games at once
        const statsRes = await fetch(
          `https://games.roblox.com/v1/games?universeIds=${universeIds}`
        );

        // Fetch thumbnails
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}&size=150x150&format=Png`
        );

        const statsMap = new Map<number, RobloxGameStats>();
        if (statsRes.ok) {
          const statsData = await statsRes.json() as { data?: RobloxGameStats[] };
          (statsData.data ?? []).forEach(s => statsMap.set(s.id, s));
        }

        const thumbMap = new Map<number, string>();
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json() as { data?: Array<{ targetId: number; imageUrl: string }> };
          (thumbData.data ?? []).forEach(t => thumbMap.set(t.targetId, t.imageUrl));
        }

        games = gamesList.map(game => {
          const stats = statsMap.get(game.id);
          return {
            universeId: game.id,
            rootPlaceId: game.rootPlaceId,
            name: game.name,
            description: game.description,
            playing: stats?.playing ?? 0,
            visits: stats?.visits ?? 0,
            favoritedCount: stats?.favoritedCount ?? 0,
            isPrivate: !stats, // if no stats returned, it's likely private
            thumbnailUrl: thumbMap.get(game.id) ?? null,
          };
        });
      }
    }

    // Fetch group thumbnail
    let thumbnailUrl: string | null = null;
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=150x150&format=Png`
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json() as { data?: Array<{ imageUrl?: string }> };
        thumbnailUrl = thumbData.data?.[0]?.imageUrl ?? null;
      }
    } catch { /* ignore */ }

    res.json({
      id: groupData.id,
      name: groupData.name,
      description: groupData.description ?? null,
      memberCount: groupData.memberCount,
      thumbnailUrl,
      games,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch group info");
    res.status(500).json({ error: "Failed to fetch group info" });
  }
});

export default router;
