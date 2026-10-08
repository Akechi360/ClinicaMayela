import React from 'react';
import { Document, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { AVISO_LEGAL_MEDICO } from '../data/avisoLegalMedico';
import { PDF, PdfPage, PdfHeader, MetaRow, pdfStyles as base, textoMedico } from './pdf/pdfBase';

const styles = StyleSheet.create({
  bodyText: { marginBottom: 12, textAlign: 'justify' },
  clausulaTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: PDF.etiqueta, marginTop: 15, marginBottom: 6 },
  signatureSection: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: '45%', alignItems: 'center' },
  signatureLine: { width: '100%', borderTopWidth: 1, borderTopColor: PDF.suave, marginTop: 5, marginBottom: 5 },
  signatureImage: { width: 120, height: 60, marginBottom: 5 },
  legalTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: PDF.oscuro, marginTop: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  legalText: { fontSize: 9, color: PDF.etiqueta, textAlign: 'justify', marginBottom: 6, lineHeight: 1.45 },
  metaFirma: { marginTop: 18, padding: 8, backgroundColor: PDF.fondo, borderRadius: 4, borderWidth: 1, borderColor: PDF.borde, fontSize: 8, color: PDF.etiqueta, lineHeight: 1.5 },
});

interface ConsentimientoPDFProps {
  pacienteNombre: string;
  pacienteDni: string;
  tratamientoNombre: string;
  fecha: string;
  doctorNombre: string;
  firmaBase64: string | null;
  clausulas: string[];
  doctorMpps?: string | null;
  doctorCol?: string | null;
  /** Fecha y hora de firma ya formateadas (hora de Caracas); la fija el servidor al guardar la firma. */
  firmadoEn?: string;
  docVersion?: string | null;
  docId?: string;
}

export const ConsentimientoPDF: React.FC<ConsentimientoPDFProps> = ({
  pacienteNombre,
  pacienteDni,
  tratamientoNombre,
  fecha,
  doctorNombre,
  firmaBase64,
  clausulas,
  doctorMpps,
  doctorCol,
  firmadoEn,
  docVersion,
  docId,
}) => (
  <Document>
    <PdfPage texto="Consentimiento informado generado electrónicamente">
      <PdfHeader titulo="CONSENTIMIENTO INFORMADO" lineas={[`Fecha: ${fecha}`]} />

      {/* Datos del Paciente */}
      <View style={base.meta}>
        <MetaRow label="Paciente:">{pacienteNombre}</MetaRow>
        <MetaRow label="Identificación/DNI:">{pacienteDni}</MetaRow>
        <MetaRow label="Tratamiento:">{tratamientoNombre}</MetaRow>
        <MetaRow label="Médico Tratante:">{textoMedico(doctorNombre, doctorMpps, doctorCol)}</MetaRow>
      </View>

      {/* Introducción */}
      <Text style={styles.bodyText}>
        Yo, el paciente arriba identificado, manifiesto de forma libre y consciente mi conformidad para la realización del procedimiento estético de {tratamientoNombre}. He sido informado detalladamente por el profesional de la salud sobre los objetivos, beneficios, riesgos y efectos secundarios asociados al tratamiento.
      </Text>

      {/* Clausulado */}
      <Text style={styles.clausulaTitle}>Términos y Aceptación:</Text>
      {clausulas.map((clausula, idx) => (
        <Text key={idx} style={[styles.bodyText, { marginLeft: 10 }]}>
          {idx + 1}. {clausula}
        </Text>
      ))}

      {/* Aviso legal y descargo médico */}
      <Text style={[styles.clausulaTitle, { marginTop: 18 }]}>Aviso legal y descargo médico</Text>
      {AVISO_LEGAL_MEDICO.map((b, i) => (
        <View key={b.titulo} wrap={false}>
          <Text style={styles.legalTitle}>{i + 1}. {b.titulo}</Text>
          <Text style={styles.legalText}>{b.texto}</Text>
        </View>
      ))}

      {/* Seccion de Firmas */}
      <View style={styles.signatureSection} wrap={false}>
        {/* Firma Profesional */}
        <View style={styles.signatureBox}>
          <View style={{ height: 60 }} />
          <View style={styles.signatureLine} />
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{doctorNombre}</Text>
          <Text style={{ fontSize: 8, color: PDF.suave }}>Médico Tratante</Text>
        </View>

        {/* Firma Paciente */}
        <View style={styles.signatureBox}>
          {firmaBase64 ? (
            <Image src={firmaBase64.replace(/\s/g, '')} style={styles.signatureImage} />
          ) : (
            <View style={{ height: 60, justifyContent: 'center' }}>
              <Text style={{ color: PDF.alerta, fontSize: 8 }}>PENDIENTE DE FIRMA</Text>
            </View>
          )}
          <View style={styles.signatureLine} />
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{pacienteNombre}</Text>
          <Text style={{ fontSize: 8, color: PDF.suave }}>Firma del Paciente / Tutor</Text>
        </View>
      </View>

      <View style={styles.metaFirma} wrap={false}>
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>Registro de firma electrónica</Text>
        <Text>Firmado el: {firmadoEn || 'PENDIENTE DE FIRMA'}</Text>
        <Text>Paciente: {pacienteNombre} · Documento de identidad: {pacienteDni}</Text>
        <Text>Médico tratante: {doctorNombre}{doctorMpps ? ` · MPPS ${doctorMpps}` : ''}{doctorCol ? ` · CM ${doctorCol}` : ''}</Text>
        <Text>Versión del documento legal: {docVersion || '—'}{docId ? ` · ID ${docId}` : ''}</Text>
      </View>
    </PdfPage>
  </Document>
);
