from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import RegisterReading, Block, VerifyResult, TamperRequest, Stats
from chain import make_genesis_block, make_block, verify_chain
from database import (
    init_db,
    get_latest_block,
    save_block,
    get_chain,
    get_all_blocks,
    get_block,
    tamper_block,
    get_block_count,
)


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


manager = ConnectionManager()


def to_block(row: dict) -> Block:
    return Block(
        index=row["block_index"],
        timestamp=row["timestamp"],
        register_address=row["register_address"],
        register_value=row["register_value"],
        previous_hash=row["previous_hash"],
        hash=row["hash"],
    )


def normalize(row: dict) -> dict:
    return {
        "index": row["block_index"],
        "timestamp": row["timestamp"],
        "register_address": row["register_address"],
        "register_value": row["register_value"],
        "previous_hash": row["previous_hash"],
        "hash": row["hash"],
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    if not await get_latest_block():
        genesis = make_genesis_block()
        await save_block(genesis)
    yield


app = FastAPI(title="Mnemosyne", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/block", response_model=Block)
async def add_block(reading: RegisterReading):
    previous = await get_latest_block()
    block = make_block(normalize(previous), reading.register_address, reading.register_value)
    await save_block(block)
    await manager.broadcast({"event": "new_block", "block": block})
    return block


@app.get("/chain", response_model=list[Block])
async def read_chain(limit: int = 50):
    rows = await get_chain(limit)
    return [to_block(r) for r in rows]


@app.get("/block/{index}", response_model=Block)
async def read_block(index: int):
    row = await get_block(index)
    if not row:
        raise HTTPException(status_code=404, detail="Block not found")
    return to_block(row)


@app.get("/verify", response_model=VerifyResult)
async def verify():
    rows = await get_all_blocks()
    blocks = [normalize(r) for r in rows]
    intact, bad_index = verify_chain(blocks)
    result = VerifyResult(intact=intact, block_count=len(blocks), first_bad_index=bad_index)
    await manager.broadcast({"event": "verify_result", "result": result.model_dump()})
    return result


@app.post("/tamper/{index}")
async def tamper(index: int, body: TamperRequest):
    success = await tamper_block(index, body.new_value)
    if not success:
        raise HTTPException(status_code=404, detail="Block not found")
    await manager.broadcast({"event": "tampered", "block_index": index})
    return {"tampered": True, "block_index": index, "new_value": body.new_value}


@app.get("/stats", response_model=Stats)
async def stats():
    return Stats(block_count=await get_block_count())


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
