import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/task.controller.js";

const router = Router();

router.use(verifyToken);

router.get("/", getTasks);          // GET /api/tasks
router.post("/", createTask);       // POST /api/tasks
router.put("/:id", updateTask);     // PUT /api/tasks/:id
router.delete("/:id", deleteTask);  // DELETE /api/tasks/:id

export default router;