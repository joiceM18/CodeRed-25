// Debug: log current userStore value on import
if (typeof window !== "undefined") {
  console.log("[userStore] localStorage value:", localStorage.getItem("user"));
}
// Utility for storing and retrieving user info in localStorage
export interface UserInfo {
  userId: number;
  username: string;
  password?: string;
}

const KEY = "user";

export function setUser(user: UserInfo) {
  if (!user) return;
  // Accept userId, userID, customer_id
  const userId = (user as any).userId || (user as any).userID || (user as any).customer_id;
  if (!userId || !user.username) return;
  // Always store as userId
  const toStore = { ...user, userId };
  localStorage.setItem(KEY, JSON.stringify(toStore));
  console.log("[userStore] setUser: stored", toStore);
}

export function getUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    // Accept userId, userID, customer_id
    const userId = u.userId || u.userID || u.customer_id;
    if (userId && u.username) return { ...u, userId };
    return null;
  } catch {
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem(KEY);
  console.log("[userStore] clearUser: removed user from localStorage");
}