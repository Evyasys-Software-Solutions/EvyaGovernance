# Rules: DTOs, Request Payloads, and Response Structure

Applies to every project. Consistent shape in, consistent shape out.
Every rule uses "must" or "never" — no ambiguity. Violations block merge.

---

## Core principle

Every boundary crossing — HTTP request into the system, data between layers, data out of the system — uses a typed, named object. Raw dictionaries, unvalidated request bodies, and raw model instances never cross layer boundaries.
The shape of every request and every response is predictable, documented, and validated once.

---

## Request DTO rules

- Every controller action must accept data through a typed Request DTO (or equivalent validated input object — the mechanism is documented in `DTO_STANDARDS.md` for this project's language and framework).
- **Never** pass an unvalidated raw request body (e.g. `request.all()`, `req.body`, `request.POST`) directly from the controller into a service method.
- Request DTOs perform validation at the controller boundary — validation is complete before the DTO reaches the service layer.
- A Request DTO must declare every accepted field explicitly with its type. No catch-all fields.
- A Request DTO must strip any fields not declared in its schema — **never** pass through unknown fields from user input into business logic.
- Request DTOs must cast input values to their correct types (string `"1"` becomes integer `1`, string `"true"` becomes boolean `true`) before reaching the service. Services receive correctly typed values, never raw request strings.
- **Never** perform business logic inside a Request DTO. Validation and casting only.
- Naming: `{Feature}{Action}Request` — e.g. `CreateUserRequest`, `UpdateOrderRequest`, `ExportReportRequest`.
- Location: the project's designated request/DTO input directory (e.g. `app/Http/Requests/`, `src/requests/`, `app/schemas/` — documented in `DTO_STANDARDS.md`).
- Every Request DTO must be fully documented in `DTO_STANDARDS.md`.

---

## Response DTO rules

- Every service method must return either a typed Response DTO, a typed collection of DTOs, or throw a typed domain exception. It must never return a raw ORM/ODM model instance, a raw dictionary/map, or `null` where a DTO is expected.
- **Never** expose raw ORM/ODM model instances to the controller or API response layer.
- **Never** include internal fields in a Response DTO unless explicitly required: no `password`, no session tokens, no internal audit columns, no foreign keys that are not meaningful to the consumer.
- Response DTOs are constructed in the service layer from the raw model/data. The controller receives the DTO and passes it directly to the response builder.
- Naming: `{Feature}Data` or `{Feature}Response` — e.g. `UserData`, `OrderSummary`, `ReportListItem`.
- Location: the project's designated DTO output directory (e.g. `app/DTOs/`, `src/dtos/`, `app/schemas/responses/` — documented in `DTO_STANDARDS.md`).
- Paginated lists return a `PaginatedResult<T>` wrapper that contains the DTO collection plus the standard pagination meta — never a raw paginator object exposed directly to the API layer.
- **Never** serialize a raw ORM model directly into an API response (e.g. `model.toJson()`, `model.toArray()`, `serialize(model)`). Map model → DTO explicitly.

---

## API response envelope rules

Every API response — success or error — must use the standard envelope. No raw JSON objects outside this shape.

**Success envelope:**
```json
{
  "success": true,
  "message": "<locale key resolved to string>",
  "data": "<DTO | DTO[] | null>",
  "meta": "<PaginationMeta | null>"
}
```

**Error envelope:**
```json
{
  "success": false,
  "message": "<locale key resolved to string>",
  "errors": "<{ field: [messages] } | null>",
  "code": "<ErrorCode constant value>",
  "meta": null
}
```

Rules:
- `success` is always a boolean — never omitted.
- `message` is always a human-readable string resolved from a locale key — never a raw exception message, never a technical error string, never empty.
- `data` is `null` on error responses. `errors` is `null` on success responses.
- `code` is always an `ErrorCode` constant value on error responses. Never a raw HTTP status description.
- `meta` carries pagination data on list responses; `null` on all other responses.
- HTTP status code is set correctly alongside the envelope — not always 200. The envelope `success: false` alone is not sufficient.
- **Never** return a raw exception message, stack trace, or internal error detail in `message` on production responses. Internal detail goes to the logger.
- All envelope construction happens in the base controller's response builder methods — never inline in a controller action.

---

## Pagination meta rules

Every paginated list response includes this exact meta shape — no variation:
```json
{
  "current_page": 1,
  "per_page": 25,
  "total": 142,
  "total_pages": 6,
  "has_next": true,
  "has_prev": false,
  "from": 1,
  "to": 25
}
```

- `per_page` must not exceed `PaginationConst.MAX_PER_PAGE`. Requests for higher values are capped silently.
- `per_page` defaults to `PaginationConst.DEFAULT_PER_PAGE` when not supplied.
- **Never** return an unbounded list from an API endpoint. Every list endpoint must accept and apply pagination.
- Cursor-based pagination is used for real-time feeds and large datasets (> 100k rows). Document in `DTO_STANDARDS.md` which endpoints use cursor vs offset pagination and why.

---

## Inter-layer data transfer rules

- Data flowing from controller → service: Request DTO (validated, typed).
- Data flowing from service → repository: typed query parameter objects or named method parameters — never raw dictionaries or untyped maps.
- Data flowing from repository → service: domain entity or scalar value — never a raw DB row dictionary.
- Data flowing from service → controller: Response DTO or typed collection — never raw model.
- Data flowing from controller → API response: envelope via the base controller's response builder.
- **Never** construct an untyped dictionary in a service method to pass data to a repository. Use named parameters or a typed query value object.

---

## Web (non-API) response rules

- All form submissions return either a redirect with a flash message (success/error) or a rendered view.
- Flash messages must use locale keys — never hardcoded strings.
- Validation errors are rendered using the framework's standard mechanism — never manually built error structures in a controller.
- View data is passed as a typed collection of DTOs or named scalar values — never raw ORM model instances passed directly to view templates.
- **Never** perform business logic inside a view template. Views receive pre-computed DTO data only.

---

## Naming and location standards

Exact paths depend on the project's language and framework — document in `DTO_STANDARDS.md`. Generic pattern:

| Artefact | Naming pattern | Typical location |
|---|---|---|
| Request DTO / input schema | `{Feature}{Action}Request` | `{src}/requests/` or `{src}/schemas/` |
| Response DTO | `{Feature}Data` | `{src}/dtos/` or `{src}/schemas/responses/` |
| Paginated result wrapper | `PaginatedResult` (generic/typed) | Shared DTOs/utils |
| Response builder methods | `success()`, `error()`, `paginated()`, `validationError()` | Base controller / response helper |
| Envelope shape | Documented with real examples | `DTO_STANDARDS.md` |

---

## Quality gate

ReviewDev loads this rules file for every PR.
A controller action that passes a raw unvalidated request body into a service call is flagged **Critical**.
A service method that returns a raw ORM/ODM model is flagged **Critical**.
An API response not using the standard envelope is flagged **Critical**.
A paginated list endpoint without a `meta` block is flagged **Important**.
A DTO that exposes `password` or any internal token field is flagged **Critical**.
