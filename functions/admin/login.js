import { getAdminPassword, updateLastLogin } from "../_shared";

export const onRequestPost = async ({ request, env }) => {
  try {
    const { password } = await request.json();
    if (typeof password !== "string") {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const adminPassword = await getAdminPassword(env);

    if (!adminPassword) {
      return Response.json({ error: "Admin account not initialized" }, { status: 500 });
    }

    if (password === adminPassword) {
      await updateLastLogin(env);
      return Response.json({ authenticated: true });
    }

    return Response.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.error("login failed", error);
    return Response.json({ error: "Failed to process login" }, { status: 500 });
  }
};
