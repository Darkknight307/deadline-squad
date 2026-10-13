from fastapi import FastAPI

app = FastAPI(title="Deadline Squad API")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
