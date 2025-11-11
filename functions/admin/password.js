import { getAdminPassword, updateAdminPassword } from "../_shared";

export const onRequestPost = async ({ request, env }) => {
  try {
    const payload = await request.json();
    const currentPassword = payload?.current_password;
    const newPassword = payload?.new_password;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (!newPassword.trim()) {
      return Response.json({ error: "New password required" }, { status: 400 });
    }

    const adminPassword = await getAdminPassword(env);

    if (!adminPassword) {
      return Response.json({ error: "Admin account not initialized" }, { status: 500 });
    }

    if (currentPassword !== adminPassword) {
      return Response.json({ error: "Current password incorrect" }, { status: 401 });
    }

    await updateAdminPassword(env, newPassword);

    return Response.json({ updated: true });
  } catch (error) {
    console.error("password change failed", error);
    return Response.json({ error: "Failed to change password" }, { status: 500 });
  }
};
