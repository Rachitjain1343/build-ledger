"""Small Supabase Auth/PostgREST client using each user's JWT and RLS."""

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


class SupabaseError(Exception):
    def __init__(self, status, message, code=None):
        super().__init__(message)
        self.status = status
        self.code = code


def call(path, *, method="GET", token=None, params=None, data=None, return_rows=False):
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise SupabaseError(503, "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.")
    url = settings.SUPABASE_URL + path
    if params:
        url += "?" + urlencode(params)
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + (token or settings.SUPABASE_ANON_KEY),
        "Accept": "application/json",
    }
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if return_rows:
        headers["Prefer"] = "return=representation"
    request = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=15) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except HTTPError as error:
        try:
            detail = json.loads(error.read())
        except (ValueError, UnicodeDecodeError):
            detail = {}
        code = detail.get("code") or detail.get("error_code")
        message = detail.get("msg") or detail.get("message") or detail.get("error_description") or detail.get("error") or "Supabase request failed."
        if code == "PGRST205":
            message = "Supabase tables are missing. Run supabase/schema.sql in the SQL editor."
        raise SupabaseError(error.code, message, code) from None
    except (URLError, TimeoutError):
        raise SupabaseError(503, "Cannot reach Supabase right now.") from None


def auth(path, *, method="GET", token=None, data=None):
    return call("/auth/v1/" + path, method=method, token=token, data=data)


def rows(table, *, token, params=None, method="GET", data=None):
    return call("/rest/v1/" + table, token=token, params=params,
                method=method, data=data, return_rows=method in {"POST", "PATCH"})
