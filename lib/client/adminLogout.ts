/** Clears the httpOnly admin session cookie and navigates to the login page. */
export async function adminLogoutAndRedirect(): Promise<void> {
  try {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
  } catch {
    // Still send the user to login; cookie may already be gone.
  }
  window.location.assign("/login");
}
