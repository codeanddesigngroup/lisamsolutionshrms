# Next.js App Folder Flow and Backend Setup

This file documents `nextjs-ui/src/app` and how it connects to the shared frontend modules and backend API. It is based on the current source tree, not a guessed architecture.

## 1. Main Runtime Flow

1. `src/app/layout.tsx` is the root wrapper for every route.
2. It loads `globals.css`, `NextTopLoader`, `ToastProvider`, and `AuthProvider`.
3. `AuthProvider` reads the saved user and token from `src/lib/session.ts`.
4. `AuthProvider` checks the current route with `src/lib/auth-contract.ts`.
5. If no user is logged in and the route is private, the user is redirected to `/login`.
6. If a logged-in user does not have the role or permission for a route, the user is redirected to `/unauthorized`.
7. Most private pages render inside `DashboardLayout`.
8. `DashboardLayout` renders `Sidebar`, `Navbar`, and the route page content.
9. Pages call `src/lib/api.ts` or `src/lib/api-client.ts` for backend data.
10. `api.ts` adds the bearer token from the `token` cookie and normalizes paths through `src/lib/api-contract.ts`.
11. The backend response updates page state, then the page renders tables, forms, cards, modals, and toasts.

## 2. Important App Folder Files

| File | Purpose | Backend requirement |
| --- | --- | --- |
| `layout.tsx` | Global HTML shell and providers. | None directly. Backend auth data is consumed by `AuthProvider`. |
| `page.tsx` | Redirects `/` to `/login`. | None. |
| `error.tsx` | Client error boundary with retry and dashboard fallback. | None. Optional production error logging service can be added. |
| `not-found.tsx` | Global 404 screen. | None. |
| `globals.css` | Global design tokens, forms, table, dashboard, and utility styling. | None. |
| `favicon.ico` | Browser icon. | None. |
| `dashboard/loading.tsx` | Loading UI for dashboard route segment. | None. |
| `unauthorized/page.tsx` | Shown when role or permission checks fail. | None. |
| `user-chat/userchat.md` | Notes/planning file for chat UX. It is not a route. | None. |

## 3. Shared Modules Used By App Routes

| Module | What it does | Backend setup required |
| --- | --- | --- |
| `src/lib/api.ts` | Axios instance. Uses `NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:8080/api`. Adds `Authorization: Bearer <token>`. | Backend must accept JSON, return JSON, support bearer token auth, and allow frontend origin through CORS. |
| `src/lib/api-contract.ts` | Normalizes legacy singular paths like `/client` to `/v1/clients`, and exposes typed route builders. | Laravel routes should be available under `/api/v1/...`. |
| `src/lib/api-client.ts` | Generic CRUD wrapper around `api.ts`. | Backend should return `{ success, data, message?, meta? }`. |
| `src/lib/session.ts` | Stores token in cookie and user in localStorage. | Login endpoint must return a token and user object. |
| `src/lib/auth-contract.ts` | Defines roles, permissions, route guards, and default dashboards. | Backend user payload should include `role`, `company_id`, `permissions`, and optionally `modules`. |
| `src/context/AuthContext.tsx` | Runtime route guard, login/logout, impersonation return, permission helpers. | Backend must keep token valid and return 401 when invalid or expired. |
| `src/context/ToastContext.tsx` | Global toast messages. | None. |
| `src/components/layout/DashboardLayout.tsx` | Common authenticated shell. | None. |
| `src/components/layout/Sidebar.tsx` | Navigation filtered by role and permissions. | User permissions must align with `PermissionKey` values in `auth-contract.ts`. |
| `src/components/layout/Navbar.tsx` | Top bar, global search, notifications UI, profile menu. | Currently searches `/client`, `/employee`, `/project`, normalized to `/v1/clients`, `/v1/employees`, `/v1/projects`. |
| `src/components/admin/ResourceCrudPage.tsx` | Generic list/create/edit/delete pages. | Each using page needs GET collection, POST collection, PUT detail, DELETE detail. |
| `src/components/admin/ProjectWorkspacePage.tsx` | Generic project submodule workspace. | Needs `/v1/projects/{id}` and one or more submodule endpoints. |
| `src/components/admin/FinanceDocumentPage.tsx` | Shared invoice/estimate/proposal/credit-note detail UI. | Needs document detail plus action endpoints like PDF, send, email, duplicate, payments. |

## 4. API Path Normalization

The frontend often calls old Laravel-style paths. `normalizeApiPath()` converts them before the request leaves the browser.

Examples:

