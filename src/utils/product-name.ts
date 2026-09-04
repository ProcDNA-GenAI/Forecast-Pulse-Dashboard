const LEGACY_PRODUCT_NAME = "Liphendra";

export const DISPLAY_PRODUCT_NAME = "Lipfendra";

export function withDisplayProductName(value: string): string {
  if (!value.includes(LEGACY_PRODUCT_NAME)) return value;
  return value.split(LEGACY_PRODUCT_NAME).join(DISPLAY_PRODUCT_NAME);
}
