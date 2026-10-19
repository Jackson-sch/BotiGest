"use client"

import Link from "next/link"
import { logoutAction } from "@/app/login/actions"
import {
  ChevronsUpDown,
  CircleDollarSign,
  FileCheck2,
  LogOut,
  Settings,
  UserCheck,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
}) {
  const { isMobile } = useSidebar()
  const initials = user.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'QF';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-bold text-xs" suppressHydrationWarning>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold text-foreground" suppressHydrationWarning>{user.name}</span>
                <span className="truncate text-muted-foreground text-[11px]" suppressHydrationWarning>{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-sidebar-border bg-sidebar"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-2 py-2 text-left text-xs">
                <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border">
                  <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-bold text-xs" suppressHydrationWarning>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold text-foreground" suppressHydrationWarning>{user.name}</span>
                  <span className="truncate text-muted-foreground text-[11px]" suppressHydrationWarning>
                    {user.role ?? "Director Técnico · Q.F. 14209"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-xs cursor-pointer py-2">
                <div className="flex items-center gap-2 w-full">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-emerald-400">Turno Caja: Abierto</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-xs cursor-pointer py-2">
                <Link href="/caja">
                  <CircleDollarSign className="size-4 text-muted-foreground" />
                  <span>Arqueo & Cierre de Caja</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-xs cursor-pointer py-2">
                <Link href="/controlados">
                  <FileCheck2 className="size-4 text-muted-foreground" />
                  <span>Libro Oficial DIGEMID</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-xs cursor-pointer py-2">
                <UserCheck className="size-4 text-muted-foreground" />
                <span>Perfil & Matrícula Q.F.</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer py-2">
                <Settings className="size-4 text-muted-foreground" />
                <span>Configuración de Sede</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="text-xs cursor-pointer text-destructive focus:text-destructive py-2"
            >
              <LogOut className="size-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
