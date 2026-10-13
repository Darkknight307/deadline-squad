from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import auth, deadlines, groups
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Deadline Squad API", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(deadlines.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
