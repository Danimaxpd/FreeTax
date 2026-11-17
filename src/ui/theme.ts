import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  fonts: {
    heading:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, 'Helvetica Neue', Arial, sans-serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, 'Helvetica Neue', Arial, sans-serif",
  },
  semanticTokens: {
    colors: {
      'bg.canvas': { default: '#f8fafc', _dark: '#1a1b26' },
      'bg.header': { default: '#1a1b26', _dark: '#16161e' },
      'bg.surface': { default: '#ffffff', _dark: '#24283b' },
      'bg.subtle': { default: '#f1f5f9', _dark: '#1f2335' },
      'bg.input': { default: '#ffffff', _dark: '#16161e' },
      'bg.accentSoft': { default: '#eef4ff', _dark: 'rgba(122, 162, 247, 0.14)' },
      'bg.successSoft': { default: '#ecfdf5', _dark: 'rgba(115, 218, 202, 0.14)' },
      'bg.dangerSoft': { default: '#fef2f2', _dark: 'rgba(247, 118, 142, 0.14)' },
      'border.subtle': { default: '#e2e8f0', _dark: '#3b4261' },
      'border.strong': { default: '#cbd5e1', _dark: '#414868' },
      'border.accent': { default: '#93c5fd', _dark: '#7aa2f7' },
      'border.success': { default: '#6ee7b7', _dark: '#73daca' },
      'text.primary': { default: '#1a1b26', _dark: '#c0caf5' },
      'text.heading': { default: '#0f172a', _dark: '#e2e8f0' },
      'text.secondary': { default: '#475569', _dark: '#a9b1d6' },
      'text.muted': { default: '#64748b', _dark: '#787c99' },
      'accent.primary': { default: '#2e7de9', _dark: '#7aa2f7' },
      'accent.cyan': { default: '#0284c7', _dark: '#7dcfff' },
      'accent.purple': { default: '#7c3aed', _dark: '#bb9af7' },
      'accent.success': { default: '#059669', _dark: '#73daca' },
      'accent.warning': { default: '#d97706', _dark: '#e0af68' },
      'accent.danger': { default: '#dc2626', _dark: '#f7768e' },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'bg.canvas',
        color: 'text.primary',
        fontVariantNumeric: 'tabular-nums',
      },
    },
  },
});

export default theme;
