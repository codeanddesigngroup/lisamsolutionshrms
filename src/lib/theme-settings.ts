export type SidebarTheme = "dark" | "light" | "brand";
export type NavbarTheme = "light" | "brand";
export type InterfaceDensity = "comfortable" | "compact";

export type ThemeSettings = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  foregroundColor: string;
  sidebarTheme: SidebarTheme;
  navbarTheme: NavbarTheme;
  density: InterfaceDensity;
  radius: number;
};

export const THEME_STORAGE_KEY = "lisam_theme_settings";
export const THEME_CHANGE_EVENT = "lisam-theme-settings-change";

export const defaultThemeSettings: ThemeSettings = {
  primaryColor: "#03a9f3",
  secondaryColor: "#041731",
  backgroundColor: "#f6f7f9",
  foregroundColor: "#041731",
  sidebarTheme: "dark",
  navbarTheme: "light",
  density: "comfortable",
  radius: 8,
};

export const themePresets: Array<{ label: string; settings: Pick<ThemeSettings, "primaryColor" | "secondaryColor" | "backgroundColor" | "foregroundColor" | "sidebarTheme" | "navbarTheme"> }> = [
  {
    label: "Classic Blue",
    settings: {
      primaryColor: "#03a9f3",
      secondaryColor: "#041731",
      backgroundColor: "#f6f7f9",
      foregroundColor: "#041731",
      sidebarTheme: "dark",
      navbarTheme: "light",
    },
  },
  {
    label: "Emerald",
    settings: {
      primaryColor: "#00a878",
      secondaryColor: "#0f2f2a",
      backgroundColor: "#f5f8f7",
      foregroundColor: "#10231f",
      sidebarTheme: "dark",
      navbarTheme: "light",
    },
  },
  {
    label: "Indigo",
    settings: {
      primaryColor: "#4f46e5",
      secondaryColor: "#14162f",
      backgroundColor: "#f7f7fb",
      foregroundColor: "#17172f",
      sidebarTheme: "brand",
      navbarTheme: "light",
    },
  },
  {
    label: "Graphite",
    settings: {
      primaryColor: "#334155",
      secondaryColor: "#111827",
      backgroundColor: "#f4f5f7",
      foregroundColor: "#111827",
      sidebarTheme: "dark",
      navbarTheme: "brand",
    },
  },
];

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

const normalizeRadius = (value: unknown) => {
  const radius = Number(value);
  if (!Number.isFinite(radius)) return defaultThemeSettings.radius;
  return Math.min(Math.max(Math.round(radius), 2), 18);
};

export const normalizeThemeSettings = (value: unknown): ThemeSettings => {
  const source = value && typeof value === "object" ? (value as Partial<ThemeSettings>) : {};
  return {
    primaryColor: isHexColor(source.primaryColor) ? source.primaryColor : defaultThemeSettings.primaryColor,
    secondaryColor: isHexColor(source.secondaryColor) ? source.secondaryColor : defaultThemeSettings.secondaryColor,
    backgroundColor: isHexColor(source.backgroundColor) ? source.backgroundColor : defaultThemeSettings.backgroundColor,
    foregroundColor: isHexColor(source.foregroundColor) ? source.foregroundColor : defaultThemeSettings.foregroundColor,
    sidebarTheme: source.sidebarTheme === "light" || source.sidebarTheme === "brand" || source.sidebarTheme === "dark" ? source.sidebarTheme : defaultThemeSettings.sidebarTheme,
    navbarTheme: source.navbarTheme === "brand" || source.navbarTheme === "light" ? source.navbarTheme : defaultThemeSettings.navbarTheme,
    density: source.density === "compact" ? "compact" : defaultThemeSettings.density,
    radius: normalizeRadius(source.radius),
  };
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const readableTextColor = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#041731" : "#ffffff";
};

