import enum
from datetime import datetime, date

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    client = "client"


class PackageStatus(str, enum.Enum):
    ready_to_send = "ready_to_send"
    pending_invoice_review = "pending_invoice_review"
    invoice_approved = "invoice_approved"
    ship_requested = "ship_requested"
    shipped = "shipped"
    ready_for_pickup = "ready_for_pickup"
    delivered = "delivered"


class InvoiceReviewStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    needs_review = "needs_review"


class ShipProcessingStatus(str, enum.Enum):
    pending = "pending"
    shipped = "shipped"


VALID_TRANSITIONS: dict[PackageStatus, list[PackageStatus]] = {
    PackageStatus.ready_to_send: [PackageStatus.pending_invoice_review],
    PackageStatus.pending_invoice_review: [
        PackageStatus.invoice_approved,
        PackageStatus.ready_to_send,
    ],
    PackageStatus.invoice_approved: [PackageStatus.ship_requested],
    PackageStatus.ship_requested: [PackageStatus.shipped],
    PackageStatus.shipped: [
        PackageStatus.ready_for_pickup,
        PackageStatus.delivered,
    ],
    PackageStatus.ready_for_pickup: [PackageStatus.delivered],
    PackageStatus.delivered: [],
}


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=32), nullable=False
    )
    suite_number: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    packages: Mapped[list["Package"]] = relationship(
        "Package", back_populates="client"
    )
    ship_requests: Mapped[list["ShipRequest"]] = relationship(
        "ShipRequest", back_populates="client"
    )


class Package(Base):
    __tablename__ = "packages"
    __table_args__ = (
        Index("ix_packages_client_id", "client_id"),
        Index("ix_packages_status", "status"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    tracking_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    width: Mapped[float] = mapped_column(Float, nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    length: Mapped[float] = mapped_column(Float, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    contents_description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[PackageStatus] = mapped_column(
        Enum(PackageStatus, native_enum=False, length=32),
        nullable=False,
        default=PackageStatus.ready_to_send,
    )
    client_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    date_received: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    client: Mapped["User"] = relationship("User", back_populates="packages")
    invoice: Mapped["Invoice | None"] = relationship(
        "Invoice", back_populates="package", uselist=False
    )
    status_history: Mapped[list["StatusHistory"]] = relationship(
        "StatusHistory", back_populates="package"
    )
    ship_request_links: Mapped[list["ShipRequestPackage"]] = relationship(
        "ShipRequestPackage", back_populates="package"
    )


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        Index("ix_invoices_package_id", "package_id"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    package_id: Mapped[int] = mapped_column(
        ForeignKey("packages.id"), unique=True, nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    review_status: Mapped[InvoiceReviewStatus] = mapped_column(
        Enum(InvoiceReviewStatus, native_enum=False, length=32),
        nullable=False,
        default=InvoiceReviewStatus.pending,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    package: Mapped["Package"] = relationship(
        "Package", back_populates="invoice"
    )
    reviewer: Mapped["User | None"] = relationship("User", lazy="joined")


class ShipRequest(Base):
    __tablename__ = "ship_requests"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    client_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    processing_status: Mapped[ShipProcessingStatus] = mapped_column(
        Enum(ShipProcessingStatus, native_enum=False, length=32),
        nullable=False,
        default=ShipProcessingStatus.pending,
    )

    client: Mapped["User"] = relationship(
        "User", back_populates="ship_requests"
    )
    package_links: Mapped[list["ShipRequestPackage"]] = relationship(
        "ShipRequestPackage", back_populates="ship_request"
    )


class ShipRequestPackage(Base):
    __tablename__ = "ship_request_packages"
    __table_args__ = (
        Index(
            "ix_ship_request_packages_ship_request_id", "ship_request_id"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    ship_request_id: Mapped[int] = mapped_column(
        ForeignKey("ship_requests.id"), nullable=False
    )
    package_id: Mapped[int] = mapped_column(
        ForeignKey("packages.id"), nullable=False
    )

    ship_request: Mapped["ShipRequest"] = relationship(
        "ShipRequest", back_populates="package_links"
    )
    package: Mapped["Package"] = relationship(
        "Package", back_populates="ship_request_links"
    )


class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    package_id: Mapped[int] = mapped_column(
        ForeignKey("packages.id"), nullable=False
    )
    old_status: Mapped[str] = mapped_column(String(32), nullable=False)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)
    changed_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    package: Mapped["Package"] = relationship(
        "Package", back_populates="status_history"
    )
    changed_by: Mapped["User"] = relationship("User", lazy="joined")
