export const onRequestPost = async ({ env }) => {
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
};
