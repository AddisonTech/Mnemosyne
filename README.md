# Mnemosyne

Immutable Modbus register ledger. Each poll result from a ModBridge instance is hashed into a tamper-evident blockchain so historical sensor data can be verified as unaltered after the fact.

Built as a companion to [ModBridge](https://github.com/AddisonTech/ModBridge).

---

## How it works

Each incoming register reading is packaged into a block alongside its timestamp and the previous block's SHA-256 hash. Changing any past reading invalidates every hash that follows it. The `/verify` endpoint walks the full chain and reports the first block where the stored hash no longer matches the computed hash.

The tamper simulation button in the dashboard demonstrates this directly: it mutates a block's stored value without updating its hash, then lets you run verify and watch the chain fail at the corrupted block.

---

## Stack

- **Backend:** Python, FastAPI, SQLite, aiosqlite
- **Frontend:** React, Vite
- **Chain:** SHA-256, implemented from scratch

---

## Running locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Backend at `http://localhost:8000`.

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/block` | Add a register reading to the chain |
| GET | `/chain?limit=50` | Return the last N blocks |
| GET | `/block/{index}` | Get a specific block |
| GET | `/verify` | Walk the full chain and verify integrity |
| GET | `/stats` | Return total block count |
| POST | `/tamper/{index}` | Corrupt a block's value (demo only) |
| WS | `/ws` | Live event stream |

**POST /block body:**
```json
{ "register_address": 1, "register_value": 4823 }
```

**POST /tamper/{index} body:**
```json
{ "new_value": 9999 }
```

---

## Connecting ModBridge

ModBridge can POST each poll result to Mnemosyne's `/block` endpoint. Point it at `http://localhost:8000/block` with the register address and value from each read cycle.
