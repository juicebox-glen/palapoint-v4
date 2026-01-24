# PalaPoint V4 - Design System Audit

**Audit Date:** 2024  
**Scope:** All files in `app/`, `components/`, and `app/globals.css`

---

## Executive Summary

The current design system shows **good consistency in color palette** but has **significant inconsistencies in spacing, typography, and component styles**. All values are hardcoded with no CSS variables, making maintenance difficult.

**Key Findings:**
- ✅ Consistent dark theme color palette
- ⚠️ No CSS variables (all hardcoded values)
- ⚠️ Inconsistent spacing scale
- ⚠️ Typography lacks clear hierarchy
- ⚠️ Component styles duplicated across files
- ⚠️ No standardized breakpoint system

---

## 1. COLOURS

### Hex Colours Used

| Color | Hex | Usage | Frequency |
|-------|-----|-------|-----------|
| **Primary Background** | `#1a1a2e` | Main page background | Very High |
| **Pure Black** | `#000` / `#000000` | Court display background | Medium |
| **White** | `#fff` / `#ffffff` | Text, QR code foreground | Very High |
| **Success/Green** | `#22c55e` | Primary buttons, active states, serving indicator | Very High |
| **Success Dark** | `#16a34a` | Button hover states | High |
| **Error/Red** | `#ef4444` | Error messages, Team B colors | High |
| **Error Dark** | `#dc2626` | Button hover states | Medium |
| **Blue Primary** | `#3b82f6` | Team A colors | Medium |
| **Blue Dark** | `#2563eb` | Button hover states | Medium |
| **Warning/Amber** | `#f59e0b` | Tiebreak indicator | Low |

### RGBA Values Used

| Color | RGBA | Usage | Frequency |
|-------|------|-------|-----------|
| **Error Background** | `rgba(239, 68, 68, 0.2)` | Error message backgrounds | High |
| **Error Border** | `rgba(239, 68, 68, 0.3)` | Team B borders | Medium |
| **Success Background** | `rgba(34, 197, 94, 0.2)` | Active/selected states | High |
| **Success Background Light** | `rgba(34, 197, 94, 0.1)` | Hints, subtle highlights | Medium |
| **Success Background Medium** | `rgba(34, 197, 94, 0.3)` | Selected player wrapper | Low |
| **White Overlay Light** | `rgba(255, 255, 255, 0.05)` | Inactive buttons | Medium |
| **White Overlay Medium** | `rgba(255, 255, 255, 0.1)` | Input backgrounds, cards | Very High |
| **White Overlay Medium+** | `rgba(255, 255, 255, 0.15)` | Edit input backgrounds | Low |
| **White Overlay Dark** | `rgba(255, 255, 255, 0.2)` | Borders, secondary buttons | Very High |
| **White Overlay Darker** | `rgba(255, 255, 255, 0.3)` | Button hover states | Medium |
| **White Text Muted** | `rgba(255, 255, 255, 0.5)` | Placeholder text | Medium |
| **White Text Muted+** | `rgba(255, 255, 255, 0.7)` | Secondary text, links | Medium |
| **Blue Background** | `rgba(59, 130, 246, 0.1)` | Team A backgrounds | Medium |
| **Blue Border** | `rgba(59, 130, 246, 0.3)` | Team A borders | Medium |
| **Black Overlay** | `rgba(0, 0, 0, 0.7)` | Modal overlays | Low |

### Color Inconsistencies

1. **Team Colors:**
   - Team A: Uses `#3b82f6` (blue) in some places, but also `rgba(59, 130, 246, 0.1)` for backgrounds
   - Team B: Uses `#ef4444` (red) consistently
   - **Issue:** Team colors should be standardized

2. **Button States:**
   - Primary buttons: `#22c55e` → `#16a34a` on hover
   - Danger buttons: `#ef4444` → `#dc2626` on hover
   - Blue buttons: `#3b82f6` → `#2563eb` on hover
   - **Issue:** Hover states use different darkening ratios

3. **Background Variations:**
   - Main background: `#1a1a2e` (most pages)
   - Court display: `#000` (full black)
   - **Issue:** Two different dark backgrounds without clear rationale

### CSS Variables

**Current Status:** ❌ **NONE** - All colors are hardcoded

---

## 2. TYPOGRAPHY

