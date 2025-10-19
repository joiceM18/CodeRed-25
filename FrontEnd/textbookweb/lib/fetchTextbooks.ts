// Call Node.js backend (Render hosted) to retrieve textbooks for a user
// Endpoint expects POST { userID }

const API_URL = "https://codered-25.onrender.com/api/textbook/retrieve";

export interface TextbookRow {
  textbookID?: number;
  subject: string;
  textbook_input: string; // stored as base64 (no data URI)
  textbook_output: string; // stored as base64 (PNG)
  userID?: number;
  is_public?: number | boolean;
  created_at?: string;
}

export interface RetrieveResponse {
  success: boolean;
  textbooks?: TextbookRow[];
  message?: string;
}

export async function fetchTextbooks(userID: number): Promise<RetrieveResponse> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userID }),
    cache: "no-store",
  });
  try {
    const data = (await res.json()) as RetrieveResponse;
    return data;
  } catch (e) {
    return { success: false, message: "Invalid JSON from server" };
  }
}
