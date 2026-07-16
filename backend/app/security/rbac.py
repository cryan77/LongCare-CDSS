from fastapi import Depends, HTTPException, status

from app.database.models import User
from app.security.auth import get_current_user


def require_roles(*roles: str):
    """Strict role check — no admin auto-bypass (per role.md access matrix)."""

    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(roles)}",
            )
        return current_user

    return _checker


# Clinicians: patient care (not admins — they manage systems, not charts)
require_clinician = require_roles("doctor", "nurse")
# Doctors only: AI diagnosis, treatment, imaging, clinical docs
require_doctor = require_roles("doctor")
# Nurses + doctors: vitals / care documentation
require_care_staff = require_roles("doctor", "nurse")
# Platform administrators
require_admin = require_roles("admin")
# Patient portal
require_patient = require_roles("patient")
