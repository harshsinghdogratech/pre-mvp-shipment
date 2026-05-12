from fastapi import HTTPException


class AppError(HTTPException):
    def __init__(
        self,
        status_code: int,
        error: str,
        code: str,
    ) -> None:
        super().__init__(
            status_code=status_code,
            detail={"error": error, "code": code},
        )
