# Rules: AdminLTE UI Framework

Applies to every project where AdminLTE is detected as the UI template.
Every rule uses "must" or "never" — no ambiguity. Violations block merge.

---

## Core principle

AdminLTE is the structural foundation. Custom code extends it — never replaces or fights it.
All design values flow through CSS custom properties. No raw value appears outside the token file.
The UI must render correctly and be fully usable at every Bootstrap breakpoint without exception.

---

## File and folder rules

- **Never modify** `adminlte/dist/css/adminlte.min.css`, `adminlte/dist/js/adminlte.min.js`, or any file inside the AdminLTE distribution folder.
- **Never modify** Bootstrap distribution files.
- All custom styles must live in `assets/css/custom.css` (or the project-defined override file — see ADMINLTE.md for the exact path).
- All Bootstrap variable overrides must live in `assets/css/variables.css` (or equivalent), loaded **before** Bootstrap and AdminLTE stylesheets.
- All CSS custom property declarations must live in the single token file — not in page-specific `<style>` blocks or inline `style=""` attributes.
- JavaScript plugin configurations must live in `assets/js/app.js` or feature-specific JS files — never inline `<script>` blocks inside HTML templates.
- Page templates must live in the project-defined `views/` or `pages/` directory. No HTML logic is permitted in asset files.

---

## CSS and token rules

- **Never** write a raw hex colour value anywhere outside the token file. Use `var(--bs-primary)`, `var(--color-primary)`, or a named custom property.
- **Never** write a raw `px` or `rem` font-size outside the token file. Use the project's typography tokens.
- **Never** write a raw `px` margin, padding, or gap outside the token file. Use Bootstrap spacing utilities (`mb-3`, `px-4`) or named spacing tokens.
- **Never** use `!important` to override AdminLTE or Bootstrap styles. Fix the CSS specificity using a more specific selector instead.
- **Never** use inline `style=""` attributes for design values. The only permitted use of `style=""` is to pass a runtime CSS custom property value to a component (e.g. `style="--progress-value: 72%"`).
- **Never** write page-specific CSS that overrides a shared component. Overrides go into the component's own CSS or a project-wide utility, not into a page stylesheet.
- **Never** duplicate a CSS rule across two files. If the same rule appears in two places, extract it to a shared utility class or token.
- Must use Bootstrap's CSS custom properties (`--bs-primary`, `--bs-secondary`, `--bs-body-bg`, etc.) as the first layer of the colour system, then extend with project semantic aliases that reference them.

---

## Layout rules

- Must use `class="wrapper"` as the outermost container — never replace it with a custom wrapper.
- Must use AdminLTE's `main-header`, `main-sidebar`, `content-wrapper`, and `main-footer` structural elements on every page. Never remove or rename these.
- **Never** set a fixed pixel `width` or `max-width` on `content-wrapper`. All content width is controlled by the sidebar state and Bootstrap's grid.
- Must use `container-fluid` (not `container`) inside `content-wrapper` for all page content areas — AdminLTE is designed for fluid layouts.
- The sidebar must collapse at the `lg` breakpoint (992px) using AdminLTE's native toggle mechanism. Never use a custom collapse implementation.
- **Never** add `overflow: hidden` to `body`, `wrapper`, or `content-wrapper` — it breaks AdminLTE's sidebar and sticky header behaviour.
- Must use the `content-header` section for page title and breadcrumbs on every content page.
- Page content goes inside a `<section class="content">` block within `content-wrapper`.
- Must not add a second header or a second sidebar. The layout is single-header, single-sidebar.

---

## Card rules

- Must use AdminLTE's `card` component as the primary content container. Do not invent custom box patterns.
- Every card must have a `card-header` (with title) and a `card-body`. `card-footer` is optional but must follow AdminLTE markup when used.
- Card colour variants (`card-primary`, `card-success`, etc.) must use Bootstrap semantic colour names — never hardcode colours in card headers.
- Card tool buttons (collapse, close, fullscreen) must use AdminLTE's built-in `card-tools` pattern. Never re-implement these controls.
- The `card-outline` variant (border instead of filled header) is permitted when the design calls for a lighter visual weight. Document which contexts use outline vs filled.
- **Never** nest a card inside another card's `card-body` more than one level deep.

---

## Component rules

