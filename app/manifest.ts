import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BotiGest · Sistema Farmacéutico Inteligente',
    short_name: 'BotiGest',
    description: 'Gestión integral para farmacias y boticas: POS, kardex FEFO, recetas y facturación SUNAT',
    start_url: '/pos',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0a0a0c',
    theme_color: '#0071e3',
    categories: ['medical', 'business', 'finance'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Punto de Venta (POS)',
        short_name: 'POS',
        description: 'Venta rápida en mostrador y escáner de código de barras',
        url: '/pos',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Historial de Ventas',
        short_name: 'Ventas',
        description: 'Consulta de comprobantes, facturas y boletas',
        url: '/ventas',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Inventario & Lotes FEFO',
        short_name: 'Inventario',
        description: 'Control de vencimientos y stock farmacéutico',
        url: '/inventario',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Caja & Arqueo',
        short_name: 'Caja',
        description: 'Apertura, movimientos y cierre de turno de caja',
        url: '/caja',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