| Frontend call | Backend route actually expected |
| --- | --- |
| `/client` | `/v1/clients` |
| `/employee` | `/v1/employees` |
| `/project` | `/v1/projects` |
| `/invoice` | `/v1/invoices` |
| `/admins` | `/v1/admins` |
| `/companies` | `/v1/companies` |
| `/billing/data` | `/v1/billing/summary` |
| `/billing/packages` | `/v1/billing/packages` |
| `/payroll/updateStatus` | `/v1/payroll/update-status` |
| `/v1/attendance-devices` | stays `/v1/attendance-devices` |

With the default base URL, `/admins` becomes:

```text
http://localhost:8080/api/v1/admins
```

## 5. Auth and Permission Flow

Login flow:

1. `/login/page.tsx` posts to `/auth/login`.
2. `api.ts` normalizes it to `/v1/auth/login` unless the backend exposes the auth route separately.
3. Response must include:

```json
{
  "data": {
    "token": "plain-or-sanctum-token",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "company_id": 1,
      "permissions": ["dashboard.view", "employees.*"],
      "modules": ["dashboard", "employees"]
    }
  }
}
```

Role rules:

| Role | Default route | Main access |
| --- | --- | --- |
| `super_admin` | `/super-admin/dashboard` | Platform company/admin/settings layer only. |
| `admin` | `/dashboard` | Company-scoped administration. |
| `employee` | `/employee/dashboard` | Employee portal and permitted work modules. |
| `client` | `/dashboard/client` | Client portal and assigned records. |

## 6. Super Admin Admins Flow

File: `super-admin/admins/page.tsx`

Runtime behavior:

1. Page loads inside `DashboardLayout`.
2. `fetchData()` runs on mount.
3. It loads admins and companies in parallel:
   - `GET /admins`
   - `GET /companies`
4. Returned admin permissions are normalized so `profile.*` is always included.
5. Company records are mapped by ID for filtering and labels.
6. The table role column is derived from the selected permission template: Full Access, HR Admin, Project Admin, Finance Admin, or Custom Admin.
7. Search, company filter, and status filter are applied in memory. Search includes the derived role label.
8. Add Admin opens the form with default permissions.
9. Edit Admin opens the same form with existing name, email, company, status, and permissions. Password is blank so leaving it blank keeps the current password.
10. Save validates required fields, email format, duplicate email, and password rules.
11. Create posts `POST /admins`.
12. Edit sends `PUT /admins/{id}`.
13. Status toggle sends `PUT /admins/{id}` with the changed `status`.
14. Delete sends `DELETE /admins/{id}`.

Password validation now enforced in the frontend:

- Required when creating a new admin.
- Optional when editing an existing admin.
- Must be at least 8 characters when provided.
- Must not be a common weak password.
- Must not match the admin name, email, email username, or company name.
- Eye icon toggles show/hide without changing the stored value.

Backend validation required for this same form:

```php
// Store admin
$validated = $request->validate([
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'email', 'max:255', 'unique:users,email'],
    'password' => ['required', 'string', 'min:8'],
    'company_id' => ['required', 'exists:companies,id'],
    'status' => ['required', 'in:active,inactive'],
    'permissions' => ['required', 'array'],
    'permissions.*' => ['string'],
    'modules' => ['nullable', 'array'],
]);

$validated['password'] = Hash::make($validated['password']);
```

```php
// Update admin
$validated = $request->validate([
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($admin->id)],
    'password' => ['nullable', 'string', 'min:8'],
    'company_id' => ['required', 'exists:companies,id'],
    'status' => ['required', 'in:active,inactive'],
    'permissions' => ['required', 'array'],
    'permissions.*' => ['string'],
    'modules' => ['nullable', 'array'],
]);

if (!empty($validated['password'])) {
    $validated['password'] = Hash::make($validated['password']);
} else {
    unset($validated['password']);
}
```

Do not enforce global plaintext password uniqueness by comparing against every user. Passwords should be hashed. If password reuse must be blocked, use a password history table per user/admin and compare with `Hash::check()`.

## 7. Backend Setup Baseline

Minimum Laravel setup:

1. Set frontend env:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_API_TIMEOUT_MS=10000
```

2. Set Laravel env:

```env
APP_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
SESSION_DOMAIN=localhost
```

3. Enable CORS for `http://localhost:3000`.
4. Put API routes under `routes/api.php` with a `v1` prefix.
5. Protect private routes with auth middleware, usually `auth:sanctum`.
6. Return consistent JSON:

```json
{
  "success": true,
  "data": [],
  "message": "Optional message",
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 0
  }
}
```

7. Return `401` when token is invalid. The frontend will clear session and redirect to `/login`.
8. Return validation errors with HTTP `422` and a useful `message`.
9. Scope non-super-admin data by `company_id` on the backend. Do not rely only on frontend filtering.

