from django.urls import path, re_path
from ledger import views

urlpatterns = [
    path("api/auth/register", views.register),
    path("api/auth/login", views.sign_in),
    path("api/auth/logout", views.sign_out),
    path("api/me", views.me),
    path("api/projects", views.projects),
    path("api/projects/<str:project_id>", views.project_detail),
    path("api/projects/<str:project_id>/members", views.members),
    path("api/projects/<str:project_id>/members/<str:user_id>", views.member_detail),
    path("api/projects/<str:project_id>/expenses", views.expenses),
    path("api/projects/<str:project_id>/expenses/<str:expense_id>", views.expense_detail),
    path("api/health", views.health),
    re_path(r"^(?P<path>.*)$", views.frontend),
]
