-- ============================================================================
-- Milestone feature: DDL to run manually on Postgres (no auto-migrations here).
-- Option A: milestone state lives on tr_milestones (shared); tr_fpb_item_milestones
-- is a pure link. Informational only -- never touches tr_purchaserequests.status.
-- ============================================================================

CREATE TABLE IF NOT EXISTS tr_milestones (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    status          INTEGER NOT NULL DEFAULT 0, -- 0 pending, 1 in-progress, 2 completed, 3 blocked
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    note            TEXT,
    is_delete       INTEGER NOT NULL DEFAULT 0,
    deleted_at      TIMESTAMP,
    deleted_by      INTEGER,
    deleted_by_name VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      INTEGER,
    created_by_name VARCHAR(255),
    updated_at      TIMESTAMP,
    updated_by      INTEGER,
    updated_by_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tr_fpb_item_milestones (
    id              SERIAL PRIMARY KEY,
    fpb_item_id     INTEGER NOT NULL, -- references tr_purchaserequestdetails.id
    milestone_id    INTEGER NOT NULL, -- references tr_milestones.id
    is_delete       INTEGER NOT NULL DEFAULT 0,
    deleted_at      TIMESTAMP,
    deleted_by      INTEGER,
    deleted_by_name VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      INTEGER,
    created_by_name VARCHAR(255),
    updated_at      TIMESTAMP,
    updated_by      INTEGER,
    updated_by_name VARCHAR(255),
    CONSTRAINT uq_fpb_item_milestone UNIQUE (fpb_item_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_fpb_item_milestones_item ON tr_fpb_item_milestones (fpb_item_id);
CREATE INDEX IF NOT EXISTS idx_fpb_item_milestones_milestone ON tr_fpb_item_milestones (milestone_id);

-- Optional seed of a default milestone set (idempotent).
INSERT INTO tr_milestones (name, sort_order)
SELECT v.name, v.sort_order
FROM (VALUES
    ('Order placed', 0),
    ('In production', 1),
    ('Ready to ship', 2),
    ('Shipped', 3),
    ('Delivered', 4)
) AS v (name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM tr_milestones WHERE name = v.name AND is_delete = 0);
