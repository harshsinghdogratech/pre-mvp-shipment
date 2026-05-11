from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class RoleEnum(str, Enum):
    admin = "admin"
    client = "client"


class UserPublic(BaseModel):
    id: int
    name: str
    email: str
    role: RoleEnum

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class PackageStatusEnum(str, Enum):
    pending_invoice = "pending_invoice"
    invoice_uploaded = "invoice_uploaded"
    approved = "approved"
    rejected = "rejected"
    shipment_requested = "shipment_requested"
    shipped = "shipped"


class InvoiceStatusEnum(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LatestInvoiceInfo(BaseModel):
    id: int
    status: InvoiceStatusEnum
    rejection_reason: str | None = None

    model_config = {"from_attributes": True}


class PackageCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    client_id: int


class PackageOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: PackageStatusEnum
    created_by_id: int
    client_id: int
    created_at: datetime
    updated_at: datetime
    latest_invoice: LatestInvoiceInfo | None = None
    client_name: str | None = None
    client_email: str | None = None

    model_config = {"from_attributes": True}


class InvoiceOut(BaseModel):
    id: int
    package_id: int
    client_id: int
    original_file_name: str
    stored_file_name: str
    file_path: str
    file_type: str
    status: InvoiceStatusEnum
    rejection_reason: str | None
    uploaded_at: datetime
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class InvoicePendingRow(BaseModel):
    id: int
    package_id: int
    package_title: str
    client_name: str
    client_email: str
    original_file_name: str
    file_type: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class RejectBody(BaseModel):
    rejection_reason: str = Field(..., min_length=1)


class ClientUserOut(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


class StatsAdmin(BaseModel):
    total_packages: int
    pending_reviews: int
    shipment_requests: int
    shipped_packages: int


class StatsClient(BaseModel):
    total_packages: int
    pending_uploads: int
    approved_packages: int
    shipped_packages: int
