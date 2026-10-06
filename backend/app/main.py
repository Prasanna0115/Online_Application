from contextlib import asynccontextmanager

import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.models import Patient
from app.schemas import AuthResponse, PatientCreate, PatientLogin, PatientPublic
from app.security import create_access_token, hash_password, verify_password


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Harbor Health API",
    description="Patient account and authentication API for the appointment portal.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer(auto_error=False)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_patient(payload: PatientCreate, db: Session = Depends(get_db)) -> AuthResponse:
    normalized_email = str(payload.email).strip().lower()
    patient = Patient(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        phone=payload.phone.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(patient)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from exc
    db.refresh(patient)
    return AuthResponse(
        access_token=create_access_token(str(patient.id)),
        patient=PatientPublic.model_validate(patient),
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login_patient(payload: PatientLogin, db: Session = Depends(get_db)) -> AuthResponse:
    normalized_email = str(payload.email).strip().lower()
    patient = db.scalar(select(Patient).where(Patient.email == normalized_email))
    if patient is None or not verify_password(payload.password, patient.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return AuthResponse(
        access_token=create_access_token(str(patient.id)),
        patient=PatientPublic.model_validate(patient),
    )


@app.get("/api/auth/me", response_model=PatientPublic)
def current_patient(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> PatientPublic:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Your session is invalid or has expired. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        patient_id = int(claims["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as exc:
        raise unauthorized from exc

    patient = db.get(Patient, patient_id)
    if patient is None:
        raise unauthorized
    return PatientPublic.model_validate(patient)
