import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import gamesRouter from "./games";
import usersRouter from "./users";
import planningRouter from "./planning";
import groupsRouter from "./groups";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(gamesRouter);
router.use(usersRouter);
router.use(planningRouter);
router.use(groupsRouter);

export default router;
