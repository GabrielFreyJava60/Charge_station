"""Custom exceptions for the EV Charging Station system."""


class AppError(Exception):
    """Base application error."""
    def __init__(self, message, status_code=500, error_code="INTERNAL_ERROR"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

    def to_dict(self):
        return {
            "error": self.error_code,
            "message": self.message,
        }


class NotFoundError(AppError):
    def __init__(self, resource, resource_id):
        super().__init__(
            message=f"{resource} '{resource_id}' not found",
            status_code=404,
            error_code="NOT_FOUND",
        )


class ConflictError(AppError):
    def __init__(self, message):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
        )


class ValidationError(AppError):
    def __init__(self, message):
        super().__init__(
            message=message,
            status_code=400,
            error_code="VALIDATION_ERROR",
        )


class ForbiddenError(AppError):
    def __init__(self, message="Access denied"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN",
        )


class InvalidTransitionError(AppError):
    def __init__(self, message):
        super().__init__(
            message=message,
            status_code=400,
            error_code="INVALID_TRANSITION",
        )
