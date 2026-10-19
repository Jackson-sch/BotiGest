"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon: LucideIcon
  badge?: string
  badgeColor?: string
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export interface NavMainGroup {
  label: string
  items: NavMainItem[]
}

export function NavMain({ groups }: { groups: NavMainGroup[] }) {
  const pathname = usePathname()

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="py-1">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2">
            {group.label}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const isActive =
                item.url === "/"
                  ? pathname === "/"
                  : pathname === item.url || pathname.startsWith(item.url + "/")

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className="h-8.5 font-medium transition-colors"
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  {item.badge ? (
                    <SidebarMenuBadge
                      className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                        item.badgeColor ??
                        "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border"
                      }`}
                    >
                      {item.badge}
                    </SidebarMenuBadge>
                  ) : null}

                  {item.items?.length ? (
                    <Collapsible defaultOpen={isActive} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction className="data-[state=open]:rotate-90">
                            <ChevronRight />
                            <span className="sr-only">Toggle</span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ) : null}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