## 8. Route By Route Backend Matrix

`no direct api call` means the route currently renders static/local/mock UI or delegates to a shared component not visible as a direct `api.*` call in that page. If it uses `ResourceCrudPage`, `ProjectWorkspacePage`, or `FinanceDocumentPage`, the shared component requirements are listed.

| Route | File | Backend setup |
| --- | --- | --- |
| `/` | `page.tsx` | No backend. Redirects to `/login`. |
| `/login` | `login/page.tsx` | `POST /auth/login`. Return token and user. |
| `/account-setup` | `account-setup/page.tsx` | `GET /account-setup`, `PUT /account-setup/1`. |
| `/attendance` | `attendance/page.tsx` | `GET /attendance`, `GET /employee`. |
| `/attendance/[id]/logs` | `attendance/[id]/logs/page.tsx` | Uses `attendanceService`: `GET /v1/attendance/audit/{employeeId}/{date}`, `POST /v1/attendance/override`. |
| `/attendance/bulk` | `attendance/bulk/page.tsx` | `GET /team`, `GET /employee`, `GET /holidays`, `GET /attendance-settings`, `POST /attendance`. |
| `/attendance/create` | `attendance/create/page.tsx` | `GET /employee`, `POST /attendance`. |
| `/attendance/date` | `attendance/date/page.tsx` | `GET /employee`, `GET /attendance`. |
| `/attendance/live-feed` | `attendance/live-feed/page.tsx` | No direct API. Wire live attendance feed when backend exists. |
| `/attendance/reports/deductions` | `attendance/reports/deductions/page.tsx` | `GET /employee`, `GET /attendance`, `GET /shift-types`. |
| `/attendance/roster` | `attendance/roster/page.tsx` | No direct API. Roster backend should expose employee/device/shift data. |
| `/attendance/settings/policies` | `attendance/settings/policies/page.tsx` | No direct API. Add policy CRUD endpoints before production. |
| `/attendance/settings/shifts` | `attendance/settings/shifts/page.tsx` | No direct API. Add shift policy endpoints before production. |
| `/attendance/summary` | `attendance/summary/page.tsx` | `GET /employee`, `GET /attendance`, `GET /holidays`, `GET /leaves`, `GET /attendance-settings`. |
| `/attendance-settings` | `attendance-settings/page.tsx` | `GET /attendance-settings`, `PUT /attendance-settings/{id}`. |
| `/billing` | `billing/page.tsx` | `GET /billing/packages`, `GET /billing/data`, `GET /billing/select-package/{planId}`, `POST /billing/offline-payment-submit`. |
| `/client-contacts` | `client-contacts/page.tsx` | Uses `ResourceCrudPage` with `/contacts`: GET, POST, PUT `/contacts/{id}`, DELETE `/contacts/{id}`. |
| `/client-settings/category/create` | `client-settings/category/create/page.tsx` | `POST /client-category`. |
| `/clients` | `clients/page.tsx` | `GET /client?include=client_detail&page={page}`, `DELETE /client/{id}`. |
| `/clients/[id]` | `clients/[id]/page.tsx` | `GET /client/{id}`. |
| `/clients/[id]/edit` | `clients/[id]/edit/page.tsx` | `GET /client/{id}`, `PUT /client/{id}`. |
| `/clients/create` | `clients/create/page.tsx` | `POST /client`. |
| `/contract-type` | `contract-type/page.tsx` | No direct API. Add contract type CRUD if needed. |
| `/contracts` | `contracts/page.tsx` | No direct API in page. Wire contracts list backend for production. |
| `/contracts/create` | `contracts/create/page.tsx` | `GET /client`, `GET /contract-type`, `POST /contract`. |
| `/credit-notes` | `credit-notes/page.tsx` | No direct API. Add credit note list backend. |
| `/credit-notes/[id]` | `credit-notes/[id]/page.tsx` | Uses `FinanceDocumentPage` with endpoint `credit-note`: `GET /credit-note/{id}` plus actions on `credit-notes/{id}/{action}`. |
| `/currencies` | `currencies/page.tsx` | `GET /currency`, `POST /currency`, `PUT /currency/{id}`, `DELETE /currency/{id}`. |
| `/custom-fields` | `custom-fields/page.tsx` | No direct API. Add custom field CRUD backend. |
| `/dashboard` | `dashboard/page.tsx` | No direct API. Static dashboard shell. |
| `/dashboard/client` | `dashboard/client/page.tsx` | No direct API. Add client dashboard summary backend if needed. |
| `/dashboard/finance` | `dashboard/finance/page.tsx` | No direct API. Add finance dashboard summary backend if needed. |
| `/dashboard/hr` | `dashboard/hr/page.tsx` | `GET /employee`, `GET /attendance`, `GET /leave`, `GET /shift-types`. |
| `/dashboard/project` | `dashboard/project/page.tsx` | No direct API. Add project summary backend if needed. |
| `/dashboard/ticket` | `dashboard/ticket/page.tsx` | No direct API. Add ticket summary backend if needed. |
| `/designation` | `designation/page.tsx` | `GET /designation`, `GET /employee`, `PUT /designation/{id}`, `DELETE /designation/{id}`. |
| `/designation/create` | `designation/create/page.tsx` | `POST /designation`. |
| `/discussion` | `discussion/page.tsx` | No direct API. Add discussions list backend if needed. |
| `/discussion/create` | `discussion/create/page.tsx` | `GET /discussion-category`, `POST /discussion`. |
| `/discussion-categories` | `discussion-categories/page.tsx` | Uses `ResourceCrudPage` with `/discussion-category`: GET, POST, PUT, DELETE. |
| `/discussion-reply` | `discussion-reply/page.tsx` | Uses `ResourceCrudPage` with `/discussion-reply`: GET, POST, PUT, DELETE. |
| `/email-settings` | `email-settings/page.tsx` | No direct API. Add email settings read/update backend. |
| `/employee-faq` | `employee-faq/page.tsx` | `GET /employee-faq`, `GET /employee-faq-category`, `POST /employee-faq`, `PUT /employee-faq/{id}`, `DELETE /employee-faq/{id}`. |
| `/employee-faq-category` | `employee-faq-category/page.tsx` | `GET /employee-faq-category`, `POST /employee-faq-category`, `PUT /employee-faq-category/{id}`, `DELETE /employee-faq-category/{id}`. |
| `/employees` | `employees/page.tsx` | `GET /employee?include=employeeDetail,employeeDetail.designation,employeeDetail.department,role`, `DELETE /employee/{id}`. |
| `/employees/[id]` | `employees/[id]/page.tsx` | `GET /employee/{id}`, plus projects, tasks, leaves, time logs, docs, activities, attendance, leave type, quotas. `DELETE /employee-docs/{id}`. |
| `/employees/[id]/edit` | `employees/[id]/edit/page.tsx` | `GET /employee/{id}`, `GET /department`, `GET /designation`, `GET /shift-types`, `PUT /employee/{id}`, `POST /employees/assignRole`. |
| `/employees/create` | `employees/create/page.tsx` | `GET /team`, `GET /designation`, `GET /shift-types`, `POST /employee`, `POST /employees/assignRole`. |
| `/employees/faq` | `employees/faq/page.tsx` | No direct API. |
| `/employees/faq/category` | `employees/faq/category/page.tsx` | `GET /employee-faq-category`. |
| `/estimates` | `estimates/page.tsx` | `GET /estimate?include=client,project`, `DELETE /estimate/{id}`. |
| `/estimates/[id]` | `estimates/[id]/page.tsx` | Uses `FinanceDocumentPage` with endpoint `estimate`: `GET /estimate/{id}` plus estimate actions. |
| `/estimates/create` | `estimates/create/page.tsx` | `GET /client`, `GET /currency`, `POST /estimate`. |
| `/event-calendar` | `event-calendar/page.tsx` | No direct API. Add events feed endpoint if needed. |
| `/event-type` | `event-type/page.tsx` | Uses `ResourceCrudPage` with `/event-type`: GET, POST, PUT, DELETE. |
| `/events` | `events/page.tsx` | No direct API. Add events list backend. |
| `/events/create` | `events/create/page.tsx` | `POST /event`. |
| `/expense-category` | `expense-category/page.tsx` | No direct API. Add expense category CRUD backend. |
| `/expenses` | `expenses/page.tsx` | `GET /expense?include=user,category,project`, `DELETE /expense/{id}`. |
| `/expenses/[id]` | `expenses/[id]/page.tsx` | Uses `apiClient.action("expenses", id, approve/reject)`: `POST /v1/expenses/{id}/approve` or reject. |
| `/expenses/create` | `expenses/create/page.tsx` | `GET /employee`, `GET /project`, `GET /currency`, `POST /expense`. |
| `/expenses-recurring` | `expenses-recurring/page.tsx` | No direct API. Add recurring expense backend. |
| `/faqs` | `faqs/page.tsx` | No direct API. Add FAQ backend if required. |
| `/gdpr` | `gdpr/page.tsx` | No direct API. Add privacy/export/delete account endpoints if needed. |
| `/google-calendar-settings` | `google-calendar-settings/page.tsx` | No direct API. Add Google Calendar settings backend. |
| `/holidays` | `holidays/page.tsx` | `GET /holidays`, `POST /holiday`, `DELETE /holidays/{id}`. |
| `/holidays/create` | `holidays/create/page.tsx` | `POST /holiday`. |
| `/invoice-recurring` | `invoice-recurring/page.tsx` | No direct API. Add recurring invoice backend. |
| `/invoice-settings` | `invoice-settings/page.tsx` | No direct API. Add invoice settings backend. |
| `/invoices` | `invoices/page.tsx` | `GET /invoice?include=client,project`, `DELETE /invoice/{id}`. |
| `/invoices/[id]` | `invoices/[id]/page.tsx` | Uses `FinanceDocumentPage` with endpoint `invoice`: `GET /invoice/{id}` plus invoice actions. |
| `/invoices/create` | `invoices/create/page.tsx` | `GET /client`, `GET /currency`, `POST /invoice`. |
| `/issues` | `issues/page.tsx` | No direct API. Add issue list backend. |
| `/lead-form` | `lead-form/page.tsx` | No direct API. Add public/internal lead form backend if needed. |
| `/lead-settings` | `lead-settings/page.tsx` | No direct API. Add settings backend. |
| `/lead-settings/category/create` | `lead-settings/category/create/page.tsx` | `POST /lead-category`. |
| `/lead-settings/source/create` | `lead-settings/source/create/page.tsx` | `POST /lead-source`. |
| `/lead-settings/status/create` | `lead-settings/status/create/page.tsx` | `POST /lead-status`. |
| `/leads` | `leads/page.tsx` | `GET /lead`, `DELETE /lead/{id}`. |
| `/leads/[id]` | `leads/[id]/page.tsx` | `GET /lead/{id}`. |
| `/leads/[id]/edit` | `leads/[id]/edit/page.tsx` | No direct API. Add lead detail/update backend before production. |
| `/leads/create` | `leads/create/page.tsx` | `GET /lead-source`, `GET /lead-status`, `POST /lead`. |
| `/leads/kanban` | `leads/kanban/page.tsx` | No direct API. Add kanban/status backend if needed. |
| `/leave-type` | `leave-type/page.tsx` | Uses `ResourceCrudPage` with `/leaveType`: GET, POST, PUT, DELETE. |
| `/leaves` | `leaves/page.tsx` | `GET /leave`, `PATCH /leave/{id}`, `DELETE /leave/{id}`. |
| `/leaves/[id]` | `leaves/[id]/page.tsx` | Uses `apiClient.action("leaves", id, approve/reject)`. |
| `/leaves/all` | `leaves/all/page.tsx` | `GET /leave`, `GET /employee`, `DELETE /leave/{id}`. |
| `/leaves/create` | `leaves/create/page.tsx` | `GET /employee`, `GET /leave-type`, `POST /leave`. |
| `/leaves/settings` | `leaves/settings/page.tsx` | `GET /leaveType`, `POST /leaveType`, `PUT /leaveType/{id}`, `DELETE /leaveType/{id}`. |
| `/leaves-settings` | `leaves-settings/page.tsx` | No direct API. Add leave settings backend. |
| `/log-time-settings` | `log-time-settings/page.tsx` | No direct API. Add time log settings backend. |
| `/employee/dashboard` | `employee/dashboard/page.tsx` | `GET /employee`, `GET /attendance`, `GET /leave`, `GET /tasks`, `POST /attendance`, `PATCH /attendance/{id}`. |
| `/employee/payroll` | `employee/payroll/page.tsx` | `GET /payroll`. |
| `/message-settings` | `message-settings/page.tsx` | No direct API. Add message settings backend. |
| `/module-settings` | `module-settings/page.tsx` | No direct API. Add module settings backend. |
| `/notes` | `notes/page.tsx` | Uses `ResourceCrudPage` with `/notes`: GET, POST, PUT, DELETE. |
| `/notices` | `notices/page.tsx` | `POST /notice`, `PUT /notice/{id}`, `DELETE /notice/{id}`. Page also builds a dynamic GET URL for notice listing. |
| `/notices/create` | `notices/create/page.tsx` | `POST /notice`. |
| `/notifications` | `notifications/page.tsx` | No direct API. Add notifications backend. |
| `/payment-gateway-credentials` | `payment-gateway-credentials/page.tsx` | No direct API. Add payment gateway settings backend. |
| `/payments` | `payments/page.tsx` | `GET /payment?include=invoice,project`, `DELETE /payment/{id}`. |
| `/payments/[id]` | `payments/[id]/page.tsx` | Uses `apiClient.action("payments", id, approve/reject)`. |
| `/payments/create` | `payments/create/page.tsx` | `GET /project`, `GET /invoice`, `POST /payment`. |
| `/payroll` | `payroll/page.tsx` | Payroll list and actions: departments, designations, employees, employee salaries, salary groups, payroll cycles, payment methods, `POST /payroll/generate`, `POST /payroll/updateStatus`, `DELETE /payroll/{id}`. |
| `/payroll/settings` | `payroll/settings/page.tsx` | Payroll settings CRUD for salary components, groups, TDS, payment methods, employee salaries, salary groups, payroll cycles, and payroll settings. |
| `/products` | `products/page.tsx` | `GET /product`, `POST /product`, `PUT /product/{id}`, `DELETE /product/{id}`. |
| `/products/create` | `products/create/page.tsx` | `POST /product`. |
| `/profile` | `profile/page.tsx` | No direct API. Add profile read/update backend. |
| `/project-category` | `project-category/page.tsx` | Uses `ResourceCrudPage` with `/project-category`: GET, POST, PUT, DELETE. |
| `/project-settings` | `project-settings/page.tsx` | No direct API. Add project settings backend. |
| `/project-template` | `project-template/page.tsx` | No direct API. Add project template backend. |
| `/projects` | `projects/page.tsx` | `GET /project?include=client,members`, `DELETE /project/{id}`. |
| `/projects/[id]` | `projects/[id]/page.tsx` | `GET /project/{id}`. |
| `/projects/[id]/burndown` | `projects/[id]/burndown/page.tsx` | Uses `ProjectWorkspacePage`: project detail plus `/task?project_id={projectId}&include=users`, `/projects/burndown/{projectId}`, or `/project/{projectId}/tasks`. |
| `/projects/[id]/discussions` | `projects/[id]/discussions/page.tsx` | Uses `ProjectWorkspacePage`: `/project/{id}/discussions`, `/discussion?project_id={id}`, or `/projects/discussion/{id}`. |
| `/projects/[id]/edit` | `projects/[id]/edit/page.tsx` | No direct API. Add project edit backend before production. |
| `/projects/[id]/expenses` | `projects/[id]/expenses/page.tsx` | Uses `ProjectWorkspacePage`: `/expense?project_id={id}&include=user,category,project` or `/project/{id}/expenses`. |
| `/projects/[id]/files` | `projects/[id]/files/page.tsx` | Uses `ProjectWorkspacePage`: `/project/{id}/files`, `/project-file?project_id={id}`, or `/files?project_id={id}`. |
| `/projects/[id]/gantt` | `projects/[id]/gantt/page.tsx` | Uses `ProjectWorkspacePage`: task/project gantt candidate endpoints. |
| `/projects/[id]/invoices` | `projects/[id]/invoices/page.tsx` | Uses `ProjectWorkspacePage`: `/invoice?project_id={id}&include=client,project` or `/project/{id}/invoices`. |
| `/projects/[id]/issues` | `projects/[id]/issues/page.tsx` | Uses `ProjectWorkspacePage`: `/issue?project_id={id}` or `/project/{id}/issues`. |
| `/projects/[id]/members` | `projects/[id]/members/page.tsx` | Uses `ProjectWorkspacePage`: `/project-members/{id}`, `/project-member?project_id={id}`, or `/project/{id}/members`. |
| `/projects/[id]/milestones` | `projects/[id]/milestones/page.tsx` | Uses `ProjectWorkspacePage`: `/project/{id}/milestones`, `/milestone?project_id={id}`, or `/milestones/data/{id}`. |
| `/projects/[id]/notes` | `projects/[id]/notes/page.tsx` | Uses `ProjectWorkspacePage`: `/project-note?project_id={id}`, `/project-notes/data/{id}`, or `/project/{id}/notes`. |
| `/projects/[id]/payments` | `projects/[id]/payments/page.tsx` | Uses `ProjectWorkspacePage`: `/payment?project_id={id}` or `/project/{id}/payments`. |
| `/projects/[id]/tasks` | `projects/[id]/tasks/page.tsx` | Uses `ProjectWorkspacePage`: `/task?project_id={id}&include=users` or `/project/{id}/tasks`. |
| `/projects/[id]/time-logs` | `projects/[id]/time-logs/page.tsx` | Uses `ProjectWorkspacePage`: `/time-log?project_id={id}`, `/all-time-logs?project_id={id}`, or `/project/{id}/time-logs`. |
| `/projects/create` | `projects/create/page.tsx` | `GET /project-category`, `GET /client`, `POST /project`. |
| `/proposals` | `proposals/page.tsx` | `GET /proposal?include=lead,client`, `DELETE /proposal/{id}`. |
| `/proposals/[id]` | `proposals/[id]/page.tsx` | Uses `FinanceDocumentPage` with endpoint `proposal`: `GET /proposal/{id}` plus proposal actions. |
| `/pusher-settings` | `pusher-settings/page.tsx` | No direct API. Add pusher settings backend. |
| `/push-settings` | `push-settings/page.tsx` | No direct API. Add push notification settings backend. |
| `/recruitment/*` | `recruitment/.../page.tsx` | Recruitment pages currently have no direct API calls. Add endpoints for dashboard, jobs, applications, board, archive, categories, departments, documents, interviews, locations, onboarding, questions, settings, skills, todos, and update flow. |
| `/reports` | `reports/page.tsx` | `GET /dashboard`. |
| `/reports/attendance` | `reports/attendance/page.tsx` | `GET /employee`, `GET /attendance`, `GET /holidays`, `GET /attendance-settings`. |
| `/reports/expense` | `reports/expense/page.tsx` | No direct API. Add report endpoint. |
| `/reports/finance` | `reports/finance/page.tsx` | No direct API. Add report endpoint. |
| `/reports/income-expense` | `reports/income-expense/page.tsx` | No direct API. Add report endpoint. |
| `/reports/leave` | `reports/leave/page.tsx` | `GET /employee`, `GET /leaves`, `GET /leave-type`, `GET /leave-quotas`. |
| `/reports/payroll` | `reports/payroll/page.tsx` | `GET /payroll?year={year}&month={month}`, `GET /employees`. |
| `/reports/tasks` | `reports/tasks/page.tsx` | No direct API. Add task report endpoint. |
| `/reports/time-log` | `reports/time-log/page.tsx` | No direct API. Add time log report endpoint. |
| `/role-permission` | `role-permission/page.tsx` | `POST /role-permission/assignRole`. |
| `/search` | `search/page.tsx` | No direct API in page. Global navbar search uses clients, employees, projects. |
| `/settings` | `settings/page.tsx` | No direct API. |
| `/settings/account` | `settings/account/page.tsx` | No direct API. Add account settings backend. |
| `/settings/app` | `settings/app/page.tsx` | No direct API. Add app settings backend. |
| `/settings/attendance` | `settings/attendance/page.tsx` | No direct API. Add attendance settings backend. |
| `/settings/attendance-devices` | `settings/attendance-devices/page.tsx` | Uses `devicesService`: `GET /v1/attendance-devices`, `POST /v1/attendance-devices/{id}/sync-employees`, reboot, clear-logs. |
| `/settings/company` | `settings/company/page.tsx` | No direct API. Add company settings backend. |
| `/settings/finance` | `settings/finance/page.tsx` | No direct API. Add finance settings backend. |
| `/settings/language` | `settings/language/page.tsx` | No direct API. Add language settings backend. |
| `/settings/leave` | `settings/leave/page.tsx` | No direct API. Add leave settings backend. |
| `/settings/notifications` | `settings/notifications/page.tsx` | No direct API. Add notification settings backend. |
| `/settings/profile` | `settings/profile/page.tsx` | No direct API. Add profile/password backend. |
| `/settings/roles` | `settings/roles/page.tsx` | No direct API. Add role settings backend or reuse `/role-permission/assignRole`. |
| `/shift-types` | `shift-types/page.tsx` | `GET /shift-types`, `GET /employee`, `POST /shift-types`, `PUT /shift-types/{id}`, `DELETE /shift-types/{id}`. |
| `/slack-settings` | `slack-settings/page.tsx` | No direct API. Add Slack settings backend. |
| `/sticky-notes` | `sticky-notes/page.tsx` | No direct API. Add sticky note backend. |
| `/sub-task` | `sub-task/page.tsx` | Uses `ResourceCrudPage` with `/sub-task`: GET, POST, PUT, DELETE. |
| `/super-admin/admins` | `super-admin/admins/page.tsx` | `GET /admins`, `GET /companies`, `POST /admins`, `PUT /admins/{id}`, `DELETE /admins/{id}`. |
| `/super-admin/companies` | `super-admin/companies/page.tsx` | `GET /companies`, `PUT /companies/{id}`, `DELETE /companies/{id}`, `POST /companies/{id}/login`. |
| `/super-admin/companies/create` | `super-admin/companies/create/page.tsx` | Uses `apiClient.create("companies", form)`: `POST /v1/companies`. |
| `/super-admin/dashboard` | `super-admin/dashboard/page.tsx` | No direct API. Add platform dashboard summary backend. |
| `/super-admin/invoices` | `super-admin/invoices/page.tsx` | No direct API. Add SaaS invoice backend if billing is enabled. |
| `/super-admin/packages` | `super-admin/packages/page.tsx` | No direct API. Add package CRUD backend if SaaS billing is enabled. |
| `/super-admin/settings` | `super-admin/settings/page.tsx` | Uses `apiClient.create("settings", ...)`: `POST /v1/settings`. |
| `/support-tickets` | `support-tickets/page.tsx` | Uses `ResourceCrudPage` with `/support-tickets`: GET, POST, PUT, DELETE. |
| `/task-category` | `task-category/page.tsx` | No direct API. Add task category list/update backend. |
| `/task-category/create` | `task-category/create/page.tsx` | `POST /task-category`. |
| `/task-label` | `task-label/page.tsx` | Uses `ResourceCrudPage` with `/task-label`: GET, POST, PUT, DELETE. |
| `/task-request` | `task-request/page.tsx` | Uses `ResourceCrudPage` with `/task-request`: GET, POST, PUT, DELETE. |
| `/task-settings` | `task-settings/page.tsx` | No direct API. Add task settings backend. |
| `/taskboard` | `taskboard/page.tsx` | No direct API. Add task board endpoint or reuse `/task`. |
| `/task-calendar` | `task-calendar/page.tsx` | No direct API. Add task calendar endpoint or reuse `/task`. |
| `/tasks` | `tasks/page.tsx` | `GET /task?include=project,users`, `PATCH /task/{id}`, `DELETE /task/{id}`. |
| `/tasks/[id]` | `tasks/[id]/page.tsx` | `GET /task/{id}`. |
| `/tasks/[id]/edit` | `tasks/[id]/edit/page.tsx` | No direct API. Add task edit backend before production. |
| `/tasks/create` | `tasks/create/page.tsx` | `GET /project`, `GET /employee`, `GET /task-category`, `POST /task`. |
| `/taxes` | `taxes/page.tsx` | No direct API. Add tax CRUD backend. |
| `/teams` | `teams/page.tsx` | `GET /department`, `GET /employee`, `PUT /department/{id}`, `DELETE /department/{id}`. |
| `/teams/create` | `teams/create/page.tsx` | `POST /department`. |
| `/theme-settings` | `theme-settings/page.tsx` | No direct API. Add theme settings backend. |
| `/ticket-form` | `ticket-form/page.tsx` | Uses `ResourceCrudPage` with `/ticket-form`: GET, POST, PUT, DELETE. |
| `/ticket-settings` | `ticket-settings/page.tsx` | No direct API. Add ticket settings backend. |
| `/tickets` | `tickets/page.tsx` | `GET /ticket`, `DELETE /ticket/{id}`. |
| `/tickets/[id]` | `tickets/[id]/page.tsx` | `GET /ticket/{id}`, plus `apiClient` actions for ticket workflow. |
| `/tickets/create` | `tickets/create/page.tsx` | `GET /employee`, `GET /client`, `POST /ticket`. |
| `/time-logs` | `time-logs/page.tsx` | No direct API. Add time log list backend. |
| `/time-logs/active` | `time-logs/active/page.tsx` | No direct API. Add active timer backend. |
| `/time-logs/by-employee` | `time-logs/by-employee/page.tsx` | No direct API. Add employee time log backend. |
| `/time-logs/calendar` | `time-logs/calendar/page.tsx` | No direct API. Add time log calendar backend. |
| `/time-logs/create` | `time-logs/create/page.tsx` | `GET /project`, `GET /task`, `POST /time-log`. |
| `/user-chat` | `user-chat/page.tsx` | `GET /chat-conversations`, `GET /chat-messages`, `GET /employees`, `GET /clients`, `POST /chat-conversations`, `POST /chat-messages`, `PUT /chat-conversations/{id}`, `PUT /chat-messages/{id}`. |

## 9. Backend Build Order

Recommended implementation order:

1. Auth: `/v1/auth/login`, token issuing, user permissions.
2. Core records: companies, admins, employees, clients, projects.
3. Permission enforcement: company scoping and `super_admin` platform scoping.
4. HR: attendance, leaves, holidays, shifts, departments, designations.
5. Work: tasks, task categories, tickets, discussions, time logs.
6. Finance: invoices, estimates, proposals, payments, expenses, products, currencies.
7. Payroll.
8. Chat and notifications.
9. Settings and integration pages.
10. Reports and dashboard aggregate endpoints.

## 10. Production Rules

- Every frontend validation must also exist on the backend.
- Never trust `company_id`, `permissions`, `role`, or `status` from the browser without checking the authenticated user's authority.
- Super Admin routes should not be accessible by company admins.
- Company admins should only read and write records for their own `company_id`.
- Passwords must always be hashed.
- The backend should return permission-aware data. Frontend filtering is only for user experience.
