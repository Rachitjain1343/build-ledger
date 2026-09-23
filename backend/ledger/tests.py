import json
from django.test import Client, TestCase


class ApiFlowTest(TestCase):
    def post(self, client, path, data):
        return client.post(path, data=json.dumps(data), content_type="application/json", HTTP_X_CSRFTOKEN=client.cookies.get("csrftoken").value)

    def patch(self, client, path, data):
        return client.patch(path, data=json.dumps(data), content_type="application/json", HTTP_X_CSRFTOKEN=client.cookies.get("csrftoken").value)

    def delete(self, client, path):
        return client.delete(path, HTTP_X_CSRFTOKEN=client.cookies.get("csrftoken").value)

    def register(self, name):
        client = Client(enforce_csrf_checks=True)
        client.get("/api/me")
        result = self.post(client, "/api/auth/register", {"name": name, "email": f"{name.lower()}@example.com", "password": "secure-pass"})
        self.assertEqual(result.status_code, 201)
        return client, result.json()["user"]

    def test_account_project_and_expense_flow(self):
        first = Client(enforce_csrf_checks=True)
        second = Client(enforce_csrf_checks=True)
        self.assertEqual(first.get("/api/me").status_code, 401)
        registered = self.post(first, "/api/auth/register", {"name": "Asha", "email": "asha@example.com", "password": "secure-pass"})
        self.assertEqual(registered.status_code, 201)
        self.assertEqual(self.post(first, "/api/auth/register", {"name": "Again", "email": "asha@example.com", "password": "secure-pass"}).status_code, 409)
        seeded = first.get("/api/projects").json()["projects"]
        self.assertEqual(len(seeded), 3)
        self.assertEqual(second.get("/api/projects").status_code, 401)
        created = self.post(first, "/api/projects", {"name": "New site", "initialBudget": 1000, "budget": 2000, "contractors": 2})
        self.assertEqual(created.status_code, 201)
        project_id = created.json()["project"]["id"]
        added = self.post(first, f"/api/projects/{project_id}/expenses", {"stage": "Paint", "category": "Finishing", "materialCost": 300, "laborCost": 200, "status": "Completed"})
        self.assertEqual(added.status_code, 201)
        self.assertEqual(len(first.get("/api/projects").json()["projects"][project_id]["stageCosts"]), 1)
        self.assertEqual(self.post(first, "/api/auth/logout", {}).status_code, 200)
        self.assertEqual(first.get("/api/projects").status_code, 401)
        self.assertEqual(self.post(first, "/api/auth/login", {"email": "asha@example.com", "password": "wrong"}).status_code, 401)
        self.assertEqual(self.post(first, "/api/auth/login", {"email": "asha@example.com", "password": "secure-pass"}).status_code, 200)
        self.assertIn(project_id, first.get("/api/projects").json()["projects"])
        second.get("/api/me")
        self.post(second, "/api/auth/register", {"name": "Ravi", "email": "ravi@example.com", "password": "secure-pass"})
        self.assertEqual(self.post(second, f"/api/projects/{project_id}/expenses", {"stage": "X", "category": "Y", "materialCost": 1, "laborCost": 1}).status_code, 404)

    def test_csrf_required(self):
        client = Client(enforce_csrf_checks=True)
        client.get("/api/me")
        response = client.post("/api/auth/register", data=json.dumps({"name": "Asha", "email": "asha@example.com", "password": "secure-pass"}), content_type="application/json")
        self.assertEqual(response.status_code, 403)

    def test_project_roles_and_updates(self):
        owner, owner_user = self.register("Owner")
        manager, manager_user = self.register("Manager")
        viewer, viewer_user = self.register("Viewer")
        created = self.post(owner, "/api/projects", {"name": "Shared site", "initialBudget": 1000, "budget": 2000, "contractors": 1})
        project_id = created.json()["project"]["id"]
        base = f"/api/projects/{project_id}"
        self.assertEqual(self.post(owner, f"{base}/members", {"email": manager_user["email"], "role": "manager"}).status_code, 201)
        self.assertEqual(self.post(owner, f"{base}/members", {"email": viewer_user["email"], "role": "viewer"}).status_code, 201)
        self.assertEqual(manager.get("/api/projects").json()["projects"][project_id]["role"], "manager")
        self.assertEqual(viewer.get("/api/projects").json()["projects"][project_id]["role"], "viewer")
        changed = self.patch(manager, base, {"budget": 3000, "contractors": 2})
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(changed.json()["project"]["budget"], 3000)
        added = self.post(manager, f"{base}/expenses", {"stage": "Paint", "category": "Finishing", "materialCost": 300, "laborCost": 200})
        self.assertEqual(added.status_code, 201)
        expense_id = added.json()["project"]["stageCosts"][0]["id"]
        self.assertEqual(self.patch(manager, f"{base}/expenses/{expense_id}", {"laborCost": 400}).status_code, 200)
        self.assertEqual(self.patch(viewer, base, {"budget": 9000}).status_code, 403)
        self.assertEqual(self.post(viewer, f"{base}/expenses", {"stage": "X", "category": "Y", "materialCost": 1, "laborCost": 1}).status_code, 403)
        self.assertEqual(self.patch(viewer, f"{base}/expenses/{expense_id}", {"laborCost": 1}).status_code, 403)
        self.assertEqual(self.post(manager, f"{base}/members", {"email": owner_user["email"], "role": "manager"}).status_code, 403)
        self.assertEqual(self.patch(owner, f"{base}/members/{manager_user['id']}", {"role": "viewer"}).status_code, 200)
        self.assertEqual(self.patch(manager, base, {"budget": 5000}).status_code, 403)
        self.assertEqual(self.delete(owner, f"{base}/members/{viewer_user['id']}").status_code, 200)
        self.assertNotIn(project_id, viewer.get("/api/projects").json()["projects"])
        self.assertEqual(viewer.get(f"{base}/members").status_code, 404)
