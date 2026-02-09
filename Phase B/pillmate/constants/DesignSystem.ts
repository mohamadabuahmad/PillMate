/**
 * Design System
 * 
 * Centralized design tokens for the PillMate app including:
 * - Color palette (light/dark mode support)
 * - Typography scale and weights
 * - Spacing system
 * - Border radius values
 * - Shadow definitions
 * - Layout constants (padding, margins)
 * 
 * Ensures consistent design across the entire application.
 */
// Modern, Neutral Design System for PillMate
// Professional color palette with perfect typography

export const DesignSystem = {
  // Color Palette - Modern Neutral
  colors: {
    // Primary
    primary: '#4A90E2', // Soft blue - professional and trustworthy
    primaryDark: '#357ABD',
    primaryLight: '#6BA3E8',
    
    // Neutrals
    background: '#FAFBFC', // Very light gray background
    surface: '#FFFFFF', // Pure white for cards
    surfaceElevated: '#FFFFFF', // For elevated cards
    
    // Text
    textPrimary: '#1A1F36', // Dark gray for main text
    textSecondary: '#6B7280', // Medium gray for secondary text
    textTertiary: '#9CA3AF', // Light gray for hints
    
    // Borders & Dividers
    border: '#E5E7EB', // Light gray borders
    divider: '#F3F4F6', // Very light dividers
    
    // Status Colors
    success: '#10B981', // Green
    error: '#EF4444', // Red
    warning: '#F59E0B', // Amber
    info: '#3B82F6', // Blue
    
    // Interactive
    interactive: '#4A90E2',
    interactiveHover: '#357ABD',
    interactivePressed: '#2E6BA5',
    
    // Disabled
    disabled: '#D1D5DB',
    disabledText: '#9CA3AF',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Special
    accent: '#6366F1', // Purple accent for highlights
  },
  
  // Typography
  typography: {
    // Font Families (using system fonts for best performance)
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    
    // Font Sizes
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    
    // Font Weights
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    
    // Letter Spacing
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },
  
  // Border Radius
  borderRadius: {
    sm: 8,
    base: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  },
  
  // Layout
  layout: {
    containerPadding: 20,
    cardPadding: 20,
    inputPadding: 16,
    buttonPadding: 16,
    headerHeight: 60,
  },
};

/**
 * Get theme colors based on dark mode and high contrast settings
 * 
 * Returns a color palette adapted for:
 * - Light mode (default)
 * - Dark mode (when isDark is true)
 * - High contrast mode (for accessibility)
 * 
 * @param isDark - Whether dark mode is enabled
 * @param highContrast - Whether high contrast mode is enabled (default: false)
 * @returns Color palette object with all theme colors
 */
export const getThemeColors = (isDark: boolean, highContrast: boolean = false) => {
  if (isDark) {
    const baseColors = {
      ...DesignSystem.colors,
      background: '#0F172A',
      surface: '#1E293B',
      surfaceElevated: '#334155',
      textPrimary: '#F1F5F9',
      textSecondary: '#CBD5E1',
      textTertiary: '#94A3B8',
      border: '#334155',
      divider: '#1E293B',
      primary: '#6366F1', // Brighter primary for dark mode
      success: '#22C55E',
      error: '#EF4444',
      warning: '#F59E0B',
    };

    if (highContrast) {
      return {
        ...baseColors,
        textPrimary: '#FFFFFF',
        textSecondary: '#E0E0E0',
        border: '#FFFFFF',
        primary: '#4A9EFF',
        success: '#00FF00',
        error: '#FF0000',
        warning: '#FFAA00',
      };
    }

    return baseColors;
  }

  const baseColors = {
    ...DesignSystem.colors,
  };

  if (highContrast) {
    return {
      ...baseColors,
      textPrimary: '#000000',
      textSecondary: '#333333',
      border: '#000000',
      primary: '#0066CC',
      success: '#008000',
      error: '#CC0000',
      warning: '#CC6600',
    };
  }

  return baseColors;
};
