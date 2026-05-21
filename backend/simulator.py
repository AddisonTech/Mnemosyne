import asyncio
import random

_task: asyncio.Task | None = None
_running = False

REGISTERS = [
    {"address": 0x0001, "name": "temperature", "value": 72.0,  "min": 60.0,  "max": 95.0,  "step": 0.8},
    {"address": 0x0002, "name": "pressure",    "value": 145.0, "min": 120.0, "max": 175.0, "step": 1.2},
    {"address": 0x0003, "name": "current",     "value": 18.0,  "min": 10.0,  "max": 30.0,  "step": 0.5},
    {"address": 0x0004, "name": "voltage",     "value": 480.0, "min": 460.0, "max": 500.0, "step": 0.4},
    {"address": 0x0005, "name": "speed",       "value": 1750,  "min": 1600,  "max": 1800,  "step": 5.0},
]


def _walk(reg: dict) -> int:
    delta = random.uniform(-reg["step"], reg["step"])
    reg["value"] = max(reg["min"], min(reg["max"], reg["value"] + delta))
    return round(reg["value"])


async def _loop(add_block_fn):
    global _running
    while _running:
        reg = random.choice(REGISTERS)
        value = _walk(reg)
        await add_block_fn(reg["address"], value)
        await asyncio.sleep(random.uniform(0.8, 2.0))


def is_running() -> bool:
    return _running


async def start(add_block_fn):
    global _task, _running
    if _running:
        return
    _running = True
    _task = asyncio.create_task(_loop(add_block_fn))


async def stop():
    global _task, _running
    _running = False
    if _task:
        _task.cancel()
        try:
            await _task
        except asyncio.CancelledError:
            pass
        _task = None
