---
name: Clinical Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#545c72'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c748b'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  stats-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-desktop: 32px
  container-padding-mobile: 16px
  gutter: 24px
  sidebar-width: 260px
  topbar-height: 64px
---

## Brand & Style
The design system is engineered for high-stakes healthcare environments where clarity, speed of cognition, and trust are paramount. The personality is **Professional, Systematic, and Calm**, utilizing a **Modern Corporate** aesthetic that leans heavily into functional minimalism. 

The visual strategy prioritizes information density without clutter, ensuring that medical staff can navigate complex patient data with minimal cognitive load. The emotional response should be one of reliability and organized efficiency, achieved through a structured grid, purposeful whitespace, and a high-contrast functional color palette.

## Colors
The color palette is anchored by a clinical **Cerulean Blue** (#0284C7), chosen for its associations with technology and healthcare stability. 

- **Surface Colors:** The primary background uses #F8FAFC to reduce eye strain during long shifts, while white (#FFFFFF) is reserved for interactive cards and containers.
- **Semantic Colors:** Success, Warning, and Error colors are strictly reserved for status communication (e.g., patient vitals, payment status, or system alerts). 
- **Neutral Scale:** A rigorous slate-based neutral scale ensures secondary information and labels maintain clear hierarchy without competing with primary actions.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-heavy interfaces. 

- **Hierarchy:** We use a strict typographic scale where `body-md` is the workhorse for all patient records and table data. 
- **Numerical Data:** For lab results and vital signs, tabular figures should be enabled via OpenType features to ensure columns of numbers align perfectly.
- **Labels:** Small caps with increased letter spacing (`label-md`) are used for metadata headers to distinguish them from actionable content.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains fixed at 260px, while the main content area utilizes a fluid grid to maximize the visibility of wide data tables.

- **Grid:** A 12-column system for desktop, collapsing to 1 column for mobile.
- **Rhythm:** All spacing (padding, margins) must be increments of 4px. Use 24px (6 units) for standard element spacing and 32px (8 units) for major section padding.
- **Responsive Behavior:** On tablet, the sidebar collapses into a rail or hamburger menu to prioritize the workspace.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Ambient Shadows**. 

1. **Level 0 (Background):** #F8FAFC - The base canvas.
2. **Level 1 (Cards/Sidebar):** #FFFFFF - Uses a 1px border (#E2E8F0) and a very soft shadow (Y: 1px, Blur: 3px, Opacity: 0.05) to separate content from the background.
3. **Level 2 (Modals/Dropdowns):** Elevated with a more pronounced shadow (Y: 10px, Blur: 15px, Opacity: 0.1) to indicate temporary, high-priority interaction layers.
4. **Active State:** Use a 2px primary-colored left border for active sidebar items or selected table rows to provide a clear visual "anchor."

## Shapes
The shape language uses a **Rounded** (0.5rem) standard to soften the clinical environment while maintaining a professional structure.

- **Small Components:** Checkboxes and small tags use 4px (Soft) to maintain precision.
- **Standard Components:** Buttons, Input Fields, and Cards use 8px (Rounded).
- **Large Components:** Modals and large empty-state containers use 12px-16px (Rounded-LG/XL) for a modern, approachable feel.

## Components

### Buttons
- **Primary:** Solid #0284C7 with white text. 8px corner radius. Bold weight.
- **Secondary:** Ghost style. Transparent background, 1px #CBD5E1 border, #475569 text.
- **Danger:** Solid #E11D48 for destructive actions like "Delete Record" or "Cancel Surgery."

### Inputs & Pickers
- **Text Fields:** White background, 1px #CBD5E1 border. On focus: 1px #0284C7 border with a 3px light blue focus ring (20% opacity).
- **Search Bars:** Always include a leading magnifying glass icon in #94A3B8.
- **Date/Time Pickers:** Must use a calendar icon suffix; dropdowns should follow Level 2 elevation rules.

### Status Badges
- **General:** Small caps, semi-bold, 12px.
- **Variants:** 
  - *Paid/Scheduled:* Emerald green text on 10% opacity green background.
  - *Pending:* Amber text on 10% opacity amber background.
  - *Urgent:* Rose text on 10% opacity rose background.

### Tables
- **Header:** Light gray background (#F1F5F9), sticky position, 12px uppercase labels.
- **Rows:** 1px bottom border only (#F1F5F9). Zebra striping is discouraged; use hover states (Background: #F8FAFC) instead for row tracking.
- **Pagination:** Center-aligned at the bottom of the card with "Results per page" selector on the left.

### Navigation
- **Sidebar:** Dark Slate (#0F172A) background with high-contrast white text for high-end professional feel, OR Light gray (#F8FAFC) for a more open clinical feel.
- **Top Bar:** Pure white, contains breadcrumbs on the left and User Profile/Notifications on the right.

### Notifications (Toasts)
- Positioned at Top-Right. 
- Use a 4px left-accent border matching the semantic color of the message (Success/Error/Warning).