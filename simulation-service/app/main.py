import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="Confidence-Aware Swarm Simulation & Edge AI Service",
    description="Python microservice providing decentralized swarm dynamics, onboard telemetry, edge fault diagnosis, and NetworkX mesh modeling",
    version="1.0.0"
)

# Enable CORS for direct local calls or proxying
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
