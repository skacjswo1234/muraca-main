export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/?$/, "");

    if (request.method === "POST" && pathname === "/api/visit") {
      return handleVisit(env);
    }

    if (request.method === "POST" && pathname === "/admin/login") {
      return handleLogin(request, env);
    }

    if (request.method === "GET" && pathname === "/admin/stats") {
      return handleStats(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleVisit(env) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare(
      `INSERT INTO visits (visit_date, count)
       VALUES (?1, 1)
       ON CONFLICT(visit_date) DO UPDATE SET count = count + 1`
    )
      .bind(today)
      .run();

    const row = await env.DB.prepare(
      `SELECT count FROM visits WHERE visit_date = ?1`
    )
      .bind(today)
      .first();

    return Response.json({ date: today, count: row?.count ?? 0 });
  } catch (error) {
    console.error("visit increment failed", error);
    return Response.json({ error: "Failed to record visit" }, { status: 500 });
  }
}

async function handleLogin(request, env) {
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
      await env.DB.prepare(
        `UPDATE admin SET last_login = datetime('now') WHERE id = 1`
      ).run();
      return Response.json({ authenticated: true });
    }

    return Response.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.error("login failed", error);
    return Response.json({ error: "Failed to process login" }, { status: 500 });
  }
}

async function handleStats(request, env) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const providedPassword =
    params.get("password") ?? request.headers.get("x-admin-password");

  if (!providedPassword) {
    return Response.json({ error: "Password required" }, { status: 401 });
  }

  const adminPassword = await getAdminPassword(env);

  if (!adminPassword || providedPassword !== adminPassword) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = params.get("start");
  const end = params.get("end");

  let query = "SELECT visit_date, count FROM visits";
  const bindings = [];

  if (start && end) {
    query += " WHERE visit_date BETWEEN ?1 AND ?2";
    bindings.push(start, end);
  } else if (start) {
    query += " WHERE visit_date >= ?1";
    bindings.push(start);
  } else if (end) {
    query += " WHERE visit_date <= ?1";
    bindings.push(end);
  }

  query += " ORDER BY visit_date DESC";

  try {
    const statement = env.DB.prepare(query);
    const boundStatement = bindings.length
      ? statement.bind(...bindings)
      : statement;
    const result = await boundStatement.all();

    return Response.json({
      visits: result.results ?? [],
    });
  } catch (error) {
    console.error("stats query failed", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

async function getAdminPassword(env) {
  const row = await env.DB.prepare(
    `SELECT password FROM admin WHERE id = 1`
  ).first();

  return row?.password ?? null;
}
