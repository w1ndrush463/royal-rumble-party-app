import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/edge-functions";

interface RumbleMatch {
  status: "not_started" | "in_progress" | "completed";
  assignments: Record<string, string>;
  entrants: Record<string, string>;
  eliminations: string[];
  eliminationDetails: Array<{
    wrestlerId: string;
    eliminatedBy: string | null;
    entryNumber: number;
    timeInRing?: string;
    eliminationOrder: number;
  }>;
  winner: string | null;
  currentEntryNumber: number;
  matchStartTime: string | null;
  entryTimestamps: Record<string, string>;
}

interface MatchState {
  users: Array<{ id: string; name: string; avatar: string }>;
  mensRumble: RumbleMatch;
  womensRumble: RumbleMatch;
  predictions: Record<string, unknown>;
  lastUpdated: string | null;
}

interface ClaimPayload {
  rumbleType: "mens" | "womens";
  userId: string;
  numbers: number[];
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default async function handler(req: Request, _context: Context) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payload: ClaimPayload = await req.json();
    const { rumbleType, userId, numbers } = payload;

    // Validate rumbleType
    if (rumbleType !== "mens" && rumbleType !== "womens") {
      return jsonResponse({ error: "Invalid rumbleType" }, 400);
    }

    // Validate userId
    if (!userId || typeof userId !== "string") {
      return jsonResponse({ error: "Invalid userId" }, 400);
    }

    // Validate numbers array
    if (!Array.isArray(numbers) || numbers.length !== 2) {
      return jsonResponse({ error: "Must select exactly 2 numbers" }, 400);
    }

    if (numbers.some(n => typeof n !== "number" || n < 1 || n > 30 || !Number.isInteger(n))) {
      return jsonResponse({ error: "Numbers must be integers between 1 and 30" }, 400);
    }

    if (numbers[0] === numbers[1]) {
      return jsonResponse({ error: "Must select 2 different numbers" }, 400);
    }

    const store = getStore("rumble-state");
    let state = (await store.get("match-state", { type: "json" })) as MatchState | null;
    let version = parseInt((await store.get("state-version")) || "0");

    if (!state) {
      return jsonResponse({ error: "Match state not initialized" }, 500);
    }

    // Validate user exists
    if (!state.users.some(u => u.id === userId)) {
      return jsonResponse({ error: "User not found" }, 400);
    }

    const rumbleKey = rumbleType === "mens" ? "mensRumble" : "womensRumble";
    const rumble = state[rumbleKey];

    // Check if user already has numbers claimed
    const existingNumbers = Object.entries(rumble.assignments)
      .filter(([, uid]) => uid === userId)
      .map(([num]) => parseInt(num));

    if (existingNumbers.length > 0) {
      return jsonResponse({
        error: "You have already claimed numbers",
        claimedNumbers: existingNumbers,
      }, 409);
    }

    // Check if any of the requested numbers are already claimed
    for (const num of numbers) {
      if (rumble.assignments[num]) {
        const ownerUser = state.users.find(u => u.id === rumble.assignments[num]);
        return jsonResponse({
          error: `Number ${num} is already claimed by ${ownerUser?.name || "another player"}`,
        }, 409);
      }
    }

    // Claim the numbers
    const newAssignments = { ...rumble.assignments };
    for (const num of numbers) {
      newAssignments[num] = userId;
    }

    state = {
      ...state,
      [rumbleKey]: {
        ...rumble,
        assignments: newAssignments,
      },
      lastUpdated: new Date().toISOString(),
    };
    version++;

    await store.setJSON("match-state", state);
    await store.set("state-version", version.toString());

    return jsonResponse({
      success: true,
      state,
      version: version.toString(),
    });
  } catch (error) {
    console.error("Claim error:", error);
    return jsonResponse({ error: "Failed to claim numbers" }, 500);
  }
}

export const config = { path: "/api/claim" };
