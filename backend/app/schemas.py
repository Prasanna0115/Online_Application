from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PatientCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)


class PatientLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class PatientPublic(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    patient: PatientPublic
