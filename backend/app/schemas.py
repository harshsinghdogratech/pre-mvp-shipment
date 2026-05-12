from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class RoleEnum(str, Enum):
    admin = "admin"
    client = "client"


class PackageStatusEnum(str, Enum):
    ready_to_send = "ready_to_send"
    pending_invoice_review = "pending_invoice_review"
    invoice_approved = "invoice_approved"
    ship_requested = "ship_requested"
    shipped = "shipped"
    ready_for_pickup = "ready_for_pickup"
    delivered = "delivered"


class InvoiceReviewStatusEnum(str, Enum):
    pending = "pending"
    approved = "approved"
    needs_review = "needs_review"


class ShipProcessingStatusEnum(str, Enum):
    pending = "pending"
    shipped = "shipped"


class UserPublic(BaseModel):
    id: int
    name: str
    email: str
    role: RoleEnum
    suite_number: str | None = None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class PackageCreate(BaseModel):
    tracking_number: str = Field(..., min_length=1, max_length=100)
    width: float = Field(..., ge=0)
    height: float = Field(..., ge=0)
    length: float = Field(..., ge=0)
    weight: float = Field(..., ge=0)
    contents_description: str = Field(..., min_length=1)
    client_id: int
    date_received: date | None = None


class InvoiceInfo(BaseModel):
    id: int
    review_status: InvoiceReviewStatusEnum
    admin_notes: str | None = None
    file_name: str | None = None
    uploaded_at: datetime | None = None

    model_config = {"from_attributes": True}


class StatusHistoryItem(BaseModel):
    id: int
    old_status: str
    new_status: str
    changed_at: datetime
    changed_by_name: str | None = None

    model_config = {"from_attributes": True}


class PackageOut(BaseModel):
    id: int
    tracking_number: str
    width: float
    height: float
    length: float
    weight: float
    contents_description: str
    status: PackageStatusEnum
    client_id: int
    date_received: date
    created_at: datetime
    updated_at: datetime
    client_name: str | None = None
    client_email: str | None = None
    client_suite: str | None = None
    invoice: InvoiceInfo | None = None

    model_config = {"from_attributes": True}


class PackageDetail(PackageOut):
    status_history: list[StatusHistoryItem] = []


class InvoiceOut(BaseModel):
    id: int
    package_id: int
    file_path: str
    file_name: str
    uploaded_at: datetime
    review_status: InvoiceReviewStatusEnum
    admin_notes: str | None
    reviewed_at: datetime | None
    reviewed_by: int | None

    model_config = {"from_attributes": True}


class InvoicePendingRow(BaseModel):
    id: int
    package_id: int
    package_tracking: str
    contents_description: str | None = None
    client_name: str
    client_email: str
    client_suite: str | None
    file_name: str
    file_path: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class NeedsReviewBody(BaseModel):
    admin_notes: str = Field(..., min_length=1)


class FinalStatusBody(BaseModel):
    status: PackageStatusEnum

    def validate_final(self) -> None:
        allowed = {
            PackageStatusEnum.ready_for_pickup,
            PackageStatusEnum.delivered,
        }
        if self.status not in allowed:
            raise ValueError(
                "Only 'ready_for_pickup' or 'delivered' accepted"
            )


class ShipRequestCreate(BaseModel):
    package_ids: list[int] = Field(..., min_length=1)


class ShipRequestPackageOut(BaseModel):
    id: int
    package_id: int
    tracking_number: str | None = None
    contents_description: str | None = None
    status: PackageStatusEnum | None = None

    model_config = {"from_attributes": True}


class ShipRequestOut(BaseModel):
    id: int
    client_id: int
    client_name: str | None = None
    client_email: str | None = None
    submitted_at: datetime
    processing_status: ShipProcessingStatusEnum
    packages: list[ShipRequestPackageOut] = []

    model_config = {"from_attributes": True}


class AdminDashboard(BaseModel):
    ready_to_send: int = 0
    pending_invoice_review: int = 0
    invoice_approved: int = 0
    ship_requested: int = 0
    shipped: int = 0
    ready_for_pickup: int = 0
    delivered: int = 0
    total_clients: int = 0
    pending_invoice_count: int = 0


class ClientDashboard(BaseModel):
    ready_to_send: int = 0
    pending_invoice_review: int = 0
    invoice_approved: int = 0
    ship_requested: int = 0
    shipped: int = 0
    ready_for_pickup: int = 0
    delivered: int = 0


class AdminClientListItem(BaseModel):
    id: int
    name: str
    email: str
    suite_number: str | None = None
    package_count: int = 0

    model_config = {"from_attributes": True}


class AdminClientDetail(BaseModel):
    id: int
    name: str
    email: str
    suite_number: str | None = None
    packages: list[PackageOut] = []

    model_config = {"from_attributes": True}


class ClientShipmentItem(BaseModel):
    id: int
    tracking_number: str
    contents_description: str
    status: PackageStatusEnum
    updated_at: datetime

    model_config = {"from_attributes": True}


class ErrorResponse(BaseModel):
    error: str
    code: str
