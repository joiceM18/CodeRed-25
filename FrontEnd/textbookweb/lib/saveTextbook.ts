// Save textbook record to Node.js backend (Render hosted)
// Usage: await saveTextbook({ textbook_input, textbook_output, subject, userID, is_public })

const API_URL = "https://codered-25.onrender.com/api/textbook/add";

export interface SaveTextbookParams {
  textbook_input: string; // base64 or URL
  textbook_output: string; // base64 or URL
  subject: string;
  userID: number;
  is_public?: boolean;
  keywords?: string;
}

export async function saveTextbook(params: SaveTextbookParams): Promise<{ success: boolean; textbookID?: number; message?: string }> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  return data;
}