### Font Families

**Primary Font Stack:**
```css
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
```
- Used in: `app/globals.css` (global)
- **Status:** ✅ Consistent across all pages

### Font Sizes

| Size (rem) | Size (px) | Usage | Frequency |
|------------|-----------|-------|-----------|
| `0.85rem` | 13.6px | Small notes, edit hints | Low |
| `0.9rem` | 14.4px | Subtitles, small text, modal text | Medium |
| `1rem` | 16px | Body text, labels, default | High |
| `1.1rem` | 17.6px | Button text, player names | Very High |
| `1.2rem` | 19.2px | Subtitles, section labels | Medium |
| `1.25rem` | 20px | Large buttons, CTA buttons | Medium |
| `1.5rem` | 24px | Page titles, team names (spectator) | High |
| `1.75rem` | 28px | Responsive title (mobile) | Low |
| `2rem` | 32px | Main page titles | High |
| `2.5rem` | 40px | Court idle name (desktop) | Low |
| `3rem` | 48px | Court idle main text, team names (court) | Low |
| `4rem` | 64px | Tiebreak indicator (court) | Low |
| `6rem` | 96px | Games display (court) | Low |
| `20rem` | 320px | Points display (court) | Low |

**Dynamic Sizes (ScoreDisplay):**
- Court variant: `3rem` (team names), `20rem` (points), `6rem` (games), `4rem` (tiebreak)
- Spectator variant: `1.5rem` (team names), `6rem` (points), `3rem` (games), `2rem` (tiebreak)
- Responsive: `1.2rem` (team names), `4rem` (points), `2rem` (games) at `max-width: 768px`

### Font Weights

| Weight | Usage | Frequency |
|--------|-------|-----------|
| `400` (normal) | Default body text | High |
| `600` (semibold) | Labels, buttons, titles | Very High |
| `bold` (700) | Main titles, tiebreak indicator | Medium |

### Line Heights

| Value | Usage | Frequency |
|-------|-------|-----------|
| `1` | Large point displays (court) | Low |
| `1.2` | Court idle main text | Low |
| Default (1.5) | Most text | Very High |

### Typography Inconsistencies

1. **Title Sizes:**
   - Main titles: `2rem` (most pages)
   - Some titles: `1.5rem` (error states, loading)
   - Court idle: `2.5rem` (desktop), `2rem` (mobile)
   - **Issue:** No clear hierarchy system

2. **Button Text:**
   - Primary buttons: `1.1rem`, `1.25rem`, `1.5rem` (inconsistent)
   - **Issue:** Should standardize button text sizes

3. **Body Text:**
   - Most text: `1rem` (default)
   - Some labels: `1.2rem`
   - **Issue:** Unclear when to use which size

### CSS Variables

**Current Status:** ❌ **NONE** - All typography values are hardcoded

---

## 3. SPACING

### Padding Values

| Value | Usage | Frequency |
|-------|-------|-----------|
| `0.25rem` | Small links, tight spacing | Low |
| `0.5rem` | Small elements, set scores | Medium |
| `0.75rem` | Inputs, buttons (standard) | Very High |
| `1rem` | Cards, sections, standard spacing | Very High |
| `1.5rem` | Larger sections, form groups | High |
| `2rem` | Page containers, large sections | Very High |
| `2px` | Selected state wrapper | Low |

**Compound Padding:**
- `0.75rem 1rem` - Inputs, buttons (horizontal emphasis)
- `0.75rem 1.5rem` - Buttons (standard)
- `0.75rem 2rem` - Large buttons, PIN input
- `1rem 1.5rem` - Large buttons
- `1.5rem 1rem` - Page containers (responsive)
- `2rem 1rem` - Page containers (standard)

### Margin Values

| Value | Usage | Frequency |
|-------|-------|-----------|
| `-0.5rem` | Negative margin for "vs" text | Low |
| `0` | Reset margins | Medium |
| `0.5rem` | Small spacing | Medium |
| `1rem` | Standard spacing | High |
| `1.5rem` | Section spacing | High |
| `2rem` | Large section spacing | Very High |

