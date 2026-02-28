from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()

@router.get("/")
def get_models():
    return [
        {"model_type": "Logistic Regression", "accuracy": 0.8462, "cv_mean_score": 0.8461},
        {"model_type": "Random Forest", "accuracy": 0.8462, "cv_mean_score": 0.8461},
        {"model_type": "Gradient Boosting", "accuracy": 0.8462, "cv_mean_score": 0.8461},
    ]