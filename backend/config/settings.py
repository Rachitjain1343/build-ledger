import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR.parent / ".env"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SECRET_KEY = os.environ.get("BUILDLEDGER_SECRET_KEY", "development-only-change-before-deploying")
DEBUG = os.environ.get("BUILDLEDGER_DEBUG", "1") == "1"
if not DEBUG and "BUILDLEDGER_SECRET_KEY" not in os.environ:
    raise RuntimeError("Set BUILDLEDGER_SECRET_KEY when BUILDLEDGER_DEBUG=0.")
ALLOWED_HOSTS = os.environ.get("BUILDLEDGER_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")
CSRF_TRUSTED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
INSTALLED_APPS = ["ledger"]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = []
WSGI_APPLICATION = "config.wsgi.application"
DATABASES = {"default": {"ENGINE": "django.db.backends.dummy"}}
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG
SESSION_ENGINE = "django.contrib.sessions.backends.file"
SESSION_FILE_PATH = BASE_DIR / ".sessions"
SESSION_FILE_PATH.mkdir(parents=True, exist_ok=True)
CSRF_COOKIE_SAMESITE = "Lax"
