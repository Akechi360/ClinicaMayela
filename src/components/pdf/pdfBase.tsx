import React from 'react';
import logoNombre from '../../assets/brand/nombre.png';
import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

/** Identidad visual común de TODOS los PDF de la clínica (la del consentimiento): cambiar aquí cambia todos. */
export const PDF = {
  texto: '#3A434D',
  acento: '#A891AA',
  suave: '#8E9AA6',
  etiqueta: '#4B5663',
  oscuro: '#4A354E',
  fondo: '#FAF6F9',
  borde: '#E8D7E3',
  alerta: '#BA1A1A',
} as const;

export const pdfStyles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontFamily: 'Helvetica', fontSize: 10, color: PDF.texto, lineHeight: 1.6 },
  header: {
    borderBottomWidth: 1, borderBottomColor: PDF.acento, paddingBottom: 10, marginBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: PDF.acento, marginBottom: 9 },
  subtitle: { fontSize: 8, color: PDF.suave, textTransform: 'uppercase', letterSpacing: 1 },
  docTitle: { fontFamily: 'Helvetica-Bold', color: PDF.etiqueta },
  docLine: { fontSize: 9 },
  meta: { marginBottom: 20, padding: 12, backgroundColor: PDF.fondo, borderRadius: 6, borderWidth: 1, borderColor: PDF.borde },
  metaRow: { flexDirection: 'row', marginBottom: 6 },
  metaLabel: { width: 110, fontFamily: 'Helvetica-Bold', color: PDF.etiqueta },
  metaValue: { flex: 1 },
  section: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: PDF.etiqueta, marginTop: 15, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: PDF.borde, paddingBottom: 3 },
  signatureBox: { alignItems: 'center' },
  signatureLine: { width: '100%', borderTopWidth: 1, borderTopColor: PDF.suave, marginTop: 5, marginBottom: 5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: PDF.borde, paddingTop: 8, alignItems: 'center', lineHeight: '12pt' },
  footerText: { fontSize: 8, color: PDF.suave, lineHeight: '12pt' },
});

/** Cabecera estándar: marca a la izquierda, tipo de documento y datos (fecha, etc.) a la derecha. */
export const PdfHeader: React.FC<{ titulo: string; lineas?: (string | null | undefined | false)[] }> = ({ titulo, lineas = [] }) => (
  <View style={pdfStyles.header}>
    <View>
      <Image src={logoNombre} style={{ width: 180, height: 76, objectFit: 'contain', marginBottom: 2 }} />
      <Text style={pdfStyles.subtitle}>Medicina Estética & Longevidad</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={pdfStyles.docTitle}>{titulo}</Text>
      {lineas.filter(Boolean).map((l, i) => <Text key={i} style={pdfStyles.docLine}>{l}</Text>)}
    </View>
  </View>
);

/** Pie estándar fijo en todas las páginas, con teléfono opcional. */
export const PdfFooter: React.FC<{ texto: string; telefono?: string | null }> = ({ texto, telefono }) => (
  <View style={pdfStyles.footer} fixed>
    <Text style={pdfStyles.footerText}>Clínica Dra. Mayela González{telefono ? ` · Tel: ${telefono}` : ''} · {texto}</Text>
  </View>
);

/** Página A4 estándar con el pie fijo común. Ojo con react-pdf: el pie solo se dibuja con lineHeight en pt (no unitless) y sin Text con render; por eso no lleva número de página. */
export const PdfPage: React.FC<{ texto: string; telefono?: string | null; children: React.ReactNode }> = ({ texto, telefono, children }) => (
  <Page size="A4" style={pdfStyles.page}>
    {children}
    <PdfFooter texto={texto} telefono={telefono} />
  </Page>
);

export const MetaRow: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <View style={pdfStyles.metaRow}>
    <Text style={pdfStyles.metaLabel}>{label}</Text>
    <Text style={pdfStyles.metaValue}>{children}</Text>
  </View>
);

export const textoMedico = (nombre: string, mpps?: string | null, col?: string | null) =>
  `${nombre}${mpps || col ? ` (MPPS ${mpps ?? '—'} · CM ${col ?? '—'})` : ''}`;

/** Bloque de firma y sello del médico (imágenes opcionales) con su nombre y matrícula debajo. */
export const FirmaMedico: React.FC<{ nombre: string; mpps?: string | null; col?: string | null; firma?: string | null; sello?: string | null; ancho?: string | number }> =
  ({ nombre, mpps, col, firma, sello, ancho = '45%' }) => (
    <View style={[pdfStyles.signatureBox, { width: ancho }]} wrap={false}>
      <View style={{ height: 58, justifyContent: 'flex-end', alignItems: 'center' }}>
        {firma ? <Image src={firma} style={{ width: 150, height: 52, objectFit: 'contain' }} /> : null}
      </View>
      <View style={pdfStyles.signatureLine} />
      <Text style={{ fontFamily: 'Helvetica-Bold' }}>{nombre}</Text>
      <Text style={{ fontSize: 8, color: PDF.suave }}>Médico Tratante</Text>
      {mpps || col ? <Text style={{ fontSize: 7.5, color: PDF.suave }}>MPPS {mpps ?? '—'} · CM {col ?? '—'}</Text> : null}
      {sello ? <Image src={sello} style={{ width: 120, height: 72, objectFit: 'contain', marginTop: 4 }} /> : null}
    </View>
  );
