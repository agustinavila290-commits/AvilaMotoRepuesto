from fastapi import APIRouter, HTTPException

from app.schemas import PriceListSwitch
import app.store as store

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.get("/active")
def get_active_price_list() -> dict[str, str]:
    return {"active_list": store.active_price_list}


@router.post("/active", response_model=PriceListSwitch)
def switch_price_list(payload: PriceListSwitch) -> PriceListSwitch:
    if payload.active_list not in {"card", "cash"}:
        raise HTTPException(status_code=400, detail="Lista inválida")
    store.active_price_list = payload.active_list
    return payload
