from typing import TypedDict, Optional, Literal

class get_user_info_payload(TypedDict):
    action: Literal["get_user_by_id", "get_all_users"]
    caller_id: str
    user_id: Optional[str]

class modify_user_group_payload(TypedDict):
    action: Literal["move_user_to_group", "remove_user_from_group"]
    caller_id: str
    user_email: str
    group_name: Literal["ADMIN", "TECH_SUPPORT"]
    user_pool_id: str