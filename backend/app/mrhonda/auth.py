from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

from fastapi import Header, HTTPException

from . import storage

TOKEN_SCOPE = "mrhonda"
TOKEN_TTL_SECONDS = 60 * 60 * 12
PBKDF2_ROUNDS = 120_000
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 60 * 15

INVALID_SESSION = "Session invalide ou expirée"

_login_attempts: dict[str, list[float]] = {}


def secret_key() -> str:
    explicit = os.getenv("MRHONDA_TOKEN_SECRET")
    if explicit:
        return explicit
    shared = os.getenv("ADMIN_TOKEN_SECRET") or "mrhonda-dev-secret-change-me"
    # Dérivation : sans variable dédiée, on ne réutilise jamais le secret de
    # generalpolstermoebel tel quel. Ses jetons et les nôtres restent ainsi
    # mutuellement invalides, même quand une seule variable est configurée.
    return hmac.new(shared.encode(), b"mrhonda-token-v1", hashlib.sha256).hexdigest()


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ROUNDS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    if not stored or "$" not in stored:
        return False
    salt = stored.split("$", 1)[0]
    return hmac.compare_digest(password_hash(password, salt), stored)


def sign_token(email: str, now: float | None = None) -> str:
    issued = time.time() if now is None else now
    payload = {
        "email": email.lower(),
        "scope": TOKEN_SCOPE,
        "exp": int(issued + TOKEN_TTL_SECONDS),
    }
    raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(secret_key().encode(), raw.encode(), hashlib.sha256).hexdigest()
    return f"{raw}.{signature}"


def verify_token(token: str) -> str:
    if not token or "." not in token:
        raise HTTPException(status_code=401, detail=INVALID_SESSION)
    raw, signature = token.rsplit(".", 1)
    expected = hmac.new(secret_key().encode(), raw.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail=INVALID_SESSION)
    try:
        payload: Any = json.loads(base64.urlsafe_b64decode(raw.encode()))
        if not isinstance(payload, dict):
            raise ValueError("Charge utile invalide")
        if payload.get("scope") != TOKEN_SCOPE:
            raise ValueError("Portée invalide")
        if int(payload.get("exp", 0)) < time.time():
            raise ValueError("Jeton expiré")
    except Exception as exc:
        raise HTTPException(status_code=401, detail=INVALID_SESSION) from exc
    return str(payload.get("email", "")).lower()


def _recent_attempts(email: str, moment: float) -> list[float]:
    kept = [t for t in _login_attempts.get(email, []) if moment - t < LOGIN_WINDOW_SECONDS]
    _login_attempts[email] = kept
    return kept


def register_failed_login(email: str, now: float | None = None) -> None:
    moment = time.time() if now is None else now
    key = email.lower()
    attempts = _recent_attempts(key, time.time())
    attempts.append(moment)
    _login_attempts[key] = attempts


def clear_failed_logins(email: str) -> None:
    _login_attempts.pop(email.lower(), None)


def login_blocked(email: str, now: float | None = None) -> bool:
    moment = time.time() if now is None else now
    return len(_recent_attempts(email.lower(), moment)) >= MAX_LOGIN_ATTEMPTS


def require_mrhonda_admin(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentification requise")
    email = verify_token(authorization.removeprefix("Bearer ").strip())
    if not storage.get_admin(email):
        raise HTTPException(status_code=401, detail="Administrateur introuvable")
    return email
