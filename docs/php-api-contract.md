# Plain PHP API Contract

The Next.js frontend is now prepared for a custom PHP backend, not Laravel-specific routes.

## Base URL

Set this in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_API_TIMEOUT_MS=5000
NEXT_PUBLIC_API_MODE=mock
```

The frontend calls versioned routes under:

```txt
/api/v1
```

Use `NEXT_PUBLIC_API_MODE=mock` while the frontend is being built without the PHP backend. The mock adapter returns the same `/v1/*` response envelope and persists browser data in `localStorage`. Switch to `NEXT_PUBLIC_API_MODE=live` when your plain PHP backend is ready.

## Response Envelope

Every PHP endpoint should return this JSON shape:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 0
  }
}
```

Validation/auth errors should use HTTP status codes and the same envelope where possible:

```json
{
  "success": false,
  "data": null,
  "message": "The email field is required."
}
```

## Auth

The frontend sends:

```txt
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Frontend-Client: nextjs-ui
```

On `401`, the frontend removes the token and redirects to `/login`.

## Core Routes

Use plural REST resources:

```txt
GET    /v1/clients
POST   /v1/clients
GET    /v1/clients/{id}
PUT    /v1/clients/{id}
PATCH  /v1/clients/{id}
DELETE /v1/clients/{id}
```

Same pattern applies to:

```txt
employees
projects
tasks
leads
tickets
invoices
estimates
proposals
credit-notes
payments
expenses
leaves
attendance
time-logs
products
contracts
events
notices
holidays
currencies
departments
designations
```

## Query Format

Lists can accept:

```txt
?page=1&per_page=20&search=abc&status=open&include=client,project&sort=created_at&direction=desc
```

## Action Routes

Use nested action endpoints for workflow operations:

```txt
POST /v1/invoices/{id}/send
POST /v1/invoices/{id}/pdf
POST /v1/invoices/{id}/payments
POST /v1/invoices/{id}/approve-offline-payment
POST /v1/estimates/{id}/convert-to-invoice
POST /v1/proposals/{id}/convert-to-invoice
POST /v1/credit-notes/{id}/apply-to-invoices
POST /v1/tickets/{id}/replies
POST /v1/tickets/{id}/internal-notes
POST /v1/leaves/{id}/approve
POST /v1/leaves/{id}/reject
POST /v1/expenses/{id}/approve
POST /v1/expenses/{id}/reject
POST /v1/time-logs/{id}/stop
```

## File Uploads

Use multipart form data:

```txt
POST /v1/tasks/{id}/files
POST /v1/leads/{id}/files
POST /v1/tickets/{id}/files
POST /v1/expenses/{id}/files
POST /v1/payments/{id}/files
```

Recommended response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "filename": "receipt.pdf",
      "file_url": "http://localhost:8080/uploads/receipt.pdf",
      "size": 123456,
      "created_at": "2026-05-08T10:00:00Z"
    }
  ]
}
```

## Compatibility Adapter

Older frontend calls like:

```ts
api.get("/client/1")
```

are automatically normalized to:

```txt
GET /v1/clients/1
```

This lets us migrate screens gradually without blocking your future PHP backend.
