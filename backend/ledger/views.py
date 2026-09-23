import json
import mimetypes
import uuid
from decimal import Decimal, InvalidOperation
from functools import wraps
from pathlib import Path

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import FileResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Expense, Payment, Project, ProjectMember


def fail(message, status=400):
    return JsonResponse({"error": message}, status=status)


def json_body(request):
    try:
        data = json.loads(request.body or b"{}")
        return data if isinstance(data, dict) else {}
    except (ValueError, UnicodeDecodeError):
        return {}


def required_user(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return fail("Please sign in.", 401)
        return view(request, *args, **kwargs)
    return wrapped


def require_method(request, method):
    return None if request.method == method else fail("Method not allowed.", 405)


def amount(value, label):
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise ValueError(f"{label} must be a number.") from None
    if not result.is_finite() or not 0 <= result <= 1_000_000_000_000:
        raise ValueError(f"{label} must be between 0 and 1 trillion.")
    return result.quantize(Decimal("0.01"))


def money(value, unit):
    divisor = Decimal("10000000") if unit == "Cr" else Decimal("100000")
    return f"₹{value / divisor:.2f} {unit}"


def payload(project, role="owner"):
    rows = list(project.expenses.all())
    payments = list(project.payments.all())
    spent = sum((row.material_cost + row.labor_cost for row in rows), Decimal("0"))
    divisor = Decimal("10000000") if project.unit == "Cr" else Decimal("100000")
    chart = [{"stage": "Start", "DesignerBudget": 0, "ActualSpent": 0}]
    running = Decimal("0")
    for index, row in enumerate(rows, 1):
        running += row.material_cost + row.labor_cost
        chart.append({"stage": row.stage, "DesignerBudget": round(float(project.budget * index / max(len(rows), 1) / divisor), 2), "ActualSpent": round(float(running / divisor), 2)})
    remaining = max(project.budget - spent, Decimal("0"))
    status = "Over Budget" if spent > project.budget else "On Track"
    return {
        "id": str(project.id), "name": project.name, "unit": project.unit, "role": role,
        "initialBudget": float(project.initial_budget), "budget": float(project.budget),
        "contractors": project.contractors,
        "initialEstimate": money(project.initial_budget, project.unit),
        "revisedDesignerBudget": money(project.budget, project.unit),
        "totalSpentToDate": money(spent, project.unit),
        "remainingBudget": money(project.budget - spent, project.unit),
        "activeContractors": f"{project.contractors} Teams", "statusBadge": status,
        "chartData": chart,
        "costStatus": [
            {"name": "Spent to Date", "value": round(float(spent / divisor), 2), "percentage": f"{round(spent / project.budget * 100) if project.budget else 0}%", "color": "#2563EB"},
            {"name": "Remaining Balance", "value": round(float(remaining / divisor), 2), "percentage": f"{round(remaining / project.budget * 100) if project.budget else 0}%", "color": "#10B981"},
        ],
        "stageCosts": [{"id": str(row.id), "stage": row.stage, "category": row.category,
                        "materialCost": float(row.material_cost), "laborCost": float(row.labor_cost),
                        "totalCost": float(row.material_cost + row.labor_cost), "status": row.status} for row in rows],
        "upcomingPayments": [{"item": row.item, "vendor": row.vendor, "total": row.total,
                              "advancePaid": row.advance_paid, "balanceDue": row.balance_due,
                              "dueDate": row.due_date} for row in payments],
    }


def seed_projects(user):
    examples = json.loads((settings.BASE_DIR / "demo_projects.json").read_text(encoding="utf-8"))

    def parse_money(value):
        number = Decimal(value.replace("₹", "").replace(",", "").split()[0])
        return number * (10000000 if "Cr" in value else 100000)

    for item in examples.values():
        project = Project.objects.create(
            user=user, name=item["name"], initial_budget=parse_money(item["initialEstimate"]),
            budget=parse_money(item["revisedDesignerBudget"]),
            contractors=int(item["activeContractors"].split()[0]),
            unit="Cr" if "Cr" in item["revisedDesignerBudget"] else "Lakhs",
        )
        Expense.objects.bulk_create([
            Expense(project=project, stage=row["stage"], category=row["category"],
                    material_cost=row["materialCost"], labor_cost=row["laborCost"], status=row["status"])
            for row in item["stageCosts"]
        ])
        Payment.objects.bulk_create([
            Payment(project=project, item=row["item"], vendor=row["vendor"], total=row["total"],
                    advance_paid=row["advancePaid"], balance_due=row["balanceDue"], due_date=row["dueDate"])
            for row in item["upcomingPayments"]
        ])


def user_payload(user):
    return {"id": user.pk, "name": user.first_name, "email": user.email}


def project_access(request, project_id):
    try:
        parsed_id = uuid.UUID(project_id)
    except ValueError:
        return None, None
    project = Project.objects.filter(id=parsed_id).first()
    if project is None:
        return None, None
    if project.user_id == request.user.pk:
        return project, "owner"
    membership = ProjectMember.objects.filter(project=project, user=request.user).first()
    if membership:
        return project, membership.role
    return None, None


def editable(role):
    return role in {"owner", "manager"}


def register(request):
    if (bad := require_method(request, "POST")):
        return bad
    data = json_body(request)
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not name or len(name) > 100 or "@" not in email or len(email) > 254 or len(password) < 8:
        return fail("Enter a name, valid email, and password of at least 8 characters.")
    try:
        with transaction.atomic():
            user = get_user_model().objects.create_user(username=email, email=email, first_name=name, password=password)
            seed_projects(user)
    except IntegrityError:
        return fail("An account with this email already exists.", 409)
    login(request, user)
    return JsonResponse({"user": user_payload(user)}, status=201)


def sign_in(request):
    if (bad := require_method(request, "POST")):
        return bad
    data = json_body(request)
    user = authenticate(request, username=str(data.get("email", "")).strip().lower(), password=str(data.get("password", "")))
    if user is None:
        return fail("Incorrect email or password.", 401)
    login(request, user)
    return JsonResponse({"user": user_payload(user)})


def sign_out(request):
    if (bad := require_method(request, "POST")):
        return bad
    logout(request)
    return JsonResponse({"ok": True})


@ensure_csrf_cookie
def me(request):
    if (bad := require_method(request, "GET")):
        return bad
    if not request.user.is_authenticated:
        return fail("Please sign in.", 401)
    return JsonResponse({"user": user_payload(request.user)})


@required_user
def projects(request):
    if request.method == "GET":
        records = Project.objects.filter(Q(user=request.user) | Q(members__user=request.user)).distinct().prefetch_related("expenses", "payments", "members")
        result = {}
        for item in records:
            role = "owner" if item.user_id == request.user.pk else next(member.role for member in item.members.all() if member.user_id == request.user.pk)
            result[str(item.id)] = payload(item, role)
        return JsonResponse({"projects": result})
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
    except (ValueError, TypeError) as exc:
        return fail(str(exc))
    project = Project.objects.create(user=request.user, name=name, initial_budget=initial,
                                     budget=budget, contractors=contractors)
    return JsonResponse({"project": payload(project)}, status=201)


@required_user
def project_detail(request, project_id):
    if (bad := require_method(request, "PATCH")):
        return bad
    project, role = project_access(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if not editable(role):
        return fail("Your role cannot update this project.", 403)
    data = json_body(request)
    name = str(data.get("name", project.name)).strip()
    if not name or len(name) > 120:
        return fail("Project name is required (up to 120 characters).")
    try:
        initial = amount(data.get("initialBudget", project.initial_budget), "Initial budget")
        budget = amount(data.get("budget", project.budget), "Budget")
        contractors = int(data.get("contractors", project.contractors))
        if not 0 <= contractors <= 10000:
            raise ValueError("Contractors must be between 0 and 10,000.")
    except (ValueError, TypeError) as exc:
        return fail(str(exc))
    project.name = name
    project.initial_budget = initial
    project.budget = budget
    project.contractors = contractors
    project.save(update_fields=["name", "initial_budget", "budget", "contractors"])
    return JsonResponse({"project": payload(project, role)})


def member_payload(project):
    owner = project.user
    result = [{"id": owner.pk, "name": owner.first_name, "email": owner.email, "role": "owner"}]
    for member in project.members.select_related("user").all():
        result.append({"id": member.user_id, "name": member.user.first_name,
                       "email": member.user.email, "role": member.role})
    return result


@required_user
def members(request, project_id):
    project, role = project_access(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if request.method == "GET":
        return JsonResponse({"members": member_payload(project)})
    if (bad := require_method(request, "POST")):
        return bad
    if role != "owner":
        return fail("Only the project owner can manage roles.", 403)
    data = json_body(request)
    email = str(data.get("email", "")).strip().lower()
    new_role = str(data.get("role", ""))
    if new_role not in {"manager", "viewer"}:
        return fail("Choose manager or viewer.")
    user = get_user_model().objects.filter(username=email).first()
    if user is None:
        return fail("No registered user has that email.", 404)
    if user.pk == project.user_id:
        return fail("The owner already has access.")
    try:
        ProjectMember.objects.create(project=project, user=user, role=new_role)
    except IntegrityError:
        return fail("That user already has access.", 409)
    return JsonResponse({"members": member_payload(project)}, status=201)


@required_user
def member_detail(request, project_id, user_id):
    project, role = project_access(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if role != "owner":
        return fail("Only the project owner can manage roles.", 403)
    membership = ProjectMember.objects.filter(project=project, user_id=user_id).first()
    if membership is None:
        return fail("Member not found.", 404)
    if request.method == "PATCH":
        new_role = str(json_body(request).get("role", ""))
        if new_role not in {"manager", "viewer"}:
            return fail("Choose manager or viewer.")
        membership.role = new_role
        membership.save(update_fields=["role"])
    elif request.method == "DELETE":
        membership.delete()
    else:
        return fail("Method not allowed.", 405)
    return JsonResponse({"members": member_payload(project)})


@required_user
def expenses(request, project_id):
    if (bad := require_method(request, "POST")):
        return bad
    project, role = project_access(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if not editable(role):
        return fail("Your role cannot update expenses.", 403)
    data = json_body(request)
    stage = str(data.get("stage", "")).strip()
    category = str(data.get("category", "")).strip()
    status = str(data.get("status", "In Progress"))
    if not stage or not category or len(stage) > 120 or len(category) > 80:
        return fail("Stage and category are required.")
    if status not in {"Completed", "In Progress", "Over Budget"}:
        return fail("Invalid status.")
    try:
        material = amount(data.get("materialCost"), "Material cost")
        labor = amount(data.get("laborCost"), "Labor cost")
    except ValueError as exc:
        return fail(str(exc))
    Expense.objects.create(project=project, stage=stage, category=category,
                           material_cost=material, labor_cost=labor, status=status)
    return JsonResponse({"project": payload(project, role)}, status=201)


@required_user
def expense_detail(request, project_id, expense_id):
    if (bad := require_method(request, "PATCH")):
        return bad
    project, role = project_access(request, project_id)
    if project is None:
        return fail("Project not found.", 404)
    if not editable(role):
        return fail("Your role cannot update expenses.", 403)
    try:
        parsed_id = uuid.UUID(expense_id)
    except ValueError:
        return fail("Expense not found.", 404)
    expense = Expense.objects.filter(id=parsed_id, project=project).first()
    if expense is None:
        return fail("Expense not found.", 404)
    data = json_body(request)
    stage = str(data.get("stage", expense.stage)).strip()
    category = str(data.get("category", expense.category)).strip()
    status = str(data.get("status", expense.status))
    if not stage or not category or len(stage) > 120 or len(category) > 80:
        return fail("Stage and category are required.")
    if status not in {"Completed", "In Progress", "Over Budget"}:
        return fail("Invalid status.")
    try:
        material = amount(data.get("materialCost", expense.material_cost), "Material cost")
        labor = amount(data.get("laborCost", expense.labor_cost), "Labor cost")
    except ValueError as exc:
        return fail(str(exc))
    expense.stage, expense.category, expense.status = stage, category, status
    expense.material_cost, expense.labor_cost = material, labor
    expense.save()
    return JsonResponse({"project": payload(project, role)})


def health(request):
    return JsonResponse({"status": "ok"})


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
