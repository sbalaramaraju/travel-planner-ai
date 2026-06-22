export interface Activity {
  title: string;
  description: string;
  estimatedCost: {
    min: number;
    max: number;
  };
}

export interface ItineraryDay {
  day: number;
  activities: Activity[];
}

export interface Range {
  min: number;
  max: number;
}

export interface BudgetEstimate {
  flights: Range;
  accommodation: Range;
  food: Range;
  activities: Range;
  total: Range;
}

export interface HotelSuggestion {
  name: string;
  priceRange: string;
  reason: string;
}

export interface Trip {
  _id: string;
  userId: string;
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
  itinerary: ItineraryDay[];
  budgetEstimate: BudgetEstimate;
  hotelSuggestions: HotelSuggestion[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
}
