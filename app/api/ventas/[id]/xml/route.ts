import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { buildUbl21Xml } from '@/lib/sunat/ubl-builder';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const formato = searchParams.get('format') || 'xml'; // 'xml' | 'cdr'

    // Obtener datos de la venta y comprobante
    const sql = `
      SELECT 
        v.id,
        v.tipo_comprobante,
        v.serie,
        v.numero,
        to_char(v.fecha_emision, 'YYYY-MM-DD') as fecha_emision,
        to_char(v.fecha_emision, 'HH24:MI:SS') as hora_emision,
        v.moneda,
        v.subtotal_gravado,
        v.subtotal_exonerado,
        v.igv,
        v.total,
        c.tipo_documento as cliente_tipo_doc,
        c.numero_documento as cliente_num_doc,
        c.nombres as cliente_nombre,
        c.direccion as cliente_direccion,
        t.ruc as emisor_ruc,
        t.razon_social as emisor_razon,
        t.nombre_comercial as emisor_nombre,
        ce.hash,
        ce.codigo_sunat,
        ce.mensaje_sunat
      FROM public.ventas v
      JOIN public.tenants t ON t.id = v.tenant_id
      LEFT JOIN public.clientes c ON c.id = v.cliente_id
      LEFT JOIN public.comprobantes_electronicos ce ON ce.venta_id = v.id
      WHERE v.id = $1;
    `;

    const venta = await queryOne<any>(sql, [id]);
    if (!venta) {
      return new NextResponse('Comprobante no encontrado', { status: 404 });
    }

    const correlativo = `${venta.serie}-${String(venta.numero).padStart(8, '0')}`;
    const filenameBase = `${venta.emisor_ruc}-${venta.tipo_comprobante === 'factura' ? '01' : '03'}-${correlativo}`;

    if (formato === 'cdr') {
      // Simular/generar Constancia de Recepción (CDR) en XML estándar SUNAT
      const cdrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"
                     xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                     xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>${correlativo}</cbc:ID>
    <cbc:IssueDate>${venta.fecha_emision}</cbc:IssueDate>
    <cbc:IssueTime>${venta.hora_emision}</cbc:IssueTime>
    <cac:SenderParty>
        <cac:PartyIdentification>
            <cbc:ID schemeID="6">20131312955</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyName>
            <cbc:Name>SUNAT</cbc:Name>
        </cac:PartyName>
    </cac:SenderParty>
    <cac:ReceiverParty>
        <cac:PartyIdentification>
            <cbc:ID schemeID="6">${venta.emisor_ruc}</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyName>
            <cbc:Name><![CDATA[${venta.emisor_razon}]]></cbc:Name>
        </cac:PartyName>
    </cac:ReceiverParty>
    <cac:DocumentResponse>
        <cac:Response>
            <cbc:ReferenceID>${correlativo}</cbc:ReferenceID>
            <cbc:ResponseCode>${venta.codigo_sunat || '0'}</cbc:ResponseCode>
            <cbc:Description><![CDATA[${venta.mensaje_sunat || 'La Boleta de Venta ha sido aceptada por SUNAT.'}]]></cbc:Description>
        </cac:Response>
        <cac:DocumentReference>
            <cbc:ID>${correlativo}</cbc:ID>
            <cbc:DocumentTypeCode>${venta.tipo_comprobante === 'factura' ? '01' : '03'}</cbc:DocumentTypeCode>
        </cac:DocumentReference>
    </cac:DocumentResponse>
</ApplicationResponse>`;

      return new NextResponse(cdrXml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="R-${filenameBase}.xml"`,
        },
      });
    }

    // Formato XML UBL 2.1 estándar
    const { xml } = buildUbl21Xml({
      tipoComprobante: venta.tipo_comprobante === 'factura' ? '01' : '03',
      serie: venta.serie,
      numero: venta.numero,
      fechaEmision: venta.fecha_emision,
      horaEmision: venta.hora_emision,
      moneda: venta.moneda || 'PEN',
      emisor: {
        ruc: venta.emisor_ruc,
        razonSocial: venta.emisor_razon,
        nombreComercial: venta.emisor_nombre,
        ubigeo: '150101',
        direccion: 'Av. Principal 123',
        provincia: 'LIMA',
        departamento: 'LIMA',
        distrito: 'LIMA',
        codigoEstablecimiento: '0000',
      },
      cliente: {
        tipoDoc: (venta.cliente_tipo_doc === 'ruc' ? '6' : '1') as any,
        numeroDoc: venta.cliente_num_doc || '00000000',
        razonSocialONombre: venta.cliente_nombre || 'CLIENTES VARIOS',
        direccion: venta.cliente_direccion || '-',
      },
      items: [
        {
          id: '1',
          codigo: 'ITEM-01',
          descripcion: 'CONSUMO DE FÁRMACOS Y MEDICINAS',
          unidadMedida: 'NIU',
          cantidad: 1,
          valorUnitario: Number(venta.subtotal_gravado || venta.total),
          precioUnitario: Number(venta.total),
          subtotal: Number(venta.subtotal_gravado || venta.total),
          igv: Number(venta.igv || 0),
          total: Number(venta.total),
          tipoAfectacion: Number(venta.igv) > 0 ? '10' : '20',
        },
      ],
      subtotalGravado: Number(venta.subtotal_gravado || 0),
      subtotalExonerado: Number(venta.subtotal_exonerado || 0),
      subtotalInafecto: 0,
      totalIgv: Number(venta.igv || 0),
      totalDescuento: 0,
      totalVenta: Number(venta.total || 0),
    });

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filenameBase}.xml"`,
      },
    });
  } catch (error: any) {
    console.error('Error al descargar XML/CDR:', error);
    return new NextResponse('Error al generar archivo', { status: 500 });
  }
}
