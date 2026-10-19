import { create } from 'zustand';
import type {
  PosProductItem,
  CartItem,
  RecetaData,
  PosClientData,
  TipoComprobante,
  HeldCart,
  AlternativaGenerica,
} from './types';

const STORAGE_KEY_HELD = 'botigest_pos_held_carts';

function getStoredHeldCarts(): HeldCart[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HELD);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredHeldCarts(carts: HeldCart[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_HELD, JSON.stringify(carts));
  } catch {}
}

export interface PosState {
  // Carrito
  items: CartItem[];
  cliente: PosClientData | null;
  tipo_comprobante: TipoComprobante;
  receta: RecetaData | null;
  isRecetaModalOpen: boolean;
  isCheckoutModalOpen: boolean;
  searchQuery: string;

  // Ventas en espera (Parquear carritos)
  heldCarts: HeldCart[];
  isHeldCartsModalOpen: boolean;
  initHeldCarts: () => void;
  parkCurrentCart: () => HeldCart | null;
  restoreHeldCart: (heldCartId: string) => void;
  removeHeldCart: (heldCartId: string) => void;
  setHeldCartsModalOpen: (open: boolean) => void;

  // Sustitución inteligente DCI
  substituteGenericItem: (itemId: string, genericProduct?: PosProductItem) => void;

