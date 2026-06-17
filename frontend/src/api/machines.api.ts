import { apiRequest } from "@/api/client";
import type { MachinePlanDTO, UserMachineDTO } from "@/api/types";

export const machinesApi = {
  plans() {
    return apiRequest<MachinePlanDTO[]>("/machines/plans");
  },
  myMachines() {
    return apiRequest<UserMachineDTO[]>("/machines/my");
  },
  claimFreeMachine() {
    return apiRequest<{ message: string; machine: UserMachineDTO }>("/machines/free/claim", {
      method: "POST"
    });
  }
};
