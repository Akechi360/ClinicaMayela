import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const s = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 10, color: '#4A354E', lineHeight: 1.5 },
  header: { borderBottomWidth: 2, borderBottomColor: '#8F6FA8', paddingBottom: 14, marginBottom: 22, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#8F6FA8', marginBottom: 9 },
  subtitle: { fontSize: 9, color: '#6D5572', textTransform: 'uppercase', letterSpacing: 1 },
  doc: { alignItems: 'flex-end', fontSize: 8.5, color: '#6D5572', lineHeight: 1.4 },
  docName: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#4A354E', marginBottom: 3 },
  heading: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#8F6FA8', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E8D7E3', paddingBottom: 4 },
  box: { marginBottom: 18, padding: 12, backgroundColor: '#FAF6F9', borderRadius: 8, borderWidth: 1, borderColor: '#E8D7E3' },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 95, fontFamily: 'Helvetica-Bold', color: '#4A354E' },
  item: { flexDirection: 'row', marginBottom: 6, fontSize: 11 },
  check: { width: 18, fontFamily: 'Helvetica-Bold', color: '#8F6FA8' },
  notes: { marginTop: 16, fontSize: 9.5, color: '#6D5572' },
  sig: { marginTop: 36, flexDirection: 'row', justifyContent: 'flex-end' },
  sigBox: { width: '48%', alignItems: 'center' },
  sigLine: { width: '100%', borderTopWidth: 1, borderTopColor: '#6D5572', marginTop: 6, marginBottom: 3 },
  footer: { position: 'absolute', bottom: 32, left: 50, right: 50, borderTopWidth: 1, borderTopColor: '#E8D7E3', paddingTop: 8, alignItems: 'center' },
  footerText: { fontSize: 8, color: '#6D5572' },
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
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Clínica Dra. Mayela González</Text>
          <Text style={s.subtitle}>Medicina Estética & Longevidad</Text>
        </View>
        <View style={s.doc}>
          <Text style={s.docName}>{p.doctorNombre}</Text>
          {p.doctorEspecialidad ? <Text>{p.doctorEspecialidad}</Text> : null}
          {p.doctorMpps ? <Text>MPPS N° {p.doctorMpps}</Text> : null}
          {p.doctorCol ? <Text>Colegio de Médicos N° {p.doctorCol}</Text> : null}
        </View>
      </View>

      <View style={s.box}>
        <View style={s.row}><Text style={s.label}>Paciente:</Text><Text>{p.pacienteNombre}</Text></View>
        <View style={s.row}><Text style={s.label}>Cédula:</Text><Text>{p.pacienteDni || '—'}</Text></View>
        <View style={s.row}><Text style={s.label}>Fecha:</Text><Text>{p.fecha}</Text></View>
        <View style={s.row}><Text style={s.label}>Perfil:</Text><Text>{p.perfil}</Text></View>
      </View>

      <Text style={s.heading}>Orden de laboratorio clínico</Text>
      <Text style={{ marginBottom: 10 }}>Se solicitan los siguientes estudios:</Text>
      {p.estudios.map((e) => (
        <View key={e} style={s.item} wrap={false}>
          <Text style={s.check}>[x]</Text>
          <Text>{e}</Text>
        </View>
      ))}
      {p.notas ? <Text style={s.notes}>Indicaciones: {p.notas}</Text> : null}

      <View style={s.sig} wrap={false}>
        <View style={s.sigBox}>
          <View style={{ height: 62, justifyContent: 'flex-end', alignItems: 'center', flexDirection: 'row' }}>
            {p.firma ? <Image src={p.firma} style={{ height: 54, maxWidth: 120, objectFit: 'contain' }} /> : null}
            {p.sello ? <Image src={p.sello} style={{ height: 58, maxWidth: 80, objectFit: 'contain', marginLeft: 6 }} /> : null}
          </View>
          <View style={s.sigLine} />
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{p.doctorNombre}</Text>
          <Text style={{ fontSize: 7.5, color: '#6D5572' }}>Médico Tratante</Text>
        </View>
      </View>

      <View style={s.footer} fixed>
        <Text style={s.footerText}>Clínica Dra. Mayela González{p.doctorTelefono ? ` · Tel: ${p.doctorTelefono}` : ''} · Orden médica generada electrónicamente</Text>
      </View>
    </Page>
  </Document>
);
