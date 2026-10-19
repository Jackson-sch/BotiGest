'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Building2 } from 'lucide-react';
import { UsuariosTable } from './usuarios-table';
import { CajasSedesView } from './cajas-sedes-view';
import { ModalUsuarioForm } from './modal-usuario-form';
import { ModalCajaForm } from './modal-caja-form';
import type { PerfilUsuarioItem, SucursalItem } from '../types';

interface UsuariosTabsProps {
  usuarios: PerfilUsuarioItem[];
  sucursales: SucursalItem[];
}

export function UsuariosTabs({ usuarios, sucursales }: UsuariosTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'personal' | 'sedes'>('personal');

  // Modal Usuario
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<PerfilUsuarioItem | null>(null);

  // Modal Caja
  const [isCajaModalOpen, setIsCajaModalOpen] = React.useState(false);

  const handleNuevoUsuario = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditarUsuario = (user: PerfilUsuarioItem) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6 w-full">
      {/* Tabs Header */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback ${
            activeTab === 'personal'
              ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Personal & Credenciales</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/[0.05] dark:bg-white/[0.1] text-muted-foreground">
            {usuarios.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sedes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback ${
            activeTab === 'sedes'
              ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Sedes & Cajas de Cobro</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/[0.05] dark:bg-white/[0.1] text-muted-foreground">
            {sucursales.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'personal' && (
        <UsuariosTable
          usuarios={usuarios}
          onNuevoUsuario={handleNuevoUsuario}
          onEditarUsuario={handleEditarUsuario}
        />
      )}

      {activeTab === 'sedes' && (
        <CajasSedesView
          sucursales={sucursales}
          onNuevaCaja={() => setIsCajaModalOpen(true)}
        />
      )}

      {/* Modal Usuario Form */}
      <ModalUsuarioForm
        usuario={selectedUser}
        sucursales={sucursales}
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Modal Caja Form */}
      <ModalCajaForm
        sucursales={sucursales}
        isOpen={isCajaModalOpen}
        onClose={() => setIsCajaModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
