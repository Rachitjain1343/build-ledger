import json
from unittest.mock import patch

from django.test import Client, SimpleTestCase

from .views import project_payload


USER = {"id": "00000000-0000-0000-0000-000000000001", "email": "asha@example.com", "user_metadata": {"name": "Asha"}}
PROJECT_ID = "00000000-0000-0000-0000-000000000002"
PROJECT = {"id": PROJECT_ID, "owner_id": USER["id"], "owner_email": USER["email"], "name": "Site",
           "initial_budget": 1000, "budget": 2000, "contractors": 1, "unit": "Lakhs"}


class SupabaseApiTest(SimpleTestCase):
    def post(self, client, path, data):
        return client.post(path, data=json.dumps(data), content_type="application/json",
                           HTTP_X_CSRFTOKEN=client.cookies["csrftoken"].value)

    def test_registration_login_and_confirmation(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.get("/api/me").status_code, 401)
        with patch("ledger.views.auth") as remote:
            remote.return_value = {"user": USER}
            response = self.post(client, "/api/auth/register", {"name": "Asha", "email": USER["email"], "password": "secure-pass"})
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.json()["confirmationRequired"])
            self.assertEqual(client.get("/api/me").status_code, 401)
            remote.side_effect = lambda path, **kwargs: ({"user": USER, "access_token": "access", "refresh_token": "refresh"}
                                                        if path.startswith("token?") else USER)
            response = self.post(client, "/api/auth/login", {"email": USER["email"], "password": "secure-pass"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(client.get("/api/me").json()["user"]["name"], "Asha")
            self.assertEqual(self.post(client, "/api/auth/logout", {}).status_code, 200)
            self.assertEqual(client.get("/api/me").status_code, 401)

    def test_projects_use_remote_rows_and_recalculate_budget(self):
        client = Client(enforce_csrf_checks=True)
        client.get("/api/me")
        session = client.session
        session["supabase_access_token"] = "access"
        session["supabase_refresh_token"] = "refresh"
        session.save()
        expense = {"id": "00000000-0000-0000-0000-000000000003", "project_id": PROJECT_ID, "stage": "Paint",
                   "category": "Finishing", "material_cost": 300, "labor_cost": 200, "status": "Completed"}

        def remote_rows(table, **kwargs):
            if table == "projects":
                return [PROJECT]
            if table == "project_members":
                return []
            if table == "expenses":
                return [expense]
            if table == "payments":
                return []
            raise AssertionError(table)

        with patch("ledger.views.auth", return_value=USER), patch("ledger.views.rows", side_effect=remote_rows):
            response = client.get("/api/projects")
        self.assertEqual(response.status_code, 200)
        project = response.json()["projects"][PROJECT_ID]
        self.assertEqual(project["role"], "owner")
        self.assertEqual(project["totalSpentToDate"], "₹500.00")
        self.assertEqual(project["remainingBudget"], "₹1,500.00")

    def test_viewer_role_is_read_only(self):
        client = Client(enforce_csrf_checks=True)
        client.get("/api/me")
        session = client.session
        session["supabase_access_token"] = "access"
        session.save()
        viewer = {"id": "00000000-0000-0000-0000-000000000004", "email": "viewer@example.com"}
        member = {"id": "00000000-0000-0000-0000-000000000005", "project_id": PROJECT_ID, "user_id": viewer["id"],
                  "email": viewer["email"], "role": "viewer"}
        with patch("ledger.views.auth", return_value=viewer), patch("ledger.views.rows", side_effect=[[PROJECT], [member]]):
            response = client.patch(f"/api/projects/{PROJECT_ID}", data=json.dumps({"budget": 9000}),
                                    content_type="application/json", HTTP_X_CSRFTOKEN=client.cookies["csrftoken"].value)
        self.assertEqual(response.status_code, 403)

    def test_payload_rejects_over_budget_as_on_track(self):
        expense = {"id": "x", "project_id": PROJECT_ID, "stage": "Build", "category": "Civil",
                   "material_cost": 3000, "labor_cost": 200, "status": "Completed"}
        result = project_payload(PROJECT, "owner", [expense], [])
        self.assertEqual(result["statusBadge"], "Over Budget")
        self.assertEqual(result["remainingBudget"], "₹-1,200.00")
