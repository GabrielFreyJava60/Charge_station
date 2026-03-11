from typing import TypedDict, Literal, Optional
from datetime import datetime

class UserInstance(TypedDict):
    user_id: str
    username: str
    email: str
    phone: Optional[str]
    role: Literal["USER", "ADMIN", "TECH_SUPPORT"]
    status: Literal["ACTIVE", "BLOCKED", "INACTIVE", "DISABLED"]
    created_at: datetime
    updated_at: Optional[datetime]