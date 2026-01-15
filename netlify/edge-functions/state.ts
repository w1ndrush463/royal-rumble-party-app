import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/edge-functions";

// Initial state to seed if nothing exists
const initialState = {
  users: [
    { id: "user-1", name: "Player 1", avatar: "1" },
    { id: "user-2", name: "Player 2", avatar: "2" },
    { id: "user-3", name: "Player 3", avatar: "3" },
    { id: "user-4", name: "Player 4", avatar: "4" },
    { id: "user-5", name: "Player 5", avatar: "5" },
    { id: "user-6", name: "Player 6", avatar: "6" },
    { id: "user-7", name: "Player 7", avatar: "7" },
    { id: "user-8", name: "Player 8", avatar: "8" },
    { id: "user-9", name: "Player 9", avatar: "9" },
    { id: "user-10", name: "Player 10", avatar: "10" },
    { id: "user-11", name: "Player 11", avatar: "11" },
    { id: "user-12", name: "Player 12", avatar: "12" },
    { id: "user-13", name: "Player 13", avatar: "13" },
    { id: "user-14", name: "Player 14", avatar: "14" },
    { id: "user-15", name: "Player 15", avatar: "15" }
  ],
  mensRumble: {
    status: "not_started",
    assignments: {},
    entrants: {},
    eliminations: [],
    eliminationDetails: [],
    winner: null,
    currentEntryNumber: 0,
    matchStartTime: null
  },
  womensRumble: {
    status: "not_started",
    assignments: {},
    entrants: {},
    eliminations: [],
    eliminationDetails: [],
    winner: null,
    currentEntryNumber: 0,
    matchStartTime: null
  },
  predictions: {},
  lastUpdated: null
};

export default async function handler(req: Request, context: Context) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const clientVersion = url.searchParams.get("version");

    const store = getStore("rumble-state");

    // Get current version first (cheap check)
    let currentVersion = await store.get("state-version");

    // If client is up to date, return 304
    if (clientVersion && clientVersion === currentVersion) {
      return new Response(null, {
        status: 304,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Get full state (or initialize if doesn't exist)
    let state = await store.get("match-state", { type: "json" });

    if (!state) {
      // Initialize with default state
      state = initialState;
      currentVersion = "1";
      await store.setJSON("match-state", state);
      await store.set("state-version", currentVersion);
    }

    if (!currentVersion) {
      currentVersion = "1";
      await store.set("state-version", currentVersion);
    }

    return new Response(
      JSON.stringify({
        state,
        version: currentVersion,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("State fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch state" }),
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

export const config = { path: "/api/state" };
