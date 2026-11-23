import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  createChildAccount,
  getChildren,
  getChildOverview,
  updateChildAccount,
  deleteChildAccount,
} from "../controllers/parental.controller";

const router = Router();

router.use(authMiddleware);

router.get("/children", getChildren);
router.post("/children", createChildAccount);
router.get("/children/:childId/overview", getChildOverview);
router.put("/children/:childId", updateChildAccount);
router.delete("/children/:childId", deleteChildAccount);

export default router;
