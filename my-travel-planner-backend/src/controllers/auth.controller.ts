import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: "Please provide name, email, and password" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
        return;
      }

      const result = await AuthService.register(name, email, password);
      res.status(201).json({
        success: true,
        message: "Registration successful",
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || "Registration failed" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: "Please provide email and password" });
        return;
      }

      const result = await AuthService.login(email, password);
      res.status(200).json({
        success: true,
        message: "Login successful",
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || "Login failed" });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }
}
