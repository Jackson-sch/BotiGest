import crypto from 'crypto';
import type { SunatComprobantePayload } from './types';

/**
 * Generador de XML UBL 2.1 estándar SUNAT conforme a la RS 150-2021.
 * Produce el árbol XML canónico con namespaces cac, cbc y ext requeridos por SUNAT.
 */
export function buildUbl21Xml(payload: SunatComprobantePayload): { xml: string; hash: string } {
  const {
    tipoComprobante,
    serie,
    numero,
    fechaEmision,
    horaEmision,
    moneda,
    emisor,
    cliente,
    items,
    subtotalGravado,
    subtotalExonerado,
    totalIgv,
    totalVenta,
  } = payload;

  const correlativo = `${serie}-${String(numero).padStart(8, '0')}`;

  const itemsXml = items
    .map((item, idx) => {
      const itemNum = idx + 1;
      const isGravado = item.tipoAfectacion === '10';

      return `
    <cac:InvoiceLine>
        <cbc:ID>${itemNum}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${item.unidadMedida}">${item.cantidad.toFixed(2)}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${moneda}">${item.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:PricingReference>
            <cac:AlternativeConditionPrice>
                <cbc:PriceAmount currencyID="${moneda}">${item.precioUnitario.toFixed(2)}</cbc:PriceAmount>
                <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
            </cac:AlternativeConditionPrice>
        </cac:PricingReference>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${moneda}">${item.igv.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="${moneda}">${item.subtotal.toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="${moneda}">${item.igv.toFixed(2)}</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>${isGravado ? '18.00' : '0.00'}</cbc:Percent>
                    <cbc:TaxExemptionReasonCode>${item.tipoAfectacion}</cbc:TaxExemptionReasonCode>
                    <cac:TaxScheme>
                        <cbc:ID>${isGravado ? '1000' : '9997'}</cbc:ID>
                        <cbc:Name>${isGravado ? 'IGV' : 'EXO'}</cbc:Name>
                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Description><![CDATA[${item.descripcion}]]></cbc:Description>
            <cac:SellersItemIdentification>
                <cbc:ID>${item.codigo}</cbc:ID>
            </cac:SellersItemIdentification>
            ${
              item.lote
                ? `<cac:ItemInstance>
                <cac:LotIdentification>
                    <cbc:LotNumberID>${item.lote}</cbc:LotNumberID>
                    <cbc:ExpiryDate>${item.fechaVencimiento || ''}</cbc:ExpiryDate>
                </cac:LotIdentification>
            </cac:ItemInstance>`
                : ''
            }
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${moneda}">${item.valorUnitario.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent>
                <!-- Firma Digital XAdES-BES se inyecta en el envío -->
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>${correlativo}</cbc:ID>
    <cbc:IssueDate>${fechaEmision}</cbc:IssueDate>
    <cbc:IssueTime>${horaEmision}</cbc:IssueTime>
    <cbc:InvoiceTypeCode listID="0101">${tipoComprobante}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${moneda}</cbc:DocumentCurrencyCode>
    <cac:Signature>
        <cbc:ID>${emisor.ruc}</cbc:ID>
        <cac:SignatoryParty>
            <cac:PartyIdentification>
                <cbc:ID>${emisor.ruc}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[${emisor.razonSocial}]]></cbc:Name>
            </cac:PartyName>
        </cac:SignatoryParty>
        <cac:DigitalSignatureAttachment>
            <cac:ExternalReference>
                <cbc:URI>#SignatureSP</cbc:URI>
            </cac:ExternalReference>
        </cac:DigitalSignatureAttachment>
    </cac:Signature>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="6">${emisor.ruc}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[${emisor.razonSocial}]]></cbc:RegistrationName>
                <cac:RegistrationAddress>
                    <cbc:AddressTypeCode>${emisor.codigoEstablecimiento}</cbc:AddressTypeCode>
                    <cbc:CityName>${emisor.provincia}</cbc:CityName>
                    <cbc:CountrySubentity>${emisor.departamento}</cbc:CountrySubentity>
                    <cbc:District>${emisor.distrito}</cbc:District>
                    <cac:AddressLine>
                        <cbc:Line><![CDATA[${emisor.direccion}]]></cbc:Line>
                    </cac:AddressLine>
                </cac:RegistrationAddress>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${cliente.tipoDoc}">${cliente.numeroDoc}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[${cliente.razonSocialONombre}]]></cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${moneda}">${totalIgv.toFixed(2)}</cbc:TaxAmount>
        ${
          subtotalGravado > 0
            ? `<cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${moneda}">${subtotalGravado.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${moneda}">${totalIgv.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID>1000</cbc:ID>
                    <cbc:Name>IGV</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>`
            : ''
        }
        ${
          subtotalExonerado > 0
            ? `<cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${moneda}">${subtotalExonerado.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${moneda}">0.00</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID>9997</cbc:ID>
                    <cbc:Name>EXO</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>`
            : ''
        }
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${moneda}">${(subtotalGravado + subtotalExonerado).toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxInclusiveAmount currencyID="${moneda}">${totalVenta.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${moneda}">${totalVenta.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    ${itemsXml}
</Invoice>`;

  const hash = crypto.createHash('sha1').update(xml).digest('base64');
  return { xml, hash };
}
