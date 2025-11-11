-- Migration: create admin and visits tables
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY,
    password TEXT NOT NULL,
    last_login TEXT
);

INSERT INTO admin (id, password)
SELECT 1, '1234'
WHERE NOT EXISTS (SELECT 1 FROM admin WHERE id = 1);

CREATE TABLE IF NOT EXISTS visits (
    visit_date TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);