- Must use AdminLTE's `small-box` component for summary/KPI stats. Do not build custom stat boxes.
- Must use AdminLTE's `info-box` for secondary metric displays. Do not build custom info boxes.
- Must use Bootstrap's modal component for all dialogs. **Never** use `window.alert()`, `window.confirm()`, or `window.prompt()`.
- Must use Bootstrap's dropdown component for all dropdown menus. Do not build custom dropdown implementations.
- Must use Bootstrap's form components and AdminLTE form styling for all form elements. Do not mix Tailwind, Material, or other CSS framework form classes into AdminLTE pages.
- Must use AdminLTE's `direct-chat`, `timeline`, and `to-do list` components when those UI patterns are needed. Do not build alternatives.
- Breadcrumbs must use Bootstrap's `breadcrumb` component. The home link is always the first item.

---

## Plugin rules

- Only plugins listed in `ADMINLTE.md`'s approved plugin catalogue may be used. Any new plugin requires explicit approval (see `ADMINLTE.md — Adding a new plugin`).
- Plugin JS files must be loaded in the order specified in `ADMINLTE.md`. Bootstrap JS must load before AdminLTE JS. AdminLTE JS must load before plugin JS. Plugin JS must load before `app.js`.
- Plugin CSS files must be loaded after Bootstrap CSS and AdminLTE CSS. Custom CSS loads last.
- **Never** load jQuery more than once per page. Confirm the script exists and is loaded globally before adding a jQuery dependency.
- DataTables must be initialised with the project's standard configuration (see `ADMINLTE.md — DataTables standard config`). Inline configuration per table is only permitted for table-specific options not covered by the standard config.
- Select2 must be initialised on every `<select>` element that is not a simple two-option toggle.
- Flatpickr (or the project's approved date picker) must be used for all date and datetime inputs. Native `<input type="date">` is not permitted in desktop-targeted views.

---

## Responsive rules

- Must use Bootstrap's 12-column grid (`col-`, `col-sm-`, `col-md-`, `col-lg-`, `col-xl-`) for all content layouts. **Never** use `float`, absolute positioning, or fixed pixel widths for layout.
- Must test and verify layout at all six Bootstrap breakpoints: xs (<576px), sm (≥576px), md (≥768px), lg (≥992px), xl (≥1200px), xxl (≥1400px).
- Any table wider than its container must be wrapped in `<div class="table-responsive">`. **Never** allow a table to overflow the viewport without a scrollable wrapper.
- Images must always include `img-fluid` or equivalent `max-width: 100%` rule. **Never** set a fixed pixel width on an image.
- Modal dialogs must be scrollable on small screens using Bootstrap's `modal-dialog-scrollable` class when content may overflow. **Never** allow a modal to overflow the viewport height.
- All font sizes must be readable at mobile viewport (375px minimum). **Never** set a font size below `0.75rem` (`--text-caption`).
- Icon buttons must have a minimum touch target of 44×44px on mobile. Use `p-2` padding or equivalent to meet this requirement.
- The sidebar must be hidden (off-canvas) on xs and sm viewports. Content fills the full width on mobile.
- Charts and data visualisations must be responsive containers. **Never** set a fixed pixel height or width on a chart canvas — use a responsive wrapper or the library's responsive option.
- Form layouts must collapse to single-column on xs and sm viewports. Two-column form layouts (`col-md-6`) are only permitted at md and above.

---

## Accessibility rules

- Every `<img>` must have an `alt` attribute. Decorative images use `alt=""`.
- Every form input must have an associated `<label>` element. Placeholder text is not a substitute for a label.
- Icon-only buttons must have `aria-label` or `title` text.
- Focus outline must never be removed with `outline: none` without providing a visible replacement focus style.
- Modals must move keyboard focus to the modal on open and return it to the trigger on close.
- All interactive elements must be reachable by Tab key. `tabindex` values greater than 0 are forbidden.
- Colour alone must never be the only way to convey information — pair colour with text or an icon.
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text (WCAG AA).

---

## Performance rules

- **Never** load a plugin globally if it is used on only one page. Lazy-load page-specific plugins.
- **Never** select a DOM element with a bare tag selector (`$('input')`) — always scope to a container.
- DataTables must use server-side processing for tables that may exceed 500 rows.
- **Never** make synchronous AJAX calls (jQuery `$.ajax({ async: false })`). All HTTP calls must be async.
- Images must be served at the display resolution — no oversized images scaled down with CSS.
- `console.log` statements must be removed before merge. Use the project's logger utility.

---

## Quality gate

A PR that modifies any frontend file must pass all applicable rules above before merge.
The ReviewDev step automatically loads `ADMINLTE.md` and this rules file when any frontend file is changed.
A violation of any layout, responsive, or CSS rule is flagged **Important** minimum.
A layout rule violation that breaks a viewport (visible on resize) is **Critical**.
