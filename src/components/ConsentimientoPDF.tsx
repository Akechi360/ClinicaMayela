import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#3A434D', // Slate Dark
    lineHeight: 1.6,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#A66E53', // Satin Copper
    paddingBottom: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#A66E53',
  },
  subtitle: {
    fontSize: 8,
    color: '#8E9AA6',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#FBF8F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F2E7E2',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    width: 100,
    fontFamily: 'Helvetica-Bold',
    color: '#4B5663',
  },
  metaValue: {
    flex: 1,
  },
  bodyText: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  clausulaTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#4B5663',
    marginTop: 15,
    marginBottom: 6,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#8E9AA6',
    marginTop: 5,
    marginBottom: 5,
  },
  signatureImage: {
    width: 120,
    height: 60,
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#F2E7E2',
    paddingTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#8E9AA6',
  }
});

interface ConsentimientoPDFProps {
  pacienteNombre: string;
  pacienteDni: string;
  tratamientoNombre: string;
  fecha: string;
  doctorNombre: string;
  firmaBase64: string | null;
  clausulas: string[];
}

export const ConsentimientoPDF: React.FC<ConsentimientoPDFProps> = ({
  pacienteNombre,
  pacienteDni,
  tratamientoNombre,
  fecha,
  doctorNombre,
  firmaBase64,
  clausulas
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clínica Mayela</Text>
          <Text style={styles.subtitle}>Medicina Estética & Bienestar</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', color: '#4B5663' }}>CONSENTIMIENTO INFORMADO</Text>
          <Text style={{ fontSize: 9 }}>Fecha: {fecha}</Text>
        </View>
      </View>

      {/* Datos del Paciente */}
      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Paciente:</Text>
          <Text style={styles.metaValue}>{pacienteNombre}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Identificación/DNI:</Text>
          <Text style={styles.metaValue}>{pacienteDni}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Tratamiento:</Text>
          <Text style={styles.metaValue}>{tratamientoNombre}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Médico Tratante:</Text>
          <Text style={styles.metaValue}>{doctorNombre}</Text>
        </View>
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

      {/* Seccion de Firmas */}
      <View style={styles.signatureSection}>
        {/* Firma Profesional */}
        <View style={styles.signatureBox}>
          <View style={{ height: 60 }} />
          <View style={styles.signatureLine} />
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{doctorNombre}</Text>
          <Text style={{ fontSize: 8, color: '#8E9AA6' }}>Médico Tratante</Text>
        </View>

        {/* Firma Paciente */}
        <View style={styles.signatureBox}>
          {firmaBase64 ? (
            <Image src={firmaBase64} style={styles.signatureImage} />
          ) : (
            <View style={{ height: 60, justifyContent: 'center' }}>
              <Text style={{ color: '#BA1A1A', fontSize: 8 }}>PENDIENTE DE FIRMA</Text>
            </View>
          )}
          <View style={styles.signatureLine} />
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{pacienteNombre}</Text>
          <Text style={{ fontSize: 8, color: '#8E9AA6' }}>Firma del Paciente / Tutor</Text>
        </View>
      </View>

      {/* Pie de Pagina */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Clínica Mayela Estética Premium • Calle de la Salud 123 • www.clinicamayela.com</Text>
      </View>
    </Page>
  </Document>
);
