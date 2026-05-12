from app.schemas import InvoiceReviewStatusEnum, PackageStatusEnum

_LEGACY_PACKAGE_STATUS: dict[str, PackageStatusEnum] = {
    "pending_invoice": PackageStatusEnum.pending_invoice_review,
}


def package_status_enum(raw: str) -> PackageStatusEnum:
    if raw in _LEGACY_PACKAGE_STATUS:
        return _LEGACY_PACKAGE_STATUS[raw]
    try:
        return PackageStatusEnum(raw)
    except ValueError:
        return PackageStatusEnum.ready_to_send


def invoice_review_enum(raw: str) -> InvoiceReviewStatusEnum:
    try:
        return InvoiceReviewStatusEnum(raw)
    except ValueError:
        return InvoiceReviewStatusEnum.pending
