import { Router } from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../controllers/categories.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", getCategories);
router.post("/", createCategory);
router.delete("/:id", deleteCategory);

export default router;
