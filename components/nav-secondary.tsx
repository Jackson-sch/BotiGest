"use client"

import * as React from "react"
import Link from "next/link"
import { type LucideIcon, ExternalLink } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    external?: boolean
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isExternal = item.external ?? item.url.startsWith("http");

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                  {isExternal ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full"
                      title={`${item.title} (abrir en una pestaña separada)`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate flex-1">{item.title}</span>
                      <ExternalLink className="size-3 text-muted-foreground/60 shrink-0 ml-auto" />
                    </a>
                  ) : (
                    <Link href={item.url}>
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
