'use client';

import * as React from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Power,
  Shield,
  Award,
  Building,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { toggleEstadoUsuarioAction } from '../actions';
import type { PerfilUsuarioItem } from '../types';

interface UsuariosTableProps {
  usuarios: PerfilUsuarioItem[];
  onNuevoUsuario: () => void;
  onEditarUsuario: (usuario: PerfilUsuarioItem) => void;
}

const ROLES_BADGES: Record<string, { label: string; badge: string }> = {
  propietario: { label: 'Propietario', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  administrador: { label: 'Administrador', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  director_tecnico: { label: 'Director Técnico', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  cajero: { label: 'Cajero / POS', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  almacenero: { label: 'Almacenero', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  contador: { label: 'Contador', badge: 'bg-muted text-muted-foreground border-border/40' },
};

export function UsuariosTable({
  usuarios,
  onNuevoUsuario,
  onEditarUsuario,
}: UsuariosTableProps) {
  const [search, setSearch] = React.useState('');
  const [isToggling, setIsToggling] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    return usuarios.filter((u) => {
      const term = search.toLowerCase();
      return (
        search.trim() === '' ||
        u.nombres.toLowerCase().includes(term) ||
        u.apellidos.toLowerCase().includes(term) ||
        u.dni.includes(term) ||
        (u.cqfp && u.cqfp.toLowerCase().includes(term)) ||
        u.rol.toLowerCase().includes(term)
      );
    });
  }, [usuarios, search]);

  const handleToggleEstado = async (u: PerfilUsuarioItem) => {
    setIsToggling(u.id);
    try {
      const res = await toggleEstadoUsuarioAction(u.id, !u.activo);
      if (!res.success) {
        toast.error(res.error || 'Error al cambiar estado');
        return;
      }
      toast.success(
        u.activo
          ? `Usuario "${u.nombres} ${u.apellidos}" desactivado.`
          : `Usuario "${u.nombres} ${u.apellidos}" reactivado.`
      );
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión');
    } finally {
      setIsToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, DNI o colegiatura CQFP..."
            className="pl-9 h-10 bg-sidebar/80 border-border/60 text-xs rounded-2xl"
          />
        </div>

        <Button
          onClick={onNuevoUsuario}
          className="h-10 px-4 text-xs font-semibold rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-lg shadow-[#0071e3]/20"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo Colaborador
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-border/50 bg-sidebar/50 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-medium">
                <th className="py-3 px-4">Colaborador / DNI</th>
                <th className="py-3 px-4">Rol & Autorización</th>
                <th className="py-3 px-4">Colegiatura CQFP</th>
                <th className="py-3 px-4">Sede Asignada</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No se encontraron colaboradores registrados.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const roleConfig = ROLES_BADGES[u.rol] || {
                    label: u.rol,
                    badge: 'bg-muted text-muted-foreground',
                  };

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        !u.activo ? 'opacity-50 grayscale-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground text-sm">
                            {u.nombres} {u.apellidos}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            DNI: {u.dni}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${roleConfig.badge}`}
                        >
                          {roleConfig.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.cqfp ? (
                          <div className="flex items-center gap-1.5 text-purple-300 font-mono font-semibold text-xs">
                            <Award className="h-3.5 w-3.5 text-purple-400" />
                            <span>{u.cqfp}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">N/A</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-foreground text-xs">
                          <Building className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{u.sucursal_nombre || 'Todas las sedes'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            u.activo
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditarUsuario(u)}
                            className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
                            title="Editar usuario"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleEstado(u)}
                            disabled={isToggling === u.id}
                            className={`h-8 w-8 p-0 rounded-xl ${
                              u.activo
                                ? 'hover:bg-rose-500/10 hover:text-rose-400'
                                : 'hover:bg-emerald-500/10 hover:text-emerald-400'
                            }`}
                            title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
