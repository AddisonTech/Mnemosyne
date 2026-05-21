from pydantic import BaseModel
from typing import Optional


class RegisterReading(BaseModel):
    register_address: int
    register_value: int


class Block(BaseModel):
    index: int
    timestamp: str
    register_address: int
    register_value: int
    previous_hash: str
    hash: str


class VerifyResult(BaseModel):
    intact: bool
    block_count: int
    first_bad_index: Optional[int] = None


class TamperRequest(BaseModel):
    new_value: int


class Stats(BaseModel):
    block_count: int
