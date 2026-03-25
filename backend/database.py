import aiosqlite
import json
import os

DB_PATH = os.environ.get("DB_PATH", "/tmp/wiscrap.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                source TEXT,
                status TEXT DEFAULT 'pending',
                progress INTEGER DEFAULT 0,
                total INTEGER DEFAULT 0,
                message TEXT DEFAULT '',
                created_at TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT,
                data TEXT
            )
        """)
        await db.commit()


async def create_job(job_id: str, source: str, created_at: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO jobs (id, source, status, created_at) VALUES (?, ?, 'pending', ?)",
            (job_id, source, created_at)
        )
        await db.commit()


async def update_job(job_id: str, status: str, progress: int, total: int, message: str = ""):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE jobs SET status=?, progress=?, total=?, message=? WHERE id=?",
            (status, progress, total, message, job_id)
        )
        await db.commit()


async def save_result(job_id: str, lead: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO results (job_id, data) VALUES (?, ?)",
            (job_id, json.dumps(lead, ensure_ascii=False))
        )
        await db.commit()


async def get_job(job_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)) as cur:
            row = await cur.fetchone()
            if not row:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))


async def get_results(job_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT data FROM results WHERE job_id=? ORDER BY id", (job_id,)
        ) as cur:
            rows = await cur.fetchall()
            return [json.loads(r[0]) for r in rows]


async def delete_job(job_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM results WHERE job_id=?", (job_id,))
        await db.execute("DELETE FROM jobs WHERE id=?", (job_id,))
        await db.commit()
