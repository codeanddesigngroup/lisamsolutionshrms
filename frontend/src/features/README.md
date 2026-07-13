# Feature Module Structure

Use `src/features` for business modules that are larger than a simple page. Route files under `src/app` should stay thin and only connect a URL to a feature page.

## Standard Layout

```txt
src/features/<domain>/<module>/
  api.ts
  types.ts
  utils.ts
  use<Module>.ts
  <Module>Page.tsx
  components/
    ModuleHeader.tsx
    ModuleFilters.tsx
    ModuleTable.tsx
    ModuleFormModal.tsx
```

## Rules

- Keep `src/app/**/page.tsx` as routing wrappers where practical.
- Put API calls in `api.ts`.
- Put DTOs and view model types in `types.ts`.
- Put reusable pure logic in `utils.ts`.
- Put stateful module orchestration in a hook.
- Put tables, filters, modals, and stats into focused components.
- Keep `src/components/ui` for shared generic UI only.
- Keep `src/components/layout` for application shell components only.

This makes modules easier to test, replace with real backend APIs, and scale without turning route files into large mixed-responsibility components.

## Migrated Modules

- `super-admin`: dashboard, companies, company create, admins, packages, invoices, settings
- `dashboard`: main, client, finance, HR, project
- `leads`: list, create, detail, edit, kanban
- `clients`: list, create, detail, edit
- `employees`: list, create, detail, edit, FAQ, FAQ categories
- `tasks`: list, create, detail, edit
- `projects`: list, create, detail, edit, and project detail submodules
- `invoices`: list, create, detail
- `payments`: list, create, detail
- `expenses`: list, create, detail
- `attendance`: list, create, bulk, date view, logs, summary, deduction report, settings
- `recruitment`: dashboard, jobs, applications, interviews, onboarding, archive, settings, and setup modules
- `payroll`: payroll list and payroll settings
- `reports`: overview, attendance, expense, finance, income/expense, leave, payroll, tasks, time-log
- `settings`: overview, account, app, attendance, company, finance, language, leave, notifications, profile, roles
- Remaining operational modules: member, events, leaves, holidays, notices, products, contracts, billing, currencies, estimates, credit notes, proposals, teams, designations, taxes, FAQ, profile, auth, notifications, project/task/lead/client settings, and other setup/config pages

All application `page.tsx` route files under `src/app` are now routing wrappers. Feature UI and page logic live under `src/features`.
