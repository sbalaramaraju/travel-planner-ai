import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "travel_planner_super_secret_key_123";

export class AuthService {
  static async register(name: string, email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();
    
    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create Mongoose document
    const newUser = await UserModel.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
    });

    const token = jwt.sign({ userId: newUser._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

    return {
      user: {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
      },
      token,
    };
  }

  static async login(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      token,
    };
  }
}
