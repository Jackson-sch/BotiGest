"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
  Globe,
  Layers,
} from "lucide-react"

import { NavMain, type NavMainGroup } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { BotiGestIcon } from "@/components/ui/botigest-logo"
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
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [sucursales, setSucursales] = React.useState<Array<{
    id: string;
    nombre: string;
    direccion: string;
    codigo: string;
    es_almacen: boolean;
  }>>([])
  const [activeSucursalId, setActiveSucursalId] = React.useState<string>('')
  const [canSwitchBranch, setCanSwitchBranch] = React.useState<boolean>(true)
  const [isSwitching, setIsSwitching] = React.useState<boolean>(false)

  // Cargar sucursales reales y sede activa desde la API
  React.useEffect(() => {
    async function loadSucursales() {
      try {
        const res = await fetch('/api/sucursales')
        if (res.ok) {
          const data = await res.json()
          setSucursales(data.sucursales || [])
          setActiveSucursalId(data.activeSucursalId || data.sucursales?.[0]?.id || '')
          setCanSwitchBranch(data.canSwitchBranch ?? true)
        }
      } catch (e) {
        console.error('Error al cargar sucursales:', e)
      }
    }
    loadSucursales()
  }, [])

  // Cambiar de sucursal activa con persistencia en cookie y recarga de datos en tiempo real
  const handleSelectSucursal = async (id: string, nombre: string) => {
    if (id === activeSucursalId || isSwitching) return
    setIsSwitching(true)
    try {
      const res = await fetch('/api/sucursales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sucursalId: id }),
      })
      if (res.ok) {
        setActiveSucursalId(id)
        toast.success(`Cambiando a: ${nombre}`)
        router.refresh()
      } else {
        const err = await res.json()
        toast.error(err.error || 'No se pudo cambiar de sucursal')
      }
    } catch {
      toast.error('Error al cambiar de sucursal')
    } finally {
      setIsSwitching(false)
    }
  }

  const activeSedeName = React.useMemo(() => {
    if (activeSucursalId === 'todas') return 'Todas las Sedes (Consolidado)'
    const found = sucursales.find((s) => s.id === activeSucursalId)
    return found ? found.nombre : (currentUser?.sucursalNombre || 'Sede Principal')
  }, [activeSucursalId, sucursales, currentUser])

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
                  <BotiGestIcon size={32} className="rounded-lg shadow-sm" />
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-bold text-foreground tracking-tight">
                        Boti<span className="text-primary">Gest</span>
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-1 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                        Botica
                      </span>
                    </div>
                    <span className="truncate text-muted-foreground text-[11px]">
                      {activeSedeName}
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
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5 flex items-center justify-between">
                  <span>Establecimiento Activo</span>
                  {isSwitching && <span className="text-[10px] text-primary animate-pulse">Sincronizando...</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-sidebar-border" />

                {/* Opción de Consolidado (solo administradores y directores técnicos) */}
                {canSwitchBranch && (
                  <DropdownMenuItem
                    onClick={() => handleSelectSucursal('todas', 'Todas las Sedes (Consolidado)')}
                    className="flex items-start gap-2.5 px-2 py-2 cursor-pointer text-xs"
                  >
                    <Layers className="size-4 mt-0.5 text-primary shrink-0" />
                    <div className="grid flex-1 leading-tight">
                      <span className="font-semibold text-foreground">Todas las Sedes (Consolidado)</span>
                      <span className="text-[11px] text-muted-foreground">Métricas globales de la cadena</span>
                    </div>
                    {activeSucursalId === 'todas' ? (
                      <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                    ) : null}
                  </DropdownMenuItem>
                )}

                {/* Lista de Sucursales Reales de la Base de Datos */}
                {sucursales.map((sede) => (
                  <DropdownMenuItem
                    key={sede.id}
                    disabled={!canSwitchBranch && sede.id !== activeSucursalId}
                    onClick={() => handleSelectSucursal(sede.id, sede.nombre)}
                    className="flex items-start gap-2.5 px-2 py-2 cursor-pointer text-xs"
                  >
                    <Building2 className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="grid flex-1 leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{sede.nombre}</span>
                        {sede.es_almacen && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground">Almacén</span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{sede.direccion}</span>
                    </div>
                    {sede.id === activeSucursalId ? (
                      <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                    ) : null}
                  </DropdownMenuItem>
                ))}

                {!canSwitchBranch && (
                  <div className="px-2 py-1.5 text-[10px] text-muted-foreground border-t border-sidebar-border/60">
                    🔒 Sede asignada a tu turno de trabajo (no modificable por rol operativo).
                  </div>
                )}
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
