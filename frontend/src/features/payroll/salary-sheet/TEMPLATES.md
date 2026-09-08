# Salary sheet templates

`/payroll/salary-sheet/templates` manages department field lists. Add existing or custom fields, rename them, and remove them with the delete icon. Department assignment uses a dropdown and removable labels.

Templates are saved in browser localStorage under `hrms-salary-templates-v1`. Existing saved templates remain readable; previously disabled fields are omitted when loading the field list. Calculation settings and previews are not exposed.

`/payroll/salary-sheet/create` retains the original sheet layout. Penalties now opens an entry breakdown. Other existing numeric columns use a breakdown when their department template has multiple-entry types. Template-only custom columns are not inserted into the original sheet. Backend payroll is unchanged.

Expand a field's multiple-entry section in Templates to add named types. Save the template, then choose the same department on Create Salary Sheet. The amount cell opens a dialog where each entry has a type/reason and amount. Apply total sums the entries once into the existing numeric field. Cancel leaves the previous amount unchanged. Existing scalar amounts are preserved as an Existing amount entry when first opened.

Breakdowns are stored with manual adjustments under `salary-sheet-manual-v1` when creating a sheet. The salary register can reopen/edit these entries and persists changes locally. CSV retains the single combined amount. Types provide suggestions; individual entries preserve their own reason text.

Departments are loaded from the existing departments API. No templates or employee salary amounts are seeded. Existing user-saved templates remain available in browser storage.