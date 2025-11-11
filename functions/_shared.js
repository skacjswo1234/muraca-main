export async function getAdminPassword(env) {
  const row = await env.DB.prepare(
    `SELECT password FROM admin WHERE id = 1`
  ).first();

  return row?.password ?? null;
}

export async function updateLastLogin(env) {
  await env.DB.prepare(
    `UPDATE admin SET last_login = datetime('now') WHERE id = 1`
  ).run();
}
