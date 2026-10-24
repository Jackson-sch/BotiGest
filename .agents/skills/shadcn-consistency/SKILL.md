---
name: shadcn-consistency
description: Enforce strict usage of shadcn/ui and Radix components over native HTML elements (such as Select over <select>, Button over <button>, Checkbox over <input type="checkbox">, and Dialog/Sheet over raw overlays). Use whenever creating, refactoring, or reviewing any UI forms, inputs, modals, dropdowns, tables, or interactive elements to maintain pixel-perfect visual consistency and accessibility across the application.
---

# Shadcn UI & Design System Consistency Standard

## Core Principle

In this application, **native HTML form and interactive controls (`<select>`, `<button>`, raw checkboxes, raw tables) are strictly prohibited** in user-facing components. Every interactive element must use shadcn/ui primitives to guarantee:
1. **Visual Cohesion**: Seamless integration with Apple-inspired tokens, glassmorphism, border contrast, and dark mode.
2. **Accessibility**: Built-in WAI-ARIA compliance, arrow-key navigation, typeahead, focus rings, and screen-reader semantics from Radix UI.
3. **Smooth Micro-interactions**: Apple spring transitions and refined states.

---

## 1. Dropdowns & Selects: `<Select>` vs `<select>`

### ❌ Strict Anti-Pattern
```tsx
// NEVER USE NATIVE SELECT
<select 
  value={value} 
  onChange={(e) => setValue(e.target.value)}
  className="w-full h-9 border rounded"
>
  <option value="">Seleccione una opción</option>
  <option value="1">Opción 1</option>
</select>
```

### ✅ Standard Implementation
Always import from `@/components/ui/select`:
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select 
  value={value || undefined} 
  onValueChange={setValue}
>
  <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
    <SelectValue placeholder="Seleccione una opción" />
  </SelectTrigger>
  <SelectContent className="z-[60] max-h-64">
    {items.map((item) => (
      <SelectItem key={item.id} value={item.id} className="text-xs">
        {item.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Critical Radix Select Rules:
- **No empty string item values**: Radix `<SelectItem>` throws or malfunctions if `value=""`. Never put `<SelectItem value="">`. If an empty/unselected state is needed, pass `value={selectedId || undefined}` to `<Select>` and configure `<SelectValue placeholder="..." />`.
- **Z-Index in Modals**: Always add `className="z-[60]"` or higher to `<SelectContent>` when rendering inside custom modals, sheets, or overlays (`z-50`) to avoid clipping or stacking issues.
- **Rich Option Layouts**: Leverage flex containers inside `<SelectItem>` for pharmacy context (e.g. product commercial name, batch number, remaining stock badge, and expiry date).

---

## 2. Buttons: `<Button>` vs `<button>`

### ❌ Anti-Pattern
```tsx
<button 
  type="button" 
  onClick={onClose} 
  className="p-1 rounded text-gray-500"
>
  <X className="w-4 h-4" />
</button>
```

### ✅ Standard Implementation
Always import from `@/components/ui/button`:
```tsx
import { Button } from '@/components/ui/button';

// Icon / Close button:
<Button
  type="button"
  variant="ghost"
  size="icon"
  onClick={onClose}
  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
>
  <X className="h-4 w-4" />
</Button>

// Primary Action:
<Button
  type="submit"
  disabled={isSubmitting}
  className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs rounded-xl"
>
  Guardar Registro
</Button>
```

---

## 3. Alerts & Confirmations: `toast` (Sonner) vs `alert()` / `confirm()`

### ❌ Strict Anti-Pattern
```tsx
// NEVER USE NATIVE BROWSER POPUPS
alert('Operación exitosa');
if (!confirm('¿Está seguro de eliminar este registro?')) return;
```

### ✅ Standard Implementation
Always import `toast` from `'sonner'`:
```tsx
import { toast } from 'sonner';

// 1. Success feedback:
toast.success('Registro guardado correctamente');

// 2. Error handling:
toast.error(res.error || 'Ocurrió un error al procesar la solicitud');

// 3. Confirmations with action & cancel buttons:
toast('¿Está seguro de eliminar este registro?', {
  description: 'Esta acción no se puede deshacer.',
  action: {
    label: 'Eliminar',
    onClick: () => ejecutarEliminacion(id),
  },
  cancel: {
    label: 'Cancelar',
    onClick: () => {},
  },
});
```

---

## 4. Other Form Controls

| Native Element | Shadcn Replacement | Import Path |
| :--- | :--- | :--- |
| `alert(...)` / `confirm(...)` | `toast.success()`, `toast.error()`, `toast()` con action | `sonner` |
| `<select>` / `<option>` | `<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>` | `@/components/ui/select` |
| `<button>` | `<Button variant="..." size="...">` | `@/components/ui/button` |
| `<input type="text/number">` | `<Input className="h-9 rounded-xl text-xs" />` | `@/components/ui/input` |
| `<input type="checkbox">` | `<Checkbox checked={...} onCheckedChange={...} />` | `@/components/ui/checkbox` |
| `<input type="radio">` | `<RadioGroup>`, `<RadioGroupItem>` | `@/components/ui/radio-group` |
| `<input type="date">` | `<DatePicker>` or `<Calendar>` | `@/components/ui/date-picker` / `@/components/ui/calendar` |
| Raw badges / chips | `<Badge variant="...">` | `@/components/ui/badge` |
| `<table>`, `<tr>`, `<td>` | `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableCell>` | `@/components/ui/table` |
| Tooltip `title="..."` | `<Tooltip>`, `<TooltipTrigger>`, `<TooltipContent>` | `@/components/ui/tooltip` |

---

## 5. Visual Tokens & Consistency Checklist

When implementing any form or modal:
1. **Inputs & Triggers**: `h-9` height for compact dense views (inventory, POS, accounting), `rounded-xl`, `text-xs`, font-sans.
2. **Cards & Containers**: `rounded-2xl` or `rounded-3xl` for modals, `border border-border/60`, backdrop blur when floating.
3. **Alerts & Feedback**: Always use `toast` from `'sonner'`, never browser `alert` or `confirm`.
4. **Primary Accent**: Apple Blue `#0071e3` (dark mode `#2997ff`).
5. **Validation**: Check with `pnpm tsc --noEmit` and run `git grep -n -E "\b(alert|confirm)\s*\("` and `git grep -n "<select"` to ensure no native elements slipped in.
