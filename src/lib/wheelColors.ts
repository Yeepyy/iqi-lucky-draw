export const DEFAULT_WHEEL_COLORS = [
  '#A8DADC',
  '#F4A6A6',
  '#CDB4DB',
  '#FFD6A5',
  '#BDE0FE',
  '#CDEAC0',
  '#FFCAD4',
  '#B8C0FF',
];

export function normalizeWheelColors(colors?: string[]) {
  const validColors = colors?.filter((color) => /^#[0-9a-f]{6}$/i.test(color)) || [];
  return validColors.length >= 2 ? validColors : DEFAULT_WHEEL_COLORS;
}
