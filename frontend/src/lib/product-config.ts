export const productMode = process.env.NEXT_PUBLIC_PRODUCT_MODE || "internal";

export const isSaasBillingEnabled =
  productMode === "saas" || process.env.NEXT_PUBLIC_ENABLE_SAAS_BILLING === "true";

export const isSaasBillingPath = (pathname: string) =>
  pathname === "/billing" ||
  pathname.startsWith("/billing/") ||
  pathname === "/super-admin/packages" ||
  pathname.startsWith("/super-admin/packages/") ||
  pathname === "/super-admin/invoices" ||
  pathname.startsWith("/super-admin/invoices/");
