import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): any => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  try {
    // decoding token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid Token" });
  }
};