import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { UserController } from "./user.controller";

export const userRouter = Router();

userRouter.use(authMiddleware);
userRouter.get("/me", UserController.getMe);
userRouter.get("/me/dashboard", UserController.getDashboard);
