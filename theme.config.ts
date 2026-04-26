/** @type {const} */
const themeColors = {
  primary:    { light: '#6D28D9', dark: '#C084FC' },   // richer violet in light
  secondary:  { light: '#DB2777', dark: '#F472B6' },   // vivid pink
  gold:       { light: '#B45309', dark: '#F59E0B' },   // warm amber
  background: { light: '#FAFAF8', dark: '#0D0D0F' },   // warm near-white / near-black
  surface:    { light: '#FFFFFF', dark: '#1A1A2E' },
  surface2:   { light: '#F4EFFE', dark: '#16213E' },   // soft lavender / deep navy
  foreground: { light: '#1A1526', dark: '#F1F0FF' },   // warm dark / soft white
  muted:      { light: '#6B6880', dark: '#8B8BA7' },
  border:     { light: '#EAE3F7', dark: '#2D2D4E' },   // soft purple border
  success:    { light: '#16A34A', dark: '#4ADE80' },
  warning:    { light: '#D97706', dark: '#FBBF24' },
  error:      { light: '#DC2626', dark: '#F87171' },
  tint:       { light: '#6D28D9', dark: '#C084FC' },
};

module.exports = { themeColors };
