import hashlib
import json
from datetime import datetime, timezone


def compute_hash(index: int, timestamp: str, register_address: int, register_value: int, previous_hash: str) -> str:
    data = json.dumps({
        "index": index,
        "timestamp": timestamp,
        "register_address": register_address,
        "register_value": register_value,
        "previous_hash": previous_hash,
    }, sort_keys=True)
    return hashlib.sha256(data.encode()).hexdigest()


def make_genesis_block() -> dict:
    timestamp = datetime.now(timezone.utc).isoformat()
    previous_hash = "0" * 64
    return {
        "index": 0,
        "timestamp": timestamp,
        "register_address": 0,
        "register_value": 0,
        "previous_hash": previous_hash,
        "hash": compute_hash(0, timestamp, 0, 0, previous_hash),
    }


def make_block(previous_block: dict, register_address: int, register_value: int) -> dict:
    index = previous_block["index"] + 1
    timestamp = datetime.now(timezone.utc).isoformat()
    previous_hash = previous_block["hash"]
    return {
        "index": index,
        "timestamp": timestamp,
        "register_address": register_address,
        "register_value": register_value,
        "previous_hash": previous_hash,
        "hash": compute_hash(index, timestamp, register_address, register_value, previous_hash),
    }


def verify_chain(blocks: list[dict]) -> tuple[bool, int | None]:
    for i, block in enumerate(blocks):
        expected = compute_hash(
            block["index"],
            block["timestamp"],
            block["register_address"],
            block["register_value"],
            block["previous_hash"],
        )
        if block["hash"] != expected:
            return False, block["index"]
        if i > 0 and block["previous_hash"] != blocks[i - 1]["hash"]:
            return False, block["index"]
    return True, None
