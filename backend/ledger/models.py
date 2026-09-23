import uuid
from django.conf import settings
from django.db import models


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=120)
    initial_budget = models.DecimalField(max_digits=15, decimal_places=2)
    budget = models.DecimalField(max_digits=15, decimal_places=2)
    contractors = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=8, default="Lakhs")


class ProjectMember(models.Model):
    ROLE_CHOICES = [("manager", "Manager"), ("viewer", "Viewer")]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_memberships")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["project", "user"], name="unique_project_member")]


class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="expenses")
    stage = models.CharField(max_length=120)
    category = models.CharField(max_length=80)
    material_cost = models.DecimalField(max_digits=15, decimal_places=2)
    labor_cost = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, default="In Progress")


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="payments")
    item = models.CharField(max_length=120)
    vendor = models.CharField(max_length=120)
    total = models.CharField(max_length=40)
    advance_paid = models.CharField(max_length=40)
    balance_due = models.CharField(max_length=40)
    due_date = models.CharField(max_length=60)