**Compound Margin:**
- `0 auto` - Centering containers (Very High)
- `margin-bottom: 0.5rem` - Small vertical spacing
- `margin-bottom: 1rem` - Standard vertical spacing
- `margin-bottom: 1.5rem` - Section spacing
- `margin-bottom: 2rem` - Large section spacing
- `margin-top: 0.5rem` - Small top spacing
- `margin-top: 1rem` - Standard top spacing

### Gap Values (Flexbox/Grid)

| Value | Usage | Frequency |
|-------|-------|-----------|
| `0.5rem` | Tight spacing, small groups | Medium |
| `0.75rem` | Standard form spacing | High |
| `1rem` | Standard spacing | Very High |
| `1.5rem` | Larger groups | High |
| `2rem` | Large groups, page sections | High |
| `3rem` | Very large spacing (court idle) | Low |
| `4rem` | Team names, games display | Low |
| `8rem` | Points display (court) | Low |

### Spacing Inconsistencies

1. **No Clear Scale:**
   - Values jump around: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`
   - **Issue:** Should use a consistent scale (e.g., 0.25rem increments or 8px base)

2. **Container Padding:**
   - Some pages: `2rem 1rem`
   - Some pages: `1.5rem 1rem`
   - Some pages: `2rem`
   - **Issue:** Inconsistent page container padding

3. **Button Padding:**
   - Standard: `0.75rem 1.5rem`
   - Large: `0.75rem 2rem` or `1rem 1.5rem`
   - Small: `0.75rem`
   - **Issue:** No clear button size system

4. **Gap Values:**
   - Form groups: `0.75rem`, `1rem`, `1.5rem`, `2rem`
   - **Issue:** Too many similar values without clear purpose

### CSS Variables

**Current Status:** ❌ **NONE** - All spacing values are hardcoded

---

## 4. COMPONENTS

### Buttons

#### Primary Buttons
- **Background:** `#22c55e`
- **Text Color:** `#fff`
- **Hover:** `#16a34a`
- **Padding:** `0.75rem 1.5rem` (standard), `0.75rem 2rem` (large), `1rem 1.5rem` (extra large)
- **Font Size:** `1.1rem` (standard), `1.25rem` (large), `1.5rem` (extra large)
- **Font Weight:** `600`
- **Border Radius:** `0.5rem`
- **Min Height:** `48px` (standard)
- **States:** `:disabled` (opacity: 0.5), `:active` (scale: 0.98)

#### Secondary Buttons
- **Background:** `rgba(255, 255, 255, 0.2)`
- **Text Color:** `#fff`
- **Hover:** `rgba(255, 255, 255, 0.3)`
- **Padding:** `0.75rem 1.5rem`
- **Font Size:** `1.1rem`
- **Font Weight:** `600`
- **Border Radius:** `0.5rem`
- **Min Height:** `48px`

#### Danger Buttons
- **Background:** `#ef4444`
- **Text Color:** `#fff`
- **Hover:** `#dc2626`
- **Padding:** `0.75rem 1.5rem`
- **Font Size:** `1.1rem`
- **Font Weight:** `600`
- **Border Radius:** `0.5rem`
- **Min Height:** `48px`

#### Score Buttons (Control Panel)
- **Team A:** `#3b82f6` → `#2563eb` (hover)
- **Team B:** `#ef4444` → `#dc2626` (hover)
- **Min Height:** `80px` (desktop), `70px` (mobile)
- **Font Size:** `1.5rem` (desktop), `1.25rem` (mobile)
- **Font Weight:** `bold`

#### Link Buttons
- **Background:** `transparent`
- **Text Color:** `rgba(255, 255, 255, 0.7)`
- **Text Decoration:** `underline`
- **Padding:** `0.5rem`
- **Min Height:** `auto`

### Inputs

#### Text Inputs
- **Background:** `rgba(255, 255, 255, 0.1)`
- **Border:** `2px solid rgba(255, 255, 255, 0.2)`
- **Border Radius:** `0.5rem`
- **Padding:** `0.75rem`
- **Font Size:** `1rem`
- **Color:** `#fff`
- **Min Height:** `48px`
- **Focus:** `border-color: #22c55e`
- **Placeholder:** `rgba(255, 255, 255, 0.5)`

#### PIN Input
- **Padding:** `1.5rem`
- **Font Size:** `2rem`
- **Letter Spacing:** `0.5rem`
- **Text Align:** `center`
- **Border Radius:** `0.75rem`

