import React from 'react';
import { Document, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { PDF, FirmaMedico, MetaRow, PdfPage, PdfHeader, pdfStyles as base, textoMedico } from './pdf/pdfBase';

const styles = StyleSheet.create({
  rxContent: { fontSize: 11, lineHeight: 1.8, marginBottom: 20 },
  indicationsTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: PDF.etiqueta, marginBottom: 6 },
  indicationsContent: { fontSize: 9.5, color: PDF.etiqueta, lineHeight: 1.6 },
});

interface RecipePDFProps {
  pacienteNombre: string;
  pacienteDni: string;
  fecha: string;
  doctorNombre: string;
  doctorEspecialidad: string;
  doctorTelefono?: string;
  doctorMpps?: string;
  doctorCol?: string;
  /** Firma y sello digitalizados (data URL PNG) */
  firma?: string | null;
  sello?: string | null;
  /** QR de validación y código corto del hash SHA-256 */
  qr?: string;
  codigo?: string;
  medicamentos: string;
  indicaciones?: string;
}

export const RecipePDF: React.FC<RecipePDFProps> = ({
  pacienteNombre,
  pacienteDni,
  fecha,
  doctorNombre,
  doctorEspecialidad,
  doctorTelefono,
  doctorMpps,
  doctorCol,
  firma,
  sello,
  qr,
  codigo,
  medicamentos,
  indicaciones
}) => (
  <Document>
    <PdfPage texto="Récipe digital con validación por código QR" telefono={doctorTelefono}>
      <PdfHeader titulo="RÉCIPE MÉDICO" lineas={[`Fecha: ${fecha}`]} />

      <View style={base.meta}>
        <MetaRow label="Paciente:">{pacienteNombre}</MetaRow>
        <MetaRow label="Identificación/DNI:">{pacienteDni}</MetaRow>
        <MetaRow label="Médico Tratante:">{textoMedico(doctorNombre, doctorMpps, doctorCol)}</MetaRow>
        {doctorEspecialidad ? <MetaRow label="Especialidad:">{doctorEspecialidad}</MetaRow> : null}
      </View>

      {/* Rp. Prescripción */}
      <Text style={base.section}>Rp. Prescripción Médica</Text>
      <Text style={styles.rxContent}>{medicamentos}</Text>

      {indicaciones ? (
        <View style={{ marginTop: 6 }}>
          <Text style={styles.indicationsTitle}>Indicaciones Generales:</Text>
          <Text style={styles.indicationsContent}>{indicaciones}</Text>
        </View>
      ) : null}

      {/* Firma, sello y validación */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }} wrap={false}>
        <FirmaMedico nombre={doctorNombre} mpps={doctorMpps} col={doctorCol} firma={firma} sello={sello} />
        {qr ? (
          <View style={{ alignItems: 'center', width: 110 }}>
            <Image src={qr} style={{ width: 84, height: 84 }} />
            <Text style={{ fontSize: 6.5, color: PDF.suave, textAlign: 'center', marginTop: 3 }}>Escanee para verificar la autenticidad de este récipe</Text>
            {codigo ? <Text style={{ fontSize: 6.5, fontFamily: 'Courier', color: PDF.texto, marginTop: 1 }}>{codigo}</Text> : null}
          </View>
        ) : null}
      </View>
    </PdfPage>
  </Document>
);
