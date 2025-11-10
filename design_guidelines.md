# Design Guidelines: Athletic Performance Tracking System

## Design Approach
**System:** Material Design-inspired approach optimized for sports performance tracking
**Justification:** Data-heavy application requiring clear forms, real-time graphs, and efficient workflows. Prioritizes functionality and data visibility over decorative elements.
**Reference:** Draw inspiration from Strava's data clarity and Notion's clean forms

## Core Design Principles
1. **Data First**: Prioritize readability of numbers, graphs, and test results
2. **Efficiency**: Minimize clicks to record tests and view athlete progress
3. **Real-time Feedback**: Immediate visual response as users input data
4. **Professional Clarity**: Clean, distraction-free interface for coaches/trainers

## Typography
**Primary Font:** Inter (Google Fonts) - excellent readability for data
**Secondary Font:** Roboto Mono - for numerical data and measurements

**Hierarchy:**
- Page Headers: text-3xl/font-bold (36px)
- Section Headers: text-xl/font-semibold (20px)
- Data Labels: text-sm/font-medium (14px, uppercase tracking)
- Body Text: text-base (16px)
- Numerical Data: text-lg/font-mono (18px, tabular-nums)
- Small Metadata: text-xs/text-gray-600 (12px)

## Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, and 8 (p-4, gap-6, m-8, etc.)
**Container:** max-w-7xl with px-4 padding
**Grid Structure:** 12-column grid for responsive layouts

**Page Structure:**
- Top Navigation: h-16 with shadow-sm
- Main Content Area: py-8 px-4
- Side Panels (when needed): w-80 fixed
- Form Sections: space-y-6
- Card Spacing: gap-4 for grids

## Component Library

### Navigation
**Top Bar:**
- Fixed header with navigation links (Athletes, Tests, Dashboard)
- User profile icon (top-right)
- Consistent height: h-16
- Shadow for elevation: shadow-sm

### Dashboard Layout
**Three-Column Grid (Desktop):**
- Recent Tests (left): w-full lg:w-1/3
- Active Graphs (center): w-full lg:w-2/3
- Quick Actions Sidebar: w-80 (collapsible on mobile)

### Forms
**Athlete Registration:**
- Full-width inputs with clear labels above
- Input height: h-12
- Rounded corners: rounded-lg
- Focus states with border emphasis
- Required fields marked with asterisk

**Test Entry Form:**
- Dropdown for athlete selection (searchable)
- Date picker positioned prominently
- CMJ and SJ inputs side-by-side (2-column on desktop)
- Auto-calculated difference displayed immediately below
- Textarea for observations: min-h-24
- Submit button: full-width on mobile, w-auto on desktop

### Data Display
**Test Results Cards:**
- Rounded cards: rounded-xl with shadow-md
- Padding: p-6
- Athlete name: text-lg/font-semibold at top
- Test date: text-sm/text-gray-600
- CMJ/SJ values: Large text-2xl/font-mono display
- Difference percentage: Colored based on value (positive/negative)
- Hover state: subtle shadow increase

**Tables:**
- Striped rows for readability
- Fixed header on scroll
- Column alignment: Numbers right-aligned, text left-aligned
- Row height: h-12
- Sortable column headers with arrow indicators

### Graphs & Visualizations
**Chart Container:**
- White background with subtle border
- Padding: p-6
- Minimum height: min-h-96
- Responsive aspect ratio maintained

**Chart Types:**
1. **Line Chart** (Evolution over time): CMJ and SJ as separate lines
2. **Bar Chart** (Comparison): Side-by-side bars for CMJ vs SJ per test
3. **Difference Chart**: Percentage difference trend line

**Chart Styling:**
- Grid lines: subtle gray
- Data points: clearly visible
- Tooltips on hover with precise values
- Legend positioned top-right

### Buttons & Actions
**Primary Button:**
- Solid fill, rounded-lg
- Height: h-11
- Padding: px-6
- Font: font-medium

**Secondary Button:**
- Outlined style
- Same dimensions as primary

**Icon Buttons:**
- Size: w-10 h-10
- For actions like edit, delete, view details

### Navigation Tabs
- Border-bottom style for active state
- Height: h-12
- Spacing: gap-8 between tabs

### Empty States
- Centered icon + message
- Call-to-action button below
- Minimum height: min-h-64

## Animations
**Minimal Motion:**
- Graph updates: Smooth transitions (300ms ease-in-out)
- Form validation: Subtle shake on error
- Button interactions: Standard hover/focus states only
- NO scroll-triggered animations
- NO decorative motion

## Images
**Minimal Use:**
- Optional athlete profile photos (circular, w-16 h-16)
- Empty state illustrations (simple line art)
- NO hero images - this is a utility application
- NO background images

## Accessibility
- All inputs have visible labels
- Focus states clearly visible on all interactive elements
- Sufficient color contrast for all text
- Keyboard navigation throughout
- ARIA labels for icon-only buttons
- Error messages clearly associated with form fields

## Mobile Considerations
- Stack columns on screens < 1024px
- Collapsible sidebar becomes slide-out drawer
- Tables scroll horizontally when needed
- Form inputs full-width on mobile
- Bottom navigation bar for primary actions on mobile