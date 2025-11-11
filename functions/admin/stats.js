import { getAdminPassword } from "../_shared";

export const onRequestGet = async ({ request, env }) => {
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
};
