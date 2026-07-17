export const MapperUtils = {
  nullToUndefined<T>(value: T | null | undefined): T | undefined {
    return value === null || value === undefined ? undefined : value;
  },
  undefinedToNull<T>(value: T | null | undefined): T | null {
    return value === undefined || value === null ? null : value;
  },
};
