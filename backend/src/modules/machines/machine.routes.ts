import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { MachineController } from "./machine.controller";

export const machineRouter = Router();

machineRouter.get("/plans", MachineController.getPlans);

machineRouter.use(authMiddleware);
machineRouter.get("/my", MachineController.getMyMachines);
machineRouter.post("/free/claim", MachineController.claimFreeMachine);
