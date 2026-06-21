---
name: Teams system architecture
description: How teams scope board/event visibility in RoVerse Dashboard
---

## Rule
- `board.teamId = null` → visible to ALL users (public board)
- `board.teamId = X` → visible only to admins + members of team X
- `event.teamId = null` → visible to all
- `event.teamId = X` → visible only to admins + team X members
- Calendar events also team-scoped (added in same migration)

## DB
- `teamsTable` + `teamMembersTable` in `lib/db/src/schema/teams.ts`
- Both `boardsTable` and `calendarEventsTable` have nullable `teamId` FK

## API
- Teams CRUD in `artifacts/api-server/src/routes/teams.ts` (all under `/planning/teams/...`)
- Filtering in `artifacts/api-server/src/routes/planning.ts` using `isNull` + `inArray(boardsTable.teamId, userTeamIds)`
- Admin: sees all; Collaborator: sees null + their teams

## Frontend
- Planning page: shows team badge on board cards (lock icon for team-scoped, globe for public); team selector in create board dialog (admin only, shows when teams exist)
- Users page: added "Teams" tab (admin only) with `TeamsManagement` component — create/delete teams, add/remove members inline

**Why:** User explicitly requested team-based board visibility so collaborators only see boards relevant to their team.
