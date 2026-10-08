import React from 'react';
import { Document, StyleSheet, Text, View } from '@react-pdf/renderer';
import { PDF, FirmaMedico, MetaRow, PdfPage, PdfHeader, pdfStyles as base, textoMedico } from './pdf/pdfBase';

const s = StyleSheet.create({
  item: { flexDirection: 'row', width: '50%', marginBottom: 4, paddingRight: 8, fontSize: 10 },
  check: { width: 22, fontFamily: 'Helvetica-Bold', color: PDF.acento },
  notes: { marginTop: 10, fontSize: 9.5, color: PDF.etiqueta },
});

export interface OrdenLaboratorioPDFProps {
  pacienteNombre: string;
  pacienteDni: string;
  fecha: string;
  perfil: string;
  estudios: string[];
  notas?: string | null;
  doctorNombre: string;
  doctorEspecialidad?: string;
  doctorMpps?: string | null;
  doctorCol?: string | null;
  doctorTelefono?: string | null;
  firma?: string | null;
  sello?: string | null;
}

export const OrdenLaboratorioPDF: React.FC<OrdenLaboratorioPDFProps> = (p) => (
  <Document>
    <PdfPage texto="Orden médica generada electrónicamente" telefono={p.doctorTelefono}>
      <PdfHeader titulo="ORDEN DE LABORATORIO" lineas={[`Fecha: ${p.fecha}`]} />

      <View style={base.meta}>
        <MetaRow label="Paciente:">{p.pacienteNombre}</MetaRow>
        <MetaRow label="Identificación/DNI:">{p.pacienteDni || '—'}</MetaRow>
        <MetaRow label="Perfil:">{p.perfil}</MetaRow>
        <MetaRow label="Médico Tratante:">{textoMedico(p.doctorNombre, p.doctorMpps, p.doctorCol)}</MetaRow>
      </View>

      <Text style={base.section}>Estudios solicitados</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {p.estudios.map((e) => (
        <View key={e} style={s.item} wrap={false}>
          <Text style={s.check}>[x]</Text>
          <Text>{e}</Text>
        </View>
      ))}
      </View>
      {p.notas ? <Text style={s.notes}>Indicaciones: {p.notas}</Text> : null}

      <View style={{ marginTop: 22, flexDirection: 'row', justifyContent: 'flex-end' }} wrap={false}>
        <FirmaMedico nombre={p.doctorNombre} mpps={p.doctorMpps} col={p.doctorCol} firma={p.firma} sello={p.sello} ancho="45%" />
      </View>
    </PdfPage>
  </Document>
);
