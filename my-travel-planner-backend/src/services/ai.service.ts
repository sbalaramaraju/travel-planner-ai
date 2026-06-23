import { GoogleGenAI, Type } from "@google/genai";

// Lazy-initialize Gemini client to prevent crash on startup if GEMINI_API_KEY is not set yet
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export interface GenerationInput {
  origin: string;
  destination: string;
  days: number;
  budgetType: "Low" | "Medium" | "High";
  interests: string[];
  travelMode: "Flight" | "Train" | "Bus" | "Driving";
  departureTime: "Early Morning" | "Afternoon" | "Overnight/Night";
}

export class AIService {
  /**
   * Generates a complete travel plan (itinerary, budget, and hotels) in a single request.
   */
  static async generateTravelPlan(input: GenerationInput) {
    const ai = getAiClient();
    const prompt = `
      Create a highly personalized, realistic travel plan considering these specifics:
      - Origin: ${input.origin}
      - Destination: ${input.destination}
      - Number of Days: ${input.days} days
      - Budget Category: ${input.budgetType}
      - Interests: ${input.interests.join(", ")}
      - Primary Mode of Travel Chosen by User: ${input.travelMode}
      - Preferred Departure / Travel Start Style: ${input.departureTime}

      Perform the following tasks:
      1. Determine the relevant local currency based on the Origin place, or Destination if origin is not helpful to determine a currency:
         - For example, if traveling within or starting from India, the currency MUST be INR and symbol MUST be ₹.
         - If traveling within or starting from Europe, the currency MUST be EUR and symbol MUST be €.
         - If traveling within or starting from UK, the currency MUST be GBP and symbol MUST be £.
         - If traveling within or starting from USA, the currency MUST be USD and symbol MUST be $.
         - All cost numbers (activities, budgetEstimate, hotelSuggestions) in your entire response MUST be realistic values in this determined currency.
         - Do NOT mix up currencies or generate USD-sized numbers labeled with INR, or INR-sized numbers labeled with USD.
         - For example: An overnight train ticket in India is roughly 500 to 2000 INR (NOT 500 to 2000 USD!). A local sightseeing activity or simple meal in India is roughly 200 to 1200 INR. If the currency is INR, do NOT generate numbers like 20,000 INR for activities unless it is extremely luxurious. Keep the scale of the currency values highly realistic! Leverage your search grounding to research real transit rates, hotel night rates, and sightseeing prices.
      2. Draw up a Day-by-Day itinerary that starts from Day 1 and intelligently factors in transit/travel time, travel speed, and departure timings:
         - Incorporate travel directly! Do not assume the traveler magically arrives on Day 1 morning without any travel time.
         - For ${input.travelMode}: Compute realistic transit duration between ${input.origin} and ${input.destination}.
         - Intelligently align Activities count and timings on Day 1 (and the last day if returning) based on Departure style '${input.departureTime}':
           * If "Early Morning": traveler departs early morning, arrives around afternoon, leaving only subsequent afternoon/evening (half-day) for activities. State that the first half of Day 1 is spent traveling.
           * If "Afternoon": they travel in the day, arriving by evening. Day 1 itinerary should focus solely on the travel journey, hotel check-in, and dinner.
           * If "Overnight/Night": they travel overnight (sleeper train, red-eye flight, night driving). This means Day 1 is spent preparing, commuting, and boarding the overnight transit. They arrive in the destination on the morning of Day 2! Under this, Day 1 contains travel prep/transit boarding, and Day 2 begins with arrival and has a full-day itinerary.
         - Mention travel in the itinerary itself so the flow makes complete logical, real sense.
      3. Evaluate the chosen travel mode (${input.travelMode}) between '${input.origin}' and '${input.destination}'. If it is geographically or physically impossible or highly unrealistic (e.g. Train/Bus/Driving across oceans or long intercontinental distances, like Hyderabad to Singapore, or US to Europe), write a clear, helpful and advisory 'transitAdvisory' explaining this mismatch. Explain that while the exact selected mode is geographically impossible, you have adapted the route or combined options (such as Train/Bus to a main hub + Flight, or solely a realistic Flight transit) to best mirror their preferred choice. If the chosen mode is fully realistic, provide a brief positive confirmation of the transit feasibility.
      4. Recommend 3 great hotels in '${input.destination}' that match a '${input.budgetType}' budget type, including a realistic price range per night in the local currency and reason for selection.

      Crucial requirements:
      - The itinerary and budget must be internally consistent.
      - Estimate highly realistic, truthful numbers in the identified local currency and use its symbol. Do NOT assume prices – research real costs using search grounding.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        currencyCode: { type: Type.STRING, description: "3-letter ISO code of the identified local currency (e.g. INR, EUR, USD, GBP, JPY)" },
        currencySymbol: { type: Type.STRING, description: "Unicode currency symbol of the identified local currency (e.g. ₹, €, $, £, ¥)" },
        transitAdvisory: { type: Type.STRING, description: "Friendly advisory message if the user's travelMode choice is physically/geographically impossible between origin and destination, detailing the alternative/adjusted multi-modal route. If realistic, a positive confirmation." },
        itinerary: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER, description: "The sequential day number" },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Name of the activity (e.g., Travel journey, Museum visit)" },
                    description: { type: Type.STRING, description: "Highly engaging overview of what to do, factoring transport schedules and timing logistics" },
                    estimatedCost: {
                      type: Type.OBJECT,
                      properties: {
                        min: { type: Type.NUMBER, description: "Minimum cost range in identified local currency" },
                        max: { type: Type.NUMBER, description: "Maximum cost range in identified local currency" },
                      },
                      required: ["min", "max"],
                    },
                  },
                  required: ["title", "description", "estimatedCost"],
                },
              },
            },
            required: ["day", "activities"],
          },
        },
        budgetEstimate: {
          type: Type.OBJECT,
          properties: {
            flights: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.NUMBER, description: "Transport/transit cost min in identified local currency" },
                max: { type: Type.NUMBER, description: "Transport/transit cost max in identified local currency" },
              },
              required: ["min", "max"],
            },
            accommodation: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER },
              },
              required: ["min", "max"],
            },
            food: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER },
              },
              required: ["min", "max"],
            },
          },
          required: ["flights", "accommodation", "food"],
        },
        hotelSuggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The name of the hotel" },
              priceRange: { type: Type.STRING, description: "Price range per night in identified currency, e.g., '€100-€150/night' or '₹5000-₹8000/night'" },
              reason: { type: Type.STRING, description: "Compelling reason for recommending this hotel" },
            },
            required: ["name", "priceRange", "reason"],
          },
        },
      },
      required: ["currencyCode", "currencySymbol", "transitAdvisory", "itinerary", "budgetEstimate", "hotelSuggestions"],
    };

    try {
      let text = "";
      try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional world-travel consultant. Use Google Search grounding to perform research on actual transit paths, fares, hotel rates, and sightseeing prices to build hyper-accurate and realistic estimates. Generate precise JSON that matches the required responseSchema perfectly.",
          responseMimeType: "application/json",
          responseSchema,
          tools: [{ googleSearch: {} }],
        },
      });
      text = response.text || "";
    } catch (groundingError: any) {
      const errMsg = groundingError?.message || String(groundingError);
      console.warn("Google Search Grounding experienced an error or quota limit. Falling back to standard generation for reliability:", errMsg);
      
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional world-travel consultant. Rely on your vast knowledge base to build highly accurate, realistic, and consistent estimates. Generate precise JSON that matches the required responseSchema perfectly.",
          responseMimeType: "application/json",
          responseSchema,
        },
      });
      text = fallbackResponse.text || "";
    }

    if (!text) {
      throw new Error("Empty response received from travel planner AI");
    }

    const generatedData = JSON.parse(text);

      // Perform deterministic calculation of Activities budget and Total budget
      // This enforces rigorous consistency and accuracy as demanded by our guidance.
      const calculatedActivitiesMin = generatedData.itinerary.reduce((sumDay: number, day: any) => {
        return sumDay + (day.activities?.reduce((sumAct: number, act: any) => sumAct + (act.estimatedCost?.min || 0), 0) || 0);
      }, 0);

      const calculatedActivitiesMax = generatedData.itinerary.reduce((sumDay: number, day: any) => {
        return sumDay + (day.activities?.reduce((sumAct: number, act: any) => sumAct + (act.estimatedCost?.max || 0), 0) || 0);
      }, 0);

      const updatedBudget = {
        flights: generatedData.budgetEstimate.flights,
        accommodation: generatedData.budgetEstimate.accommodation,
        food: generatedData.budgetEstimate.food,
        activities: {
          min: calculatedActivitiesMin,
          max: calculatedActivitiesMax,
        },
        total: {
          min: (generatedData.budgetEstimate.flights?.min || 0) +
               (generatedData.budgetEstimate.accommodation?.min || 0) +
               (generatedData.budgetEstimate.food?.min || 0) +
               calculatedActivitiesMin,
          max: (generatedData.budgetEstimate.flights?.max || 0) +
               (generatedData.budgetEstimate.accommodation?.max || 0) +
               (generatedData.budgetEstimate.food?.max || 0) +
               calculatedActivitiesMax,
        },
      };

      return {
        currencyCode: generatedData.currencyCode,
        currencySymbol: generatedData.currencySymbol,
        transitAdvisory: generatedData.transitAdvisory || "",
        itinerary: generatedData.itinerary,
        budgetEstimate: updatedBudget,
        hotelSuggestions: generatedData.hotelSuggestions,
      };
    } catch (err: any) {
      console.error("AI Generation Error: ", err);
      throw new Error(`Failed to generate travel plan: ${err.message || err}`);
    }
  }

  /**
   * Refines/modifies an existing itinerary based on natural language feedback.
   */
  static async modifyItinerary(existingTrip: any, modificationRequest: string) {
    const ai = getAiClient();
    const prompt = `
      You are an elite travel assistant. Refine or modify the following existing travel itinerary.
      
      Trip Details:
      - Origin: ${existingTrip.origin}
      - Destination: ${existingTrip.destination}
      - Total Days: ${existingTrip.numberOfDays} days
      - Budget Category: ${existingTrip.budgetType}
      - Core Interests: ${existingTrip.interests?.join(", ") || ""}
      - Primary Mode of Travel: ${existingTrip.travelMode || "Flight"}
      - Preferred Travel Start Style: ${existingTrip.departureTime || "Early Morning"}
      - Current Base Currency: ${existingTrip.currencyCode || "USD"} (${existingTrip.currencySymbol || "$"})

      Existing Itinerary:
      ${JSON.stringify(existingTrip.itinerary, null, 2)}

      Existing Budget Estimate:
      ${JSON.stringify(existingTrip.budgetEstimate, null, 2)}

      Modification Request:
      "${modificationRequest}"

      Apply the request. If the user wants to add/remove/change activities for a specific day or across all days, output the full itinerary with those modifications incorporated. Ensure that each changed activity retains or includes a realistic min and max cost in the original trip's currency (${existingTrip.currencyCode || "USD"}) under estimatedCost.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        itinerary: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER, description: "The sequential day number" },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    estimatedCost: {
                      type: Type.OBJECT,
                      properties: {
                        min: { type: Type.NUMBER, description: `Minimum cost in identified currency: ${existingTrip.currencyCode || "USD"}` },
                        max: { type: Type.NUMBER, description: `Maximum cost in identified currency: ${existingTrip.currencyCode || "USD"}` },
                      },
                      required: ["min", "max"],
                    },
                  },
                  required: ["title", "description", "estimatedCost"],
                },
              },
            },
            required: ["day", "activities"],
          },
        },
      },
      required: ["itinerary"],
    };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert itinerary editor. Modify the itinerary according to user prompt and return the entire updated itinerary in JSON format matching the schema.",
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response received from itinerary editing AI");
      }

      const generatedData = JSON.parse(text);

      // Deterministically recalculate activity budget & totals for strict financial consistency
      const calculatedActivitiesMin = generatedData.itinerary.reduce((sumDay: number, day: any) => {
        return sumDay + (day.activities?.reduce((sumAct: number, act: any) => sumAct + (act.estimatedCost?.min || 0), 0) || 0);
      }, 0);

      const calculatedActivitiesMax = generatedData.itinerary.reduce((sumDay: number, day: any) => {
        return sumDay + (day.activities?.reduce((sumAct: number, act: any) => sumAct + (act.estimatedCost?.max || 0), 0) || 0);
      }, 0);

      const oldBudget = existingTrip.budgetEstimate;
      const updatedBudget = {
        ...oldBudget,
        activities: {
          min: calculatedActivitiesMin,
          max: calculatedActivitiesMax,
        },
        total: {
          min: (oldBudget.flights?.min || 0) +
               (oldBudget.accommodation?.min || 0) +
               (oldBudget.food?.min || 0) +
               calculatedActivitiesMin,
          max: (oldBudget.flights?.max || 0) +
               (oldBudget.accommodation?.max || 0) +
               (oldBudget.food?.max || 0) +
               calculatedActivitiesMax,
        },
      };

      return {
        itinerary: generatedData.itinerary,
        budgetEstimate: updatedBudget,
      };
    } catch (err: any) {
      console.error("AI Modification Error: ", err);
      throw new Error(`Failed to modify itinerary: ${err.message || err}`);
    }
  }

  /**
   * Generates a personalized packing list based on the trip's metadata and daily itinerary.
   */
  static async generatePackingList(trip: any) {
    const ai = getAiClient();
    const prompt = `
      You are an expert travel coordinator. Generate a highly personalized, smart, and minimal packing checklist of must-have items for the following trip:

      Trip Details:
      - Origin: ${trip.origin}
      - Destination: ${trip.destination}
      - Travel Mode Chosen: ${trip.travelMode} (e.g., Flight, Train, Bus, Driving)
      - Number of Days: ${trip.numberOfDays} days
      - Selected Interests: ${trip.interests?.join(", ") || ""}
      - Itinerary Details:
      ${JSON.stringify(trip.itinerary, null, 2)}

      Strict and Critical prompt refinement rules:
      1. Keep the list clean, minimal, and premium. Avoid generic items that clutter the list (do NOT suggest individual clothes details like general "fresh underwear", "socks", "shirts", "pants" individually; these are standard boilerplate details).
      2. Group clothing into ONE general, single item, such as: "Comfortable travel-friendly clothes (for ${trip.numberOfDays} days)". Keep it as a simple single line. DO NOT make individual checkboxes for general/standard clothing.
      3. ONLY include swimwear/beachwear if water sports, beach activities, swimming pools, coastline/river/water parks, snorkeling, rafting, or cruises are explicitly or strongly implied/stated in the interests or itinerary. If NOT present, do NOT include swimwear!
      4. DO NOT suggest international flight items like "Passport", "Visa documents", "Forex cards", or "Universal power adapter" if the travel mode is "Train", "Bus" or "Driving", or if the travel is clearly domestic (e.g. Origin and Destination are in the same country like within India, USA, etc.). ONLY suggest a "Passport" and "Visa papers" if this is an actual international flight!
      5. Under "Transit & Gear", adapt strictly to the travel mode:
         - If Transit is Train: Suggest items like "ID proof (Required for verification)", "Train ticket booking", "Travel tissues/hand sanitizer", "Personal lightweight bedsheet/blanket" (for long/overnight journeys). No passport or boarding pass!
         - If Transit is Flight: Suggest "Flight e-Ticket / Boarding Passes", "TSA flight liquids pouch (< 100ml)", "Noise-cancelling headphones".
         - If Transit is Driving: Suggest "Driver's license & vehicle docs", "Car mobile phone dashboard mount", "Pre-downloaded offline Google GPS maps".
         - If Transit is Bus: Suggest "Bus e-Ticket/booking receipt", "Sanitizing wipes", "Motion sickness pills" if needed.
         - For all modes, only suggest tickets, ID verification proof, and mode-specific convenience items.
      6. Adapt apparel strictly to weather, activities, and sacred places:
         - Culturally mind religious/spiritual sites or temples: If there is a temple, darshan, shrine, mosque, church, or sacred site anywhere in the itinerary, include an item: "Conservative traditional wear (modest ethnic apparel covering shoulders and knees)" and "Easy slip-on footwear (sacred places require footwear removal)".
         - Heavy hiking or adventure interests: If "Adventure" interest is chosen or trail hiking/trekking activities exist, recommend "Waterproof hiking daypack", "Insect/mosquito repellent", and "Sturdy hiking/trail shoes".
         - Cold or wet environments matches: If snowy or icy locations or keywords like freezing, cold, winter exist, suggest "Insulated warm down jacket / coat" and "Thermal innerwear set". If rain or monsoon keywords are found, recommend "Travel compact umbrella or light rain poncho".
      7. For each item, provide a very concise, human-oriented 'reason' (max 6 words) explaining exactly which interest, location, transportation mode, weather trigger, or itinerary activity warranted its suggestion (e.g., "Temple visits on itinerary", "Water sports listed", "Train transit mode", "Rain predicted", "${trip.numberOfDays} days duration"). It must feel highly intelligent and personalized!
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "Compact description of the item" },
              category: { 
                type: Type.STRING, 
                enum: ["Essentials", "Clothing", "Electronics", "Transit & Gear", "Interests Pack", "Other"],
                description: "The packing segment category" 
              },
              reason: { type: Type.STRING, description: "Precisely why this item is recommended (concise, max 6 words)" }
            },
            required: ["text", "category", "reason"]
          }
        }
      },
      required: ["items"]
    };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a smart packing assistant. Analyze itinerary activities, transportation modes, temperatures/weather, and spiritual constraints to formulate a highly tailored packing list.",
          responseMimeType: "application/json",
          responseSchema,
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response received from AI packing assistant");
      }
      return JSON.parse(text);
    } catch (err: any) {
      console.error("AI Packing List Generation Error: ", err);
      throw new Error(`Failed to generate packing list: ${err.message || err}`);
    }
  }
}