const shiftHex = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex);
  const shift = (value: number) => Math.min(255, Math.max(0, value + amount));
  return `#${[shift(r), shift(g), shift(b)].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
};

const sidebarTokens = (settings: ThemeSettings) => {
  if (settings.sidebarTheme === "light") {
    return {
      bg: "#ffffff",
      footer: "#f8fafc",
      text: "#334155",
      muted: "#64748b",
      hover: "rgba(3, 169, 243, 0.08)",
      hoverText: settings.primaryColor,
      border: "rgba(15, 23, 42, 0.08)",
      userButton: "#eef2f7",
      userIcon: "#475569",
    };
  }

  const bg = settings.sidebarTheme === "brand" ? settings.primaryColor : settings.secondaryColor;
  return {
    bg,
    footer: shiftHex(bg, -18),
    text: readableTextColor(bg),
    muted: settings.sidebarTheme === "brand" ? "rgba(255, 255, 255, 0.78)" : "#a6b0cf",
    hover: "rgba(255, 255, 255, 0.10)",
    hoverText: "#ffffff",
    border: "rgba(255, 255, 255, 0.12)",
    userButton: "rgba(255, 255, 255, 0.12)",
    userIcon: "#ffffff",
  };
};

const navbarTokens = (settings: ThemeSettings) => {
  if (settings.navbarTheme === "brand") {
    return {
      bg: settings.secondaryColor,
      text: readableTextColor(settings.secondaryColor),
      border: "rgba(255, 255, 255, 0.10)",
    };
  }

  return {
    bg: "#ffffff",
    text: "#1f2937",
    border: "#f2f2f3",
  };
};

export const applyThemeSettings = (input: ThemeSettings) => {
  if (typeof document === "undefined") return;

  const settings = normalizeThemeSettings(input);
  const root = document.documentElement;
  const primaryRgb = hexToRgb(settings.primaryColor);
  const sidebar = sidebarTokens(settings);
  const navbar = navbarTokens(settings);
  const controlHeight = settings.density === "compact" ? "36px" : "42px";
  const controlPadding = settings.density === "compact" ? "7px 10px" : "10px 12px";

  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--primary-rgb", `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`);
  root.style.setProperty("--secondary", settings.secondaryColor);
  root.style.setProperty("--background", settings.backgroundColor);
  root.style.setProperty("--foreground", settings.foregroundColor);
  root.style.setProperty("--border-color", "color-mix(in srgb, var(--foreground) 12%, transparent)");
  root.style.setProperty("--app-radius", `${settings.radius}px`);
  root.style.setProperty("--control-height", controlHeight);
  root.style.setProperty("--control-padding", controlPadding);
  root.style.setProperty("--sidebar-bg", sidebar.bg);
  root.style.setProperty("--sidebar-footer-bg", sidebar.footer);
  root.style.setProperty("--sidebar-text", sidebar.text);
  root.style.setProperty("--sidebar-muted", sidebar.muted);
  root.style.setProperty("--sidebar-hover-bg", sidebar.hover);
  root.style.setProperty("--sidebar-hover-text", sidebar.hoverText);
  root.style.setProperty("--sidebar-border", sidebar.border);
  root.style.setProperty("--sidebar-user-button-bg", sidebar.userButton);
  root.style.setProperty("--sidebar-user-icon", sidebar.userIcon);
  root.style.setProperty("--navbar-bg", navbar.bg);
  root.style.setProperty("--navbar-text", navbar.text);
  root.style.setProperty("--navbar-border", navbar.border);
  root.dataset.sidebarTheme = settings.sidebarTheme;
  root.dataset.navbarTheme = settings.navbarTheme;
  root.dataset.density = settings.density;
};

export const loadThemeSettings = () => {
  if (typeof window === "undefined") return defaultThemeSettings;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored ? normalizeThemeSettings(JSON.parse(stored)) : defaultThemeSettings;
  } catch {
    return defaultThemeSettings;
  }
};

export const persistThemeSettings = (settings: ThemeSettings) => {
  if (typeof window === "undefined") return;
  const normalized = normalizeThemeSettings(settings);
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized));
  applyThemeSettings(normalized);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: normalized }));
};

export const resetThemeSettings = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  }
  applyThemeSettings(defaultThemeSettings);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: defaultThemeSettings }));
  }
};
