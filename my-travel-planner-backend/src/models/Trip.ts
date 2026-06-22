import mongoose, { Schema } from "mongoose";

export interface IActivity {
  title: string;
  description: string;
  estimatedCost: {
    min: number;
    max: number;
  };
}

export interface IItineraryDay {
  day: number;
  activities: IActivity[];
}

export interface IRange {
  min: number;
  max: number;
}

export interface IBudgetEstimate {
  flights: IRange;
  accommodation: IRange;
  food: IRange;
  activities: IRange;
  total: IRange;
}

export interface IHotelSuggestion {
  name: string;
  priceRange: string;
  reason: string;
}

export interface ITrip {
  userId: mongoose.Types.ObjectId | string;
  origin: string;
  destination: string;
  numberOfDays: number;
  budgetType: "Low" | "Medium" | "High";
  interests: string[];
  travelMode?: "Flight" | "Train" | "Bus" | "Driving";
  departureTime?: "Early Morning" | "Afternoon" | "Overnight/Night";
  currencySymbol?: string;
  currencyCode?: string;
  transitAdvisory?: string;
  itinerary: IItineraryDay[];
  budgetEstimate: IBudgetEstimate;
  hotelSuggestions: IHotelSuggestion[];
}

const ActivitySchema = new Schema<IActivity>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  estimatedCost: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  }
}, { _id: false });

const ItineraryDaySchema = new Schema<IItineraryDay>({
  day: { type: Number, required: true },
  activities: [ActivitySchema]
}, { _id: false });

const RangeSchema = new Schema<IRange>({
  min: { type: Number, required: true },
  max: { type: Number, required: true }
}, { _id: false });

const BudgetEstimateSchema = new Schema<IBudgetEstimate>({
  flights: { type: RangeSchema, required: true },
  accommodation: { type: RangeSchema, required: true },
  food: { type: RangeSchema, required: true },
  activities: { type: RangeSchema, required: true },
  total: { type: RangeSchema, required: true }
}, { _id: false });

const HotelSuggestionSchema = new Schema<IHotelSuggestion>({
  name: { type: String, required: true },
  priceRange: { type: String, required: true },
  reason: { type: String, required: true }
}, { _id: false });

const TripSchema = new Schema<ITrip>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    numberOfDays: { type: Number, required: true },
    budgetType: { type: String, enum: ["Low", "Medium", "High"], required: true },
    interests: [{ type: String }],
    travelMode: { type: String, enum: ["Flight", "Train", "Bus", "Driving"] },
    departureTime: { type: String, enum: ["Early Morning", "Afternoon", "Overnight/Night"] },
    currencySymbol: { type: String },
    currencyCode: { type: String },
    transitAdvisory: { type: String },
    itinerary: [ItineraryDaySchema],
    budgetEstimate: BudgetEstimateSchema,
    hotelSuggestions: [HotelSuggestionSchema]
  },
  { timestamps: true }
);

export const TripModel = mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);
