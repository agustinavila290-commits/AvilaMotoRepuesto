from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import PricingSettingModel
from app.schemas import PriceListSwitch

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.get("/active")
def get_active_price_list(db: Session = Depends(get_db)) -> dict[str, str]:
    setting = db.get(PricingSettingModel, 1)
    if setting is None:
        setting = PricingSettingModel(id=1, active_list="card")
        db.add(setting)
        db.commit()
    return {"active_list": setting.active_list}


@router.post("/active", response_model=PriceListSwitch)
def switch_price_list(payload: PriceListSwitch, db: Session = Depends(get_db)) -> PriceListSwitch:
    if payload.active_list not in {"card", "cash"}:
        raise HTTPException(status_code=400, detail="Lista inválida")

    setting = db.get(PricingSettingModel, 1)
    if setting is None:
        setting = PricingSettingModel(id=1)
        db.add(setting)

    setting.active_list = payload.active_list
    db.commit()
    return payload
