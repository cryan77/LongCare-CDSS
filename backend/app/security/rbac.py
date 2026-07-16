from fastapi import Depends, HTTPException, status

from app.database.models import User
from app.security.auth import get_current_user


def require_roles(*roles: str):
    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(roles)}",
            )
        return current_user

    return _checker


# Common role groups
require_clinician = require_roles("doctor", "nurse", "admin")
require_doctor = require_roles("doctor", "admin")
require_admin = require_roles("admin")