  // Acciones de Carrito
  addItem: (product: PosProductItem, presentacionId?: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  updatePresentacion: (itemId: string, presentacionId: string) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  // Acciones de Comprobante & Cliente
  setCliente: (cliente: PosClientData | null) => void;
  setTipoComprobante: (tipo: TipoComprobante) => void;
  setReceta: (receta: RecetaData | null) => void;
  setRecetaModalOpen: (open: boolean) => void;
  setCheckoutModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;

  // Cálculos derivados
  getTotales: () => {
    subtotalGravado: number;
    subtotalExonerado: number;
    subtotalInafecto: number;
    igv: number;
    descuentoTotal: number;
    total: number;
    requiereReceta: boolean;
    tieneControlados: boolean;
    totalItemsCount: number;
  };
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  cliente: null,
  tipo_comprobante: 'boleta',
  receta: null,
  isRecetaModalOpen: false,
  isCheckoutModalOpen: false,
  searchQuery: '',
  heldCarts: [],
  isHeldCartsModalOpen: false,

  initHeldCarts: () => {
    set({ heldCarts: getStoredHeldCarts() });
  },

  parkCurrentCart: () => {
    const state = get();
    if (state.items.length === 0) return null;
    const totales = state.getTotales();
    const nextNum = state.heldCarts.length + 1;
    const newHeldCart: HeldCart = {
      id: `TK-${String(nextNum).padStart(2, '0')}`,
      correlativo: nextNum,
      createdAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      items: [...state.items],
      cliente: state.cliente,
      tipo_comprobante: state.tipo_comprobante,
      receta: state.receta,
      total: totales.total,
      itemsCount: totales.totalItemsCount,
    };
    const updatedHeld = [newHeldCart, ...state.heldCarts];
    saveStoredHeldCarts(updatedHeld);
    set({
      heldCarts: updatedHeld,
      items: [],
      cliente: null,
      receta: null,
      isCheckoutModalOpen: false,
      isRecetaModalOpen: false,
      isHeldCartsModalOpen: false,
    });
    return newHeldCart;
  },

  restoreHeldCart: (heldCartId: string) => {
    const state = get();
    const held = state.heldCarts.find((c) => c.id === heldCartId);
    if (!held) return;
    const updatedHeld = state.heldCarts.filter((c) => c.id !== heldCartId);
    saveStoredHeldCarts(updatedHeld);
    set({
      items: [...held.items],
      cliente: held.cliente,
      tipo_comprobante: held.tipo_comprobante,
      receta: held.receta,
      heldCarts: updatedHeld,
      isHeldCartsModalOpen: false,
    });
  },

  removeHeldCart: (heldCartId: string) => {
    const state = get();
    const updatedHeld = state.heldCarts.filter((c) => c.id !== heldCartId);
    saveStoredHeldCarts(updatedHeld);
    set({ heldCarts: updatedHeld });
  },

  setHeldCartsModalOpen: (isHeldCartsModalOpen) => set({ isHeldCartsModalOpen }),

  substituteGenericItem: (itemId: string, genericProduct?: PosProductItem) => {
    set((state) => {
      const itemIndex = state.items.findIndex((i) => i.id === itemId);
      if (itemIndex === -1) return state;
      const currentItem = state.items[itemIndex];
      const alt = currentItem.alternativa_generica;

      if (!alt && !genericProduct) return state;

      let newItem: CartItem;
      if (genericProduct) {
        const defaultPres = genericProduct.presentaciones[0];
        newItem = {
          id: `${genericProduct.producto_id}-${defaultPres.id}-${Date.now()}`,
          producto_id: genericProduct.producto_id,
          nombre_comercial: genericProduct.nombre_comercial,
          nombre_generico: genericProduct.nombre_generico,
          concentracion: genericProduct.concentracion,
          condicion_venta: genericProduct.condicion_venta,
          tipo_afectacion_igv: genericProduct.tipo_afectacion_igv,
          presentacion_id: defaultPres.id,
          presentacion_nombre: defaultPres.nombre,
          factor_base: defaultPres.factor_base,
          precio_unitario: defaultPres.precio_venta,
          cantidad: currentItem.cantidad,
          descuento: 0,
          total: Number((currentItem.cantidad * defaultPres.precio_venta).toFixed(2)),
          stock_disponible_base: genericProduct.stock_disponible_base,
          presentaciones: genericProduct.presentaciones,
        };
      } else if (alt) {
        newItem = {
          ...currentItem,
          id: `${alt.producto_id}-${alt.presentacion_id}-${Date.now()}`,
          producto_id: alt.producto_id,
          nombre_comercial: alt.nombre_comercial,
          nombre_generico: alt.nombre_generico,
          concentracion: alt.concentracion,
          presentacion_id: alt.presentacion_id,
          presentacion_nombre: alt.presentacion_nombre,
          precio_unitario: alt.precio_venta,
          total: Number((currentItem.cantidad * alt.precio_venta).toFixed(2)),
          stock_disponible_base: alt.stock_disponible_base,
          alternativa_generica: undefined,
        };
      } else {
        return state;
      }

      const updated = [...state.items];
      updated[itemIndex] = newItem;
      return { items: updated };
    });
  },

  addItem: (product, presentacionId) => {
    const defaultPres =
      product.presentaciones.find((p) => (presentacionId ? p.id === presentacionId : p.es_default)) ||
      product.presentaciones[0];

    if (!defaultPres) return;

    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.producto_id === product.producto_id && i.presentacion_id === defaultPres.id
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        const item = updated[existingIndex];
        const newQty = item.cantidad + 1;
        const total = Math.max(0, newQty * item.precio_unitario - item.descuento);
        updated[existingIndex] = { ...item, cantidad: newQty, total };
        return { items: updated };
      }

      const newItem: CartItem = {
        id: `${product.producto_id}-${defaultPres.id}-${Date.now()}`,
        producto_id: product.producto_id,
        nombre_comercial: product.nombre_comercial,
        nombre_generico: product.nombre_generico,
        concentracion: product.concentracion,
        condicion_venta: product.condicion_venta,
        tipo_afectacion_igv: product.tipo_afectacion_igv,
        presentacion_id: defaultPres.id,
        presentacion_nombre: defaultPres.nombre,
        factor_base: defaultPres.factor_base,
        precio_unitario: defaultPres.precio_venta,
        cantidad: 1,
        descuento: 0,
        total: defaultPres.precio_venta,
        stock_disponible_base: product.stock_disponible_base,
        presentaciones: product.presentaciones,
        alternativa_generica: product.alternativa_generica,
      };

      return { items: [...state.items, newItem] };
    });
  },

  updateQuantity: (itemId, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(itemId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === itemId) {
          const total = Math.max(0, cantidad * item.precio_unitario - item.descuento);
          return { ...item, cantidad, total };
        }
        return item;
      }),
    }));
  },

  updatePresentacion: (itemId, presentacionId) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === itemId) {
          const newPres = item.presentaciones.find((p) => p.id === presentacionId);
          if (!newPres) return item;
          const total = Math.max(0, item.cantidad * newPres.precio_venta - item.descuento);
          return {
            ...item,
            presentacion_id: newPres.id,
            presentacion_nombre: newPres.nombre,
            factor_base: newPres.factor_base,
            precio_unitario: newPres.precio_venta,
            total,
          };
        }
        return item;
      }),
    }));
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      cliente: null,
      receta: null,
      isCheckoutModalOpen: false,
      isRecetaModalOpen: false,
    });
  },

  setCliente: (cliente) => set({ cliente }),
  setTipoComprobante: (tipo_comprobante) => set({ tipo_comprobante }),
  setReceta: (receta) => set({ receta }),
  setRecetaModalOpen: (isRecetaModalOpen) => set({ isRecetaModalOpen }),
  setCheckoutModalOpen: (isCheckoutModalOpen) => set({ isCheckoutModalOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  getTotales: () => {
    const { items } = get();
    let subtotalGravado = 0;
    let subtotalExonerado = 0;
    let subtotalInafecto = 0;
    let igv = 0;
    let descuentoTotal = 0;
    let total = 0;
    let requiereReceta = false;
    let tieneControlados = false;
    let totalItemsCount = 0;

    const IGV_RATE = 0.18;

    items.forEach((item) => {
      totalItemsCount += item.cantidad;
      descuentoTotal += item.descuento;
      total += item.total;

      if (item.condicion_venta !== 'sin_receta') {
        requiereReceta = true;
      }
      if (item.condicion_venta === 'psicotropico' || item.condicion_venta === 'estupefaciente') {
        tieneControlados = true;
      }

      if (item.tipo_afectacion_igv === 'gravado') {
        const valorVenta = item.total / (1 + IGV_RATE);
        const itemIgv = item.total - valorVenta;
        subtotalGravado += valorVenta;
        igv += itemIgv;
      } else if (item.tipo_afectacion_igv === 'exonerado') {
        subtotalExonerado += item.total;
      } else {
        subtotalInafecto += item.total;
      }
    });

    return {
      subtotalGravado: Number(subtotalGravado.toFixed(2)),
      subtotalExonerado: Number(subtotalExonerado.toFixed(2)),
      subtotalInafecto: Number(subtotalInafecto.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      descuentoTotal: Number(descuentoTotal.toFixed(2)),
      total: Number(total.toFixed(2)),
      requiereReceta,
      tieneControlados,
      totalItemsCount,
    };
  },
}));
