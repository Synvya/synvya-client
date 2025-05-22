
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Synvya Retail API", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}

# Import routers after app creation to avoid circular imports
from app.api import products, profile  # noqa: E402
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
