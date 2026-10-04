import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#3A434D', // Slate Dark
    lineHeight: 1.6,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#9C6348', // Satin Copper Accessible
    paddingBottom: 15,
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#9C6348',
  },
  subtitle: {
    fontSize: 9,
    color: '#5F6C7A', // Slate Light Accessible
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  doctorInfo: {
    alignItems: 'flex-end',
    fontSize: 8.5,
    color: '#5F6C7A',
    lineHeight: 1.4,
  },
  doctorName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#3A434D',
    marginBottom: 3,
  },
  patientBox: {
    marginBottom: 25,
    padding: 12,
    backgroundColor: '#FAF7F5', // Rose Champagne Light
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F2E7E2',
  },
  patientRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  patientLabel: {
    width: 90,
    fontFamily: 'Helvetica-Bold',
    color: '#4B5663',
  },
  patientValue: {
    flex: 1,
  },
  rxSection: {
    flex: 1,
    marginBottom: 30,
  },
  rxTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#9C6348',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E7E2',
    paddingBottom: 4,
  },
  rxContent: {
    fontSize: 11,
    lineHeight: 1.8,
    marginBottom: 20,
    whiteSpace: 'pre-wrap',
  },
  indicationsTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#3A434D',
    marginBottom: 6,
  },
  indicationsContent: {
    fontSize: 9.5,
    color: '#5F6C7A',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    paddingTop: 15,
  },
  signatureBox: {
    width: '50%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#5F6C7A',
    marginTop: 10,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#F2E7E2',
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#5F6C7A',
  }
});

interface RecipePDFProps {
  pacienteNombre: string;
  pacienteDni: string;
  fecha: string;
  doctorNombre: string;
  doctorEspecialidad: string;
  doctorCedula: string;
  doctorMpps?: string;
  doctorCol?: string;
  medicamentos: string;
  indicaciones?: string;
}

export const RecipePDF: React.FC<RecipePDFProps> = ({
  pacienteNombre,
  pacienteDni,
  fecha,
  doctorNombre,
  doctorEspecialidad,
  doctorCedula,
  doctorMpps,
  doctorCol,
  medicamentos,
  indicaciones
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clínica Mayela</Text>
          <Text style={styles.subtitle}>Medicina Estética & Bienestar</Text>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctorNombre}</Text>
          <Text>{doctorEspecialidad}</Text>
          <Text>Cédula: {doctorCedula}</Text>
          {doctorMpps && <Text>MPPS: {doctorMpps}</Text>}
          {doctorCol && <Text>COL: {doctorCol}</Text>}
        </View>
      </View>

      {/* Datos del Paciente */}
      <View style={styles.patientBox}>
        <View style={styles.patientRow}>
          <Text style={styles.patientLabel}>Paciente:</Text>
          <Text style={styles.patientValue}>{pacienteNombre}</Text>
        </View>
        <View style={styles.patientRow}>
          <Text style={styles.patientLabel}>Identificación/DNI:</Text>
          <Text style={styles.patientValue}>{pacienteDni}</Text>
        </View>
        <View style={styles.patientRow}>
          <Text style={styles.patientLabel}>Fecha de Emisión:</Text>
          <Text style={styles.patientValue}>{fecha}</Text>
        </View>
      </View>

      {/* Rp. Prescripción */}
      <View style={styles.rxSection}>
        <Text style={styles.rxTitle}>Rp. Prescripción Médica</Text>
        <Text style={styles.rxContent}>{medicamentos}</Text>

        {indicaciones && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.indicationsTitle}>Indicaciones Generales:</Text>
            <Text style={styles.indicationsContent}>{indicaciones}</Text>
          </View>
        )}
      </View>

      {/* Firma Médica */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <View style={{ height: 45 }} />
          <View style={styles.signatureLine} />
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{doctorNombre}</Text>
          <Text style={{ fontSize: 7.5, color: '#5F6C7A' }}>Médico Tratante</Text>
          {doctorMpps && doctorCol && (
            <Text style={{ fontSize: 7, color: '#5F6C7A' }}>MPPS {doctorMpps} • COL {doctorCol}</Text>
          )}
        </View>
      </View>

      {/* Pie de Página */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Clínica Mayela Estética Premium • Calle de la Salud 123 • Tel: +34 600 999 888 • www.clinicamayela.com</Text>
      </View>
    </Page>
  </Document>
);
