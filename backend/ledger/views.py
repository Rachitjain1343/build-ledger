import json
import mimetypes
import uuid
from decimal import Decimal, InvalidOperation
from functools import wraps

from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from .supabase import SupabaseError, auth, rows


def fail(message, status=400):
    return JsonResponse({"error": message}, status=status)


def safe(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        try:
            return view(request, *args, **kwargs)
        except SupabaseError as error:
            return fail(str(error), error.status if error.status in {400, 401, 403, 404, 409, 422, 429, 503} else 502)
    return wrapped


def json_body(request):
    try:
        data = json.loads(request.body or b"{}")
        return data if isinstance(data, dict) else {}
    except (ValueError, UnicodeDecodeError):
        return {}


def require_method(request, *methods):
    return None if request.method in methods else fail("Method not allowed.", 405)


def remember_session(request, session):
    request.session["supabase_access_token"] = session["access_token"]
    request.session["supabase_refresh_token"] = session["refresh_token"]


def current_user(request):
    token = request.session.get("supabase_access_token")
    if not token:
        return None, None
    try:
        return auth("user", token=token), token
    except SupabaseError as error:
        if error.status != 401:
            raise
    refresh = request.session.get("supabase_refresh_token")
    if not refresh:
        request.session.flush()
        return None, None
    try:
        session = auth("token?grant_type=refresh_token", method="POST", data={"refresh_token": refresh})
        remember_session(request, session)
        token = session["access_token"]
        return auth("user", token=token), token
    except SupabaseError:
        request.session.flush()
        return None, None


def authenticated(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        user, token = current_user(request)
        if user is None:
            return fail("Please sign in.", 401)
        request.supabase_user = user
        request.supabase_token = token
        return view(request, *args, **kwargs)
    return wrapped


def user_payload(user):
    metadata = user.get("user_metadata") or {}
    email = user.get("email") or ""
    return {"id": user.get("id"), "name": metadata.get("name") or metadata.get("first_name") or email.split("@")[0], "email": email}


def amount(value, label):
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise ValueError(f"{label} must be a number.") from None
    if not result.is_finite() or not 0 <= result <= 1_000_000_000_000:
        raise ValueError(f"{label} must be between 0 and 1 trillion.")
    return result.quantize(Decimal("0.01"))


def money(value, unit):
    value = Decimal(str(value))
    divisor = Decimal("10000000") if unit == "Cr" else Decimal("100000")
    if abs(value) < divisor:
        return f"₹{value:,.2f}"
    return f"₹{value / divisor:.2f} {unit}"


def project_role(project, members, user):
    if project["owner_id"] == user["id"]:
        return "owner"
    return next((member["role"] for member in members if member["project_id"] == project["id"] and member["user_id"] == user["id"]), None)


def project_payload(project, role, expenses, payments):
    project_expenses = [row for row in expenses if row["project_id"] == project["id"]]
    project_payments = [row for row in payments if row["project_id"] == project["id"]]
    budget = Decimal(str(project["budget"]))
    spent = sum((Decimal(str(row["material_cost"])) + Decimal(str(row["labor_cost"])) for row in project_expenses), Decimal(0))
    unit = project.get("unit") or "Lakhs"
    divisor = Decimal("10000000") if unit == "Cr" else Decimal("100000")
    chart = [{"stage": "Start", "DesignerBudget": 0, "ActualSpent": 0}]
    running = Decimal(0)
    for index, row in enumerate(project_expenses, 1):
        running += Decimal(str(row["material_cost"])) + Decimal(str(row["labor_cost"]))
        chart.append({"stage": row["stage"], "DesignerBudget": round(float(budget * index / len(project_expenses) / divisor), 2), "ActualSpent": round(float(running / divisor), 2)})
    remaining = max(budget - spent, Decimal(0))
    return {
        "id": project["id"], "name": project["name"], "role": role, "unit": unit,
        "initialBudget": float(project["initial_budget"]), "budget": float(budget),
        "contractors": project["contractors"],
        "initialEstimate": money(project["initial_budget"], unit),
        "revisedDesignerBudget": money(budget, unit),
        "totalSpentToDate": money(spent, unit),
        "remainingBudget": money(budget - spent, unit),
        "activeContractors": f"{project['contractors']} Teams",
        "statusBadge": "Over Budget" if spent > budget else "On Track",
        "chartData": chart,
        "costStatus": [
            {"name": "Spent to Date", "value": round(float(spent / divisor), 2), "percentage": f"{round(spent / budget * 100) if budget else 0}%", "color": "#2563EB"},
            {"name": "Remaining Balance", "value": round(float(remaining / divisor), 2), "percentage": f"{round(remaining / budget * 100) if budget else 0}%", "color": "#10B981"},
        ],
        "stageCosts": [{"id": row["id"], "stage": row["stage"], "category": row["category"],
                        "materialCost": float(row["material_cost"]), "laborCost": float(row["labor_cost"]),
                        "totalCost": float(Decimal(str(row["material_cost"])) + Decimal(str(row["labor_cost"]))),
                        "status": row["status"]} for row in project_expenses],
        "upcomingPayments": [{"item": row["item"], "vendor": row["vendor"], "total": row["total"],
                              "advancePaid": row["advance_paid"], "balanceDue": row["balance_due"],
                              "dueDate": row["due_date"]} for row in project_payments],
    }


def fetch_project_data(token, project_ids):
    if not project_ids:
        return [], [], []
    filter_value = "in.(" + ",".join(project_ids) + ")"
    members = rows("project_members", token=token, params={"select": "*", "project_id": filter_value})
    expenses = rows("expenses", token=token, params={"select": "*", "project_id": filter_value, "order": "created_at.asc"})
    payments = rows("payments", token=token, params={"select": "*", "project_id": filter_value, "order": "created_at.asc"})
    return members, expenses, payments


def load_project(request, project_id):
    try:
        project_id = str(uuid.UUID(project_id))
    except ValueError:
        return None, None
    found = rows("projects", token=request.supabase_token, params={"select": "*", "id": "eq." + project_id})
    if not found:
        return None, None
    project = found[0]
    members = rows("project_members", token=request.supabase_token, params={"select": "*", "project_id": "eq." + project_id})
    return project, project_role(project, members, request.supabase_user)


def detail_payload(request, project, role):
    _, expenses, payments = fetch_project_data(request.supabase_token, [project["id"]])
    return project_payload(project, role, expenses, payments)


@safe
def register(request):
    if (bad := require_method(request, "POST")):
        return bad
    data = json_body(request)
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not name or len(name) > 100 or "@" not in email or len(email) > 254 or len(password) < 8:
        return fail("Enter a name, valid email, and password of at least 8 characters.")
    result = auth("signup", method="POST", data={"email": email, "password": password, "data": {"name": name}})
    if result.get("access_token") and result.get("refresh_token"):
        request.session.flush()
        remember_session(request, result)
        return JsonResponse({"user": user_payload(result["user"])}, status=201)
    return JsonResponse({"confirmationRequired": True, "message": "Check your email to confirm the account, then log in."}, status=201)


@safe
def sign_in(request):
    if (bad := require_method(request, "POST")):
        return bad
    data = json_body(request)
    result = auth("token?grant_type=password", method="POST", data={"email": str(data.get("email", "")).strip().lower(), "password": str(data.get("password", ""))})
    request.session.flush()
    remember_session(request, result)
    return JsonResponse({"user": user_payload(result["user"])})


@safe
def sign_out(request):
    if (bad := require_method(request, "POST")):
        return bad
    token = request.session.get("supabase_access_token")
    if token:
        try:
            auth("logout", method="POST", token=token)
        except SupabaseError:
            pass
    request.session.flush()
    return JsonResponse({"ok": True})


@ensure_csrf_cookie
@safe
@authenticated
def me(request):
    if (bad := require_method(request, "GET")):
        return bad
    return JsonResponse({"user": user_payload(request.supabase_user)})


@safe
@authenticated
def projects(request):
    if request.method == "GET":
        found = rows("projects", token=request.supabase_token, params={"select": "*", "order": "created_at.asc"})
        members, expenses, payments = fetch_project_data(request.supabase_token, [project["id"] for project in found])
        return JsonResponse({"projects": {project["id"]: project_payload(project, project_role(project, members, request.supabase_user), expenses, payments) for project in found}})
    if (bad := require_method(request, "POST")):
        return bad
    data = json_body(request)
    name = str(data.get("name", "")).strip()
    if not name or len(name) > 120:
        return fail("Project name is required (up to 120 characters).")
    try:
        initial = amount(data.get("initialBudget"), "Initial budget")
        budget = amount(data.get("budget"), "Budget")
        contractors = int(data.get("contractors", 0))
        if not 0 <= contractors <= 10000:
            raise ValueError("Contractors must be between 0 and 10,000.")
    except (ValueError, TypeError) as error:
        return fail(str(error))
    user = request.supabase_user
    record = {"owner_id": user["id"], "owner_email": user["email"].lower(), "name": name,
              "initial_budget": str(initial), "budget": str(budget), "contractors": contractors, "unit": "Lakhs"}
    created = rows("projects", token=request.supabase_token, method="POST", data=record)[0]
    return JsonResponse({"project": project_payload(created, "owner", [], [])}, status=201)


@safe
@authenticated
def project_detail(request, project_id):
    if (bad := require_method(request, "PATCH")):
        return bad
    project, role = load_project(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if role not in {"owner", "manager"}:
        return fail("Your role cannot update this project.", 403)
    data = json_body(request)
    name = str(data.get("name", project["name"])).strip()
    if not name or len(name) > 120:
        return fail("Project name is required (up to 120 characters).")
    try:
        initial = amount(data.get("initialBudget", project["initial_budget"]), "Initial budget")
        budget = amount(data.get("budget", project["budget"]), "Budget")
        contractors = int(data.get("contractors", project["contractors"]))
        if not 0 <= contractors <= 10000:
            raise ValueError("Contractors must be between 0 and 10,000.")
    except (ValueError, TypeError) as error:
        return fail(str(error))
    updated = rows("projects", token=request.supabase_token, method="PATCH", params={"id": "eq." + project["id"]},
                   data={"name": name, "initial_budget": str(initial), "budget": str(budget), "contractors": contractors})
    if not updated:
        return fail("Project update was not permitted.", 403)
    return JsonResponse({"project": detail_payload(request, updated[0], role)})


def member_payload(project, members):
    result = [{"id": project["owner_id"], "name": project["owner_email"].split("@")[0],
               "email": project["owner_email"], "role": "owner"}]
    return result + [{"id": member["id"], "name": member["name"],
                      "email": member["email"], "role": member["role"]} for member in members]


@safe
@authenticated
def members(request, project_id):
    project, role = load_project(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if request.method == "GET":
        found = rows("project_members", token=request.supabase_token, params={"select": "*", "project_id": "eq." + project["id"]})
        return JsonResponse({"members": member_payload(project, found)})
    if (bad := require_method(request, "POST")):
        return bad
    if role != "owner":
        return fail("Only the project owner can manage roles.", 403)
    data = json_body(request)
    email = str(data.get("email", "")).strip().lower()
    new_role = str(data.get("role", ""))
    if "@" not in email or len(email) > 254 or new_role not in {"manager", "viewer"}:
        return fail("Enter an email and choose manager or viewer.")
    if email == project["owner_email"]:
        return fail("The owner already has access.")
    rows("rpc/add_project_member", token=request.supabase_token, method="POST",
         data={"project_uuid": project["id"], "member_email": email, "member_role": new_role})
    found = rows("project_members", token=request.supabase_token, params={"select": "*", "project_id": "eq." + project["id"]})
    return JsonResponse({"members": member_payload(project, found)}, status=201)


@safe
@authenticated
def member_detail(request, project_id, user_id):
    project, role = load_project(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if role != "owner":
        return fail("Only the project owner can manage roles.", 403)
    try:
        member_id = str(uuid.UUID(user_id))
    except ValueError:
        return fail("Member not found.", 404)
    params = {"id": "eq." + member_id, "project_id": "eq." + project["id"]}
    found = rows("project_members", token=request.supabase_token, params={"select": "id", **params})
    if not found:
        return fail("Member not found.", 404)
    if request.method == "PATCH":
        new_role = str(json_body(request).get("role", ""))
        if new_role not in {"manager", "viewer"}:
            return fail("Choose manager or viewer.")
        rows("project_members", token=request.supabase_token, method="PATCH", params=params, data={"role": new_role})
    elif request.method == "DELETE":
        rows("project_members", token=request.supabase_token, method="DELETE", params=params)
    else:
        return fail("Method not allowed.", 405)
    remaining = rows("project_members", token=request.supabase_token, params={"select": "*", "project_id": "eq." + project["id"]})
    return JsonResponse({"members": member_payload(project, remaining)})


def expense_input(data, existing=None):
    existing = existing or {}
    stage = str(data.get("stage", existing.get("stage", ""))).strip()
    category = str(data.get("category", existing.get("category", ""))).strip()
    status = str(data.get("status", existing.get("status", "In Progress")))
    if not stage or not category or len(stage) > 120 or len(category) > 80:
        raise ValueError("Stage and category are required.")
    if status not in {"Completed", "In Progress", "Over Budget"}:
        raise ValueError("Invalid status.")
    material = amount(data.get("materialCost", existing.get("material_cost")), "Material cost")
    labor = amount(data.get("laborCost", existing.get("labor_cost")), "Labor cost")
    return {"stage": stage, "category": category, "status": status,
            "material_cost": str(material), "labor_cost": str(labor)}


@safe
@authenticated
def expenses(request, project_id):
    if (bad := require_method(request, "POST")):
        return bad
    project, role = load_project(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if role not in {"owner", "manager"}:
        return fail("Your role cannot update expenses.", 403)
    try:
        data = expense_input(json_body(request))
    except ValueError as error:
        return fail(str(error))
    rows("expenses", token=request.supabase_token, method="POST", data={"project_id": project["id"], **data})
    return JsonResponse({"project": detail_payload(request, project, role)}, status=201)


@safe
@authenticated
def expense_detail(request, project_id, expense_id):
    if (bad := require_method(request, "PATCH")):
        return bad
    project, role = load_project(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if role not in {"owner", "manager"}:
        return fail("Your role cannot update expenses.", 403)
    try:
        expense_id = str(uuid.UUID(expense_id))
    except ValueError:
        return fail("Expense not found.", 404)
    params = {"id": "eq." + expense_id, "project_id": "eq." + project["id"]}
    found = rows("expenses", token=request.supabase_token, params={"select": "*", **params})
    if not found:
        return fail("Expense not found.", 404)
    try:
        data = expense_input(json_body(request), found[0])
    except ValueError as error:
        return fail(str(error))
    rows("expenses", token=request.supabase_token, method="PATCH", params=params, data=data)
    return JsonResponse({"project": detail_payload(request, project, role)})


def health(request):
    return JsonResponse({"status": "ok", "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY)})


def frontend(request, path=""):
    if path.startswith("api/"):
        return fail("Not found.", 404)
    dist = settings.BASE_DIR.parent / "dist"
    target = (dist / path).resolve() if path else dist / "index.html"
    if not target.is_relative_to(dist.resolve()):
        return fail("Not found.", 404)
    if not target.is_file():
        target = dist / "index.html"
    if not target.is_file():
        return fail("Frontend build missing. Run npm run build.", 404)
    content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    return FileResponse(target.open("rb"), content_type=content_type)
