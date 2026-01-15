import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/edge-functions";

// Types
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
}

interface MatchState {
  users: Array<{ id: string; name: string; avatar: string }>;
  mensRumble: RumbleMatch;
  womensRumble: RumbleMatch;
  predictions: Record<string, unknown>;
  lastUpdated: string | null;
}

interface UpdatePayload {
  action: "addEntrant" | "eliminateWrestler" | "resetRumble" | "performLotteryDraw" | "clearAssignments" | "fullUpdate";
  rumbleType?: "mens" | "womens";
  wrestlerId?: string;
  state?: MatchState;
}

const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") || "rumble2026";

// Initial state for resets
function getInitialRumble(existingAssignments: Record<string, string> = {}): RumbleMatch {
  return {
    status: "not_started",
    assignments: existingAssignments,
    entrants: {},
    eliminations: [],
    eliminationDetails: [],
    winner: null,
    currentEntryNumber: 0,
    matchStartTime: null,
  };
}

// Apply update based on action
function applyUpdate(state: MatchState, payload: UpdatePayload): MatchState {
  const rumbleKey = payload.rumbleType === "mens" ? "mensRumble" : "womensRumble";
  const rumble = state[rumbleKey];

  switch (payload.action) {
    case "addEntrant": {
      if (!payload.wrestlerId) return state;
      const nextEntry = rumble.currentEntryNumber + 1;
      if (nextEntry > 30) return state;

      return {
        ...state,
        [rumbleKey]: {
          ...rumble,
          entrants: { ...rumble.entrants, [nextEntry]: payload.wrestlerId },
          currentEntryNumber: nextEntry,
          status: "in_progress" as const,
          matchStartTime: rumble.matchStartTime || new Date().toISOString(),
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case "eliminateWrestler": {
      if (!payload.wrestlerId) return state;
      if (rumble.eliminations.includes(payload.wrestlerId)) return state;

      const newEliminations = [...rumble.eliminations, payload.wrestlerId];
      const inRingCount = Object.keys(rumble.entrants).length - newEliminations.length;

      let newStatus = rumble.status;
      let winner = rumble.winner;

      // Check if match is complete
      if (inRingCount === 1 && rumble.currentEntryNumber === 30) {
        const remainingId = Object.values(rumble.entrants).find(
          (id) => !newEliminations.includes(id)
        );
        winner = remainingId || null;
        newStatus = "completed";
      }

      return {
        ...state,
        [rumbleKey]: {
          ...rumble,
          eliminations: newEliminations,
          winner,
          status: newStatus,
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case "resetRumble": {
      return {
        ...state,
        [rumbleKey]: getInitialRumble(rumble.assignments),
        lastUpdated: new Date().toISOString(),
      };
    }

    case "performLotteryDraw": {
      const users = state.users;
      const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

      // Fisher-Yates shuffle
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }

      // Assign 2 numbers to each of 15 users
      const assignments: Record<string, string> = {};
      let numberIndex = 0;

      users.forEach((user) => {
        assignments[numbers[numberIndex]] = user.id;
        assignments[numbers[numberIndex + 1]] = user.id;
        numberIndex += 2;
      });

      return {
        ...state,
        [rumbleKey]: {
          ...rumble,
          assignments,
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case "clearAssignments": {
      return {
        ...state,
        [rumbleKey]: {
          ...rumble,
          assignments: {},
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case "fullUpdate": {
      if (!payload.state) return state;
      return {
        ...payload.state,
        lastUpdated: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

export default async function handler(req: Request, context: Context) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Verify admin secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const payload: UpdatePayload = await req.json();
    const store = getStore("rumble-state");

    // Get current state
    let state = (await store.get("match-state", { type: "json" })) as MatchState | null;
    let version = parseInt((await store.get("state-version")) || "0");

    if (!state) {
      // Initialize with default state
      state = {
        users: Array.from({ length: 15 }, (_, i) => ({
          id: `user-${i + 1}`,
          name: `Player ${i + 1}`,
          avatar: `${i + 1}`,
        })),
        mensRumble: getInitialRumble(),
        womensRumble: getInitialRumble(),
        predictions: {},
        lastUpdated: null,
      };
    }

    // Apply update
    state = applyUpdate(state, payload);
    version++;

    // Save updated state
    await store.setJSON("match-state", state);
    await store.set("state-version", version.toString());

    return new Response(
      JSON.stringify({
        success: true,
        state,
        version: version.toString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Update error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update state" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export const config = { path: "/api/update" };