#### Select Inputs
- Same as text inputs

### Cards/Containers

#### Page Container
- **Max Width:** `400px`, `500px`, `600px`, `800px` (inconsistent)
- **Margin:** `0 auto`
- **Padding:** `2rem 1rem` (most), `1.5rem 1rem` (some)

#### Team Cards
- **Team A:**
  - Background: `rgba(59, 130, 246, 0.1)`
  - Border: `2px solid rgba(59, 130, 246, 0.3)`
- **Team B:**
  - Background: `rgba(239, 68, 68, 0.1)`
  - Border: `2px solid rgba(239, 68, 68, 0.3)`
- **Padding:** `1rem`
- **Border Radius:** `0.5rem`
- **Gap:** `0.75rem` (internal)

#### Error Messages
- **Background:** `rgba(239, 68, 68, 0.2)`
- **Color:** `#ef4444`
- **Padding:** `1rem`
- **Border Radius:** `0.5rem`
- **Text Align:** `center`

#### Modals
- **Overlay:** `rgba(0, 0, 0, 0.7)`
- **Background:** `#1a1a2e`
- **Border:** `2px solid rgba(255, 255, 255, 0.2)`
- **Border Radius:** `1rem`
- **Padding:** `2rem`
- **Max Width:** `400px`

### Headers/Titles

#### Page Title
- **Font Size:** `2rem`
- **Font Weight:** `600` or `bold`
- **Margin Bottom:** `2rem`
- **Text Align:** `center` (most)

#### Section Label
- **Font Size:** `1.2rem`
- **Font Weight:** `600`
- **Opacity:** `0.9`
- **Margin Bottom:** `1rem`

### Component Inconsistencies

1. **Button Sizes:**
   - No clear size system (small, medium, large)
   - Different padding/font-size combinations
   - **Issue:** Should standardize button variants

2. **Container Max Widths:**
   - `400px`, `500px`, `600px`, `800px` used inconsistently
   - **Issue:** Should use standard container sizes

3. **Input Heights:**
   - Most: `48px` min-height
   - PIN: `1.5rem` padding (no min-height)
   - **Issue:** Should standardize input heights

---

## 5. LAYOUT PATTERNS

### Max Widths

| Width | Usage | Frequency |
|-------|-------|-----------|
| `400px` | Small modals, narrow containers | Medium |
| `500px` | Standard page containers | High |
| `600px` | Wide page containers | High |
| `800px` | Control panel container | Low |

### Breakpoints

| Breakpoint | Usage | Frequency |
|------------|-------|-----------|
| `640px` | Mobile adjustments (setup, control) | Low |
| `768px` | Tablet adjustments (court, score display) | Low |

**Issues:**
- Only 2 breakpoints used
- Not consistently applied
- No mobile-first approach

### Flexbox/Grid Patterns

#### Common Patterns:
1. **Centered Container:**
   ```css
   display: flex;
   align-items: center;
   justify-content: center;
   min-height: 100vh;
   ```

2. **Vertical Stack:**
   ```css
   display: flex;
   flex-direction: column;
   gap: 1rem; /* or 1.5rem, 2rem */
   ```

3. **Two-Column Grid:**
   ```css
   display: grid;
   grid-template-columns: 1fr 1fr;
   gap: 1rem;
   ```

4. **Horizontal Layout:**
   ```css
   display: flex;
   gap: 4rem; /* or 2rem, 8rem */
   ```

### Layout Inconsistencies

1. **No Standard Breakpoint System:**
   - Only `640px` and `768px` used
   - **Issue:** Should define standard breakpoints (sm, md, lg, xl)

2. **Container Widths:**
   - Multiple max-widths without clear purpose
   - **Issue:** Should standardize container sizes

3. **Gap Values:**
   - Many different gap values (`0.5rem`, `1rem`, `1.5rem`, `2rem`, `4rem`, `8rem`)
   - **Issue:** Should use consistent spacing scale

---

## 6. CSS VARIABLES

### Current Status

**❌ NO CSS VARIABLES EXIST**

All design tokens are hardcoded directly in component styles.

### What Should Be Variables

Based on the audit, the following should be CSS variables:

#### Colors
- Primary background
- Text colors (primary, secondary, muted)
- Success/error/warning colors
- Team colors (A and B)
- Overlay opacities

