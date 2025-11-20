import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import Task from "../models/task.model.js";

// 1. Get All Tasks
export const getTasks = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const tasks = await Task.find({ user: req.user?.userId })
        .sort({ position: 1, createdAt: -1 }); // get tasks sorted by position ascending, then createdAt descending
        
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error });
  }
};

// 2. Create Task
export const createTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { title, dueDate } = req.body;
    
    const newTask = new Task({
      title,
      dueDate: dueDate || new Date(), // If no date is provided, use the current date
      position: new Date().getTime(), // Use the current time as the default position
      user: req.user?.userId,
    });

    await newTask.save();
    return res.status(201).json(newTask);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error });
  }
};

// 3. Update Task
export const updateTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: req.user?.userId },
      req.body,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error });
  }
};

// 4. Delete Task
export const deleteTask = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const deletedTask = await Task.findOneAndDelete({ _id: id, user: req.user?.userId });
    
        if (!deletedTask) {
          return res.status(404).json({ message: "Task not found" });
        }
    
        return res.json({ message: "Task deleted successfully" });
      } catch (error) {
        return res.status(500).json({ message: "Server Error", error });
      }
};