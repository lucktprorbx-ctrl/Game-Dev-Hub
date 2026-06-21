import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import gamesRouter from "./games";
import usersRouter from "./users";
import planningRouter from "./planning";
import groupsRouter from "./groups";
import teamsRouter from "./teams";
import userGroupsRouter from "./user-groups";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(gamesRouter);
router.use(usersRouter);
router.use(planningRouter);
router.use(groupsRouter);
router.use(teamsRouter);
router.use(userGroupsRouter);

export default router;
