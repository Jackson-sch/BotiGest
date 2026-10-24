<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI & Design Consistency Standard (Strict)

- **Strictly No Native HTML Form Elements or Browser Popups**: Never use `<select>`, `<button>`, raw checkboxes, raw radio buttons, or native browser popups (`alert()`, `confirm()`, `prompt()`) in application components.
- **Always use shadcn/ui and Sonner**:
  - Feedback & Notifications: `toast` from `'sonner'` (`toast.success()`, `toast.error()`, `toast()` con action/cancel interactivo).
  - Dropdowns: `@/components/ui/select` (`<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>`, `<SelectValue>`). Note: Never set `value=""` in `<SelectItem>`; use `value={val || undefined}` on `<Select>`.
  - Buttons: `@/components/ui/button` (`<Button variant="..." size="...">`).
  - Inputs: `@/components/ui/input` (`<Input />`).
  - Checkboxes: `@/components/ui/checkbox` (`<Checkbox />`).
  - Badges: `@/components/ui/badge` (`<Badge />`).
- **Visual tokens**: Keep Apple-inspired aesthetics (`rounded-xl` for controls, `rounded-2xl`/`rounded-3xl` for cards and modals, `#0071e3` brand blue, subtle border contrast, and micro-animations). Consult skill `shadcn-consistency` for full patterns.
