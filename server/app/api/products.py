"""
Simple Products API - Frontend now handles Nostr operations directly
"""

from typing import Any

from fastapi import APIRouter

router = APIRouter()

# Simple in-memory storage for demo - replace with proper database in production
products_store: list[dict[str, Any]] = []


@router.get("/")
async def get_products() -> list[dict[str, Any]]:
    """
    Get all products (simplified - no authentication needed for demo).
    Frontend handles Nostr operations directly.
    """
    return products_store


@router.post("/")
async def create_product(product_data: dict[str, Any]) -> dict[str, Any]:
    """
    Create a new product (simplified demo endpoint).
    In the new architecture, products are stored on Nostr relays via frontend.
    """
    product_id = len(products_store) + 1
    product = {
        "id": product_id,
        "created_at": "2024-01-01T00:00:00Z",
        **product_data,
    }
    products_store.append(product)

    return {
        "success": True,
        "message": "Product created successfully (demo)",
        "product": product,
    }


@router.post("/bulk-import")
async def bulk_import_products(
    source: str, data: list[dict[str, Any]]
) -> dict[str, Any]:
    """
    Bulk import products from external platforms (simplified).
    Frontend can integrate with external APIs directly or use this as a proxy.
    """
    imported_count = 0
    for item in data:
        # Simple validation and import logic
        if "name" in item and "price" in item:
            product = {
                "id": len(products_store) + 1,
                "source": source,
                "created_at": "2024-01-01T00:00:00Z",
                **item,
            }
            products_store.append(product)
            imported_count += 1

    return {
        "success": True,
        "message": f"Imported {imported_count} products from {source}",
        "imported_count": imported_count,
        "total_products": len(products_store),
    }


@router.post("/upload-csv")
async def upload_csv(file_data: bytes) -> dict[str, Any]:
    """
    Upload and process CSV file for product import (simplified).
    Frontend can handle CSV parsing directly or send processed data here.
    """
    # In a real implementation, you'd parse the CSV and extract products
    # For now, just return a success message

    return {
        "success": True,
        "message": "CSV upload endpoint ready - implement CSV parsing as needed",
        "note": "Frontend can handle CSV parsing directly with libraries like papaparse",
    }
