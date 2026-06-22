import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { TripModel } from "../models/Trip.js";
import { AIService } from "../services/ai.service.js";

export class TripController {
  static async generate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { origin, destination, days, budgetType, interests, travelMode, departureTime } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }

      if (!origin || !destination || !days || !budgetType || !interests) {
        res.status(400).json({ success: false, message: "Missing required inputs for generation" });
        return;
      }

      const numDays = Number(days);
      if (isNaN(numDays) || numDays <= 0 || numDays > 30) {
        res.status(400).json({ success: false, message: "Days must be a positive number up to 30" });
        return;
      }

      const validBudgetTypes = ["Low", "Medium", "High"];
      if (!validBudgetTypes.includes(budgetType)) {
        res.status(400).json({ success: false, message: "Invalid budget type selected" });
        return;
      }

      if (!Array.isArray(interests) || interests.length === 0) {
        res.status(400).json({ success: false, message: "At least one interest must be selected" });
        return;
      }

      const aiResponse = await AIService.generateTravelPlan({
        origin,
        destination,
        days: numDays,
        budgetType: budgetType as "Low" | "Medium" | "High",
        interests,
        travelMode: travelMode || "Flight",
        departureTime: departureTime || "Early Morning",
      });

      const newTrip = {
        userId,
        origin: origin.trim(),
        destination: destination.trim(),
        numberOfDays: numDays,
        budgetType: budgetType as "Low" | "Medium" | "High",
        interests,
        travelMode: travelMode || "Flight",
        departureTime: departureTime || "Early Morning",
        currencySymbol: aiResponse.currencySymbol || "$",
        currencyCode: aiResponse.currencyCode || "USD",
        transitAdvisory: aiResponse.transitAdvisory || "",
        itinerary: aiResponse.itinerary,
        budgetEstimate: aiResponse.budgetEstimate,
        hotelSuggestions: aiResponse.hotelSuggestions,
      };

      const savedTrip = await TripModel.create(newTrip);

      res.status(201).json({
        success: true,
        message: "Travel plan generated and saved successfully",
        trip: savedTrip,
      });
    } catch (err: any) {
      console.error("Generate Route Error:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to generate travel plan" });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const trips = await TripModel.find({ userId }).sort({ createdAt: -1 });

      res.status(200).json({ success: true, trips });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Failed to retrieve trips" });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const trip = await TripModel.findOne({ _id: id, userId });
      if (!trip) {
        res.status(404).json({ success: false, message: "Trip not found or unauthorized" });
        return;
      }

      res.status(200).json({ success: true, trip });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Failed to retrieve trip" });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { _id, userId: _, createdAt, ...validUpdates } = updateData;

      const updated = await TripModel.findOneAndUpdate(
        { _id: id, userId },
        { $set: validUpdates },
        { new: true }
      );

      if (!updated) {
        res.status(404).json({ success: false, message: "Trip not found or unauthorized to update" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Trip updated successfully",
        trip: updated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Failed to update trip" });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const deleted = await TripModel.findOneAndDelete({ _id: id, userId });
      if (!deleted) {
        res.status(404).json({ success: false, message: "Trip not found or unauthorized to delete" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Trip deleted successfully",
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Failed to delete trip" });
    }
  }

  static async modify(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { modificationRequest } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!modificationRequest || typeof modificationRequest !== "string" || !modificationRequest.trim()) {
        res.status(400).json({ success: false, message: "Please enter a modification request" });
        return;
      }

      const existingTrip = await TripModel.findOne({ _id: id, userId });
      if (!existingTrip) {
        res.status(404).json({ success: false, message: "Trip not found or unauthorized" });
        return;
      }

      const aiResponse = await AIService.modifyItinerary(existingTrip, modificationRequest.trim());

      const updatedTrip = await TripModel.findOneAndUpdate(
        { _id: id, userId },
        {
          $set: {
            itinerary: aiResponse.itinerary,
            budgetEstimate: aiResponse.budgetEstimate,
          }
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Itinerary updated through AI assistant",
        trip: updatedTrip,
      });
    } catch (err: any) {
      console.error("Modify Route Error:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to modify itinerary" });
    }
  }

  static async getPackingList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const existingTrip = await TripModel.findOne({ _id: id, userId });
      if (!existingTrip) {
        res.status(404).json({ success: false, message: "Trip not found or unauthorized" });
        return;
      }

      const aiResponse = await AIService.generatePackingList(existingTrip);

      res.status(200).json({
        success: true,
        items: aiResponse.items,
      });
    } catch (err: any) {
      console.error("Get Packing List Route Error:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to generate packing list" });
    }
  }
}