#### Typography
- Font sizes (scale)
- Font weights
- Line heights

#### Spacing
- Padding scale
- Margin scale
- Gap scale

#### Components
- Border radius
- Button sizes
- Input heights
- Container max-widths

#### Breakpoints
- Mobile, tablet, desktop breakpoints

---

## 7. SUMMARY

### What's Consistent ✅

1. **Color Palette:**
   - Dark theme (`#1a1a2e`) used consistently
   - Success green (`#22c55e`) for primary actions
   - Error red (`#ef4444`) for errors
   - White overlays for subtle backgrounds

2. **Font Family:**
   - System font stack used everywhere

3. **Border Radius:**
   - `0.5rem` used for most elements
   - `0.75rem` for PIN input
   - `1rem` for modals

4. **Min Heights:**
   - `48px` standard for buttons and inputs

5. **Overall Aesthetic:**
   - Dark theme with good contrast
   - Consistent use of opacity for overlays

### What's Inconsistent ⚠️

1. **Spacing Scale:**
   - Too many similar values without clear purpose
   - No systematic scale (0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem)

2. **Typography Scale:**
   - Font sizes jump around (0.85rem to 20rem)
   - No clear hierarchy system

3. **Component Variants:**
   - Buttons have inconsistent sizes
   - Containers use different max-widths
   - No clear component size system

4. **Breakpoints:**
   - Only 2 breakpoints used
   - Not consistently applied
   - No mobile-first approach

5. **Team Colors:**
   - Team A uses blue but inconsistently
   - Should standardize team color usage

### Recommended Design Tokens

#### Colors
```css
--color-bg-primary: #1a1a2e;
--color-bg-court: #000;
--color-text-primary: #fff;
--color-text-secondary: rgba(255, 255, 255, 0.7);
--color-text-muted: rgba(255, 255, 255, 0.5);
--color-success: #22c55e;
--color-success-dark: #16a34a;
--color-error: #ef4444;
--color-error-dark: #dc2626;
--color-team-a: #3b82f6;
--color-team-b: #ef4444;
--color-overlay-light: rgba(255, 255, 255, 0.1);
--color-overlay-medium: rgba(255, 255, 255, 0.2);
--color-overlay-dark: rgba(0, 0, 0, 0.7);
```

#### Typography
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
--font-size-xs: 0.85rem;
--font-size-sm: 0.9rem;
--font-size-base: 1rem;
--font-size-lg: 1.1rem;
--font-size-xl: 1.2rem;
--font-size-2xl: 1.5rem;
--font-size-3xl: 2rem;
--font-weight-normal: 400;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

#### Spacing
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 0.75rem;
--spacing-lg: 1rem;
--spacing-xl: 1.5rem;
--spacing-2xl: 2rem;
--spacing-3xl: 3rem;
```

#### Components
```css
--radius-sm: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
--input-height: 48px;
--button-height: 48px;
--button-height-lg: 80px;
```

#### Layout
```css
--container-sm: 400px;
--container-md: 500px;
--container-lg: 600px;
--container-xl: 800px;
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
```

---

## 8. RECOMMENDATIONS

### Immediate Actions

1. **Create CSS Variables File**
   - Create `app/design-tokens.css` with all design tokens
   - Import in `globals.css`

2. **Standardize Spacing Scale**
   - Use 0.25rem increments (4px base)
   - Define clear spacing scale

3. **Standardize Typography Scale**
   - Create clear type scale
   - Define heading hierarchy

4. **Standardize Component Sizes**
   - Define button variants (sm, md, lg)
   - Standardize container max-widths
   - Create input size variants

5. **Create Breakpoint System**
   - Define standard breakpoints
   - Use mobile-first approach

### Long-term Improvements

1. **Component Library**
   - Extract reusable components
   - Create component variants

2. **Design System Documentation**
   - Document all tokens
   - Create usage guidelines

3. **Theme Support**
   - Consider light/dark theme variables
   - Make colors theme-aware

---

## Conclusion

The current design system has a **solid foundation** with consistent colors and overall aesthetic, but lacks **systematic organization**. Implementing CSS variables and standardizing spacing, typography, and component sizes will significantly improve maintainability and consistency.

**Priority:** High - Implementing design tokens should be the next major refactoring task.
