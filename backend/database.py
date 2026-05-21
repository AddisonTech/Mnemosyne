import aiosqlite
from typing import Optional

DB_PATH = "mnemosyne.db"


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS blocks (
                block_index      INTEGER PRIMARY KEY,
                timestamp        TEXT    NOT NULL,
                register_address INTEGER NOT NULL,
                register_value   INTEGER NOT NULL,
                previous_hash    TEXT    NOT NULL,
                hash             TEXT    NOT NULL
            )
        """)
        await db.commit()


async def get_latest_block() -> Optional[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM blocks ORDER BY block_index DESC LIMIT 1"
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def save_block(block: dict) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO blocks
               (block_index, timestamp, register_address, register_value, previous_hash, hash)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                block["index"],
                block["timestamp"],
                block["register_address"],
                block["register_value"],
                block["previous_hash"],
                block["hash"],
            ),
        )
        await db.commit()


async def get_chain(limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM blocks ORDER BY block_index DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in reversed(rows)]


async def get_all_blocks() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM blocks ORDER BY block_index ASC"
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_block(index: int) -> Optional[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM blocks WHERE block_index = ?", (index,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def tamper_block(index: int, new_value: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "UPDATE blocks SET register_value = ? WHERE block_index = ?",
            (new_value, index),
        )
        await db.commit()
        return cursor.rowcount > 0


async def get_block_count() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM blocks") as cursor:
            row = await cursor.fetchone()
            return row[0] if row else 0
