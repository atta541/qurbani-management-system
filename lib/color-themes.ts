export const COLOR_THEME_STORAGE_KEY = "admin-color-theme";

export type ColorThemeId =
  | "zinc"
  | "blue"
  | "emerald"
  | "rose"
  | "violet"
  | "orange"
  | "mur-center";

export const colorThemes: {
  id: ColorThemeId;
  label: string;
  description: string;
  swatchClass: string;
}[] = [
  {
    id: "zinc",
    label: "Zinc",
    description: "Neutral default",
    swatchClass: "bg-zinc-900 dark:bg-zinc-100",
  },
  {
    id: "blue",
    label: "Blue",
    description: "Calm & trustworthy",
    swatchClass: "bg-blue-600",
  },
  {
    id: "emerald",
    label: "Emerald",
    description: "Fresh & clear",
    swatchClass: "bg-emerald-600",
  },
  {
    id: "rose",
    label: "Rose",
    description: "Warm accent",
    swatchClass: "bg-rose-600",
  },
  {
    id: "violet",
    label: "Violet",
    description: "Bold highlights",
    swatchClass: "bg-violet-600",
  },
  {
    id: "orange",
    label: "Orange",
    description: "Energetic",
    swatchClass: "bg-orange-500",
  },
  {
    id: "mur-center",
    label: "Mur Center",
    description: "Brand gold (#EAB650)",
    swatchClass: "bg-[#EAB650]",
  },
];

export function applyColorTheme(id: ColorThemeId) {
  const root = document.documentElement;
  if (id === "zinc") {
    root.removeAttribute("data-color-theme");
    try {
      localStorage.removeItem(COLOR_THEME_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  root.setAttribute("data-color-theme", id);
  try {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function readStoredColorTheme(): ColorThemeId {
  try {
    const v = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (
      v === "blue" ||
      v === "emerald" ||
      v === "rose" ||
      v === "violet" ||
      v === "orange" ||
      v === "mur-center"
    ) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return "zinc";
}
