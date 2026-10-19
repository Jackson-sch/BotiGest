"use client"

import * as React from "react"
import {
  Store,
  ShoppingCart,
  ReceiptText,
  Boxes,
  ClipboardList,
  Receipt,
  ShieldCheck,
  ChevronsUpDown,
  Check,
  BookOpen,
  Send,
  Pill,
  MapPin,
  Building2,
  Users,
  UserCheck,
  FileText,
  Truck,
  Settings,
} from "lucide-react"

import { NavMain, type NavMainGroup } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const boticaData = {
  user: {
    name: "Carlos Ramírez",
    email: "Director Técnico · Q.F. 14209",
    avatar: "",
    role: "Administrador / Químico Farmacéutico",
  },
  sedes: [
    {
      id: "sede-1",
      name: "Sede Principal",
      direccion: "Av. Grau 450, Piura",
      active: true,
    },
    {
      id: "sede-2",
      name: "Sucursal San Martín",
      direccion: "Jr. Junín 124, Piura",
      active: false,
    },
    {
      id: "sede-3",
      name: "Almacén Central",
      direccion: "Zona Industrial Lote 14",
      active: false,
    },
  ],
  navGroups: [
    {
      label: "Operaciones",
      items: [
        {
          title: "Panel de Control",
          url: "/",
          icon: Store,
        },
        {
          title: "Punto de Venta",
          url: "/pos",
          icon: ShoppingCart,
          badge: "F4",
          badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        },
        {
          title: "Caja & Turnos",
          url: "/caja",
          icon: ReceiptText,
        },
        {
          title: "Clientes & Créditos",
          url: "/clientes",
          icon: UserCheck,
        },
      ],
    },
    {
      label: "Almacén & Cadena",
      items: [
        {
          title: "Catálogo Fármacos",
          url: "/productos",
          icon: Pill,
        },
        {
          title: "Inventario & Lotes",
          url: "/inventario",
          icon: Boxes,
        },
        {
          title: "Compras Droguerías",
          url: "/compras",
          icon: ClipboardList,
        },
        {
          title: "Proveedores & Droguerías",
          url: "/proveedores",
          icon: Truck,
        },
      ],
    },
    {
      label: "Regulatorio & SUNAT",
      items: [
        {
          title: "Ventas & Facturas",
          url: "/ventas",
          icon: Receipt,
        },
        {
          title: "Libro Controlados",
          url: "/controlados",
          icon: ShieldCheck,
          badge: "DIGEMID",
          badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        },
        {
          title: "Reportes Oficiales",
          url: "/reportes",
          icon: FileText,
          badge: "OPPF/SIRE",
          badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        },
      ],
    },
    {
      label: "Administración",
      items: [
        {
          title: "Personal, Sedes & Cajas",
          url: "/usuarios",
          icon: Users,
        },
        {
          title: "Configuración Botica",
          url: "/configuracion",
          icon: Settings,
        },
      ],
    },
  ] as NavMainGroup[],
  navSecondary: [
    {
      title: "Manual & Normativa DIGEMID",
      url: "https://www.digemid.minsa.gob.pe",
      icon: BookOpen,
    },
    {
      title: "Estado OSE SUNAT Facturación",
      url: "#",
      icon: Send,
    },
  ],
}

import { useAuth } from "@/components/providers/auth-provider"
import { isRouteAllowed } from "@/lib/permissions"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeSede, setActiveSede] = React.useState(boticaData.sedes[0])
  const { user: currentUser } = useAuth()

  const displayUser = currentUser
    ? {
        name: currentUser.nombreCompleto,
        email: currentUser.cqfp
          ? currentUser.cqfp
          : currentUser.rol === "administrador"
          ? "Administrador General"
          : currentUser.rol === "cajero"
          ? "Cajero Principal · POS"
          : currentUser.rol === "almacenero"
          ? "Responsable de Almacén & Lotes"
          : "Personal Farmacéutico",
        avatar: "",
        role: currentUser.cqfp ? `${currentUser.cqfp} · ${currentUser.rol}` : currentUser.rol,
      }
    : boticaData.user

  // Filtrar grupos y módulos según los permisos del rol del usuario
  const filteredNavGroups = React.useMemo(() => {
    if (!currentUser) return boticaData.navGroups

    return boticaData.navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => isRouteAllowed(item.url, currentUser.rol)),
      }))
      .filter((group) => group.items.length > 0)
  }, [currentUser])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                    <Pill className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-bold text-foreground">BotiGest</span>
                      <span className="text-[10px] font-semibold uppercase px-1 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                        Botica
                      </span>
                    </div>
                    <span className="truncate text-muted-foreground text-[11px]">
                      {activeSede.name}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border-sidebar-border bg-sidebar"
                align="start"
                sideOffset={6}
              >
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  Cambiar de Establecimiento / Sucursal
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-sidebar-border" />
                {boticaData.sedes.map((sede) => (
                  <DropdownMenuItem
                    key={sede.id}
                    onClick={() => setActiveSede(sede)}
                    className="flex items-start gap-2.5 px-2 py-2 cursor-pointer text-xs"
                  >
                    <Building2 className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="grid flex-1 leading-tight">
                      <span className="font-semibold text-foreground">{sede.name}</span>
                      <span className="text-[11px] text-muted-foreground">{sede.direccion}</span>
                    </div>
                    {sede.id === activeSede.id ? (
                      <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-sidebar-border" />
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-pointer px-2 py-1.5">
                  <MapPin className="size-3.5 mr-2 text-muted-foreground" />
                  <span>Administrar Sucursales & Almacenes</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain groups={filteredNavGroups} />
        <NavSecondary items={boticaData.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
