/** Aviso legal y descargo médico que acompaña a todo consentimiento informado.
 *  Cualquier cambio de texto debe subir LEGAL_VERSION (queda registrada en cada documento firmado).
 *  Redacción de apoyo: debe ser revisada por un abogado antes de darla por definitiva. */
export const LEGAL_VERSION = '2026.10';

export interface BloqueLegal { titulo: string; texto: string }

export const AVISO_LEGAL_MEDICO: BloqueLegal[] = [
  {
    titulo: 'Declaración de veracidad',
    texto:
      'Declaro bajo fe de juramento que he informado de manera completa y veraz mis antecedentes personales y familiares, patologías previas, alergias, ' +
      'medicamentos y suplementos que utilizo (incluidos anticoagulantes y aspirina), embarazo o lactancia y tratamientos estéticos anteriores, sin omitir ' +
      'ningún dato. Entiendo que ocultar o alterar información puede aumentar los riesgos del procedimiento y que el equipo médico no responde de las ' +
      'consecuencias que deriven exclusivamente de esa omisión.',
  },
  {
    titulo: 'Variabilidad biológica y ausencia de garantía de resultados',
    texto:
      'Reconozco que la medicina estética y las terapias biológicas dependen de factores metabólicos, de la edad, del estilo de vida y de la respuesta ' +
      'tisular de cada persona, por lo que los resultados varían entre pacientes y no están garantizados. No se me ha prometido un resultado idéntico, ' +
      'específico ni permanente.',
  },
  {
    titulo: 'Riesgos inherentes y efectos secundarios advertidos',
    texto:
      'He sido informado(a) de que pueden presentarse edema, hematomas, eritema, dolor, asimetrías transitorias, nódulos, infección o reacciones alérgicas, ' +
      'y, de forma excepcional, complicaciones vasculares. En los procedimientos con ácido hialurónico se dispone de hialuronidasa y de otras medidas de ' +
      'rescate. Me comprometo a seguir las indicaciones posteriores y a comunicar de inmediato dolor intenso, cambios de color en la piel o alteraciones ' +
      'visuales.',
  },
  {
    titulo: 'Descargo de responsabilidad y voluntariedad',
    texto:
      'He leído y comprendido este documento, tuve la oportunidad de hacer preguntas y fueron respondidas. Mi consentimiento es libre y voluntario y sé que ' +
      'puedo revocarlo antes del procedimiento. Asumo los riesgos descritos, siempre que el procedimiento se realice conforme a las buenas prácticas ' +
      'clínicas.',
  },
  {
    titulo: 'Validez de la firma electrónica',
    texto:
      'Reconozco que mi firma digitalizada y los datos de este documento (fecha y hora exactas de la firma, documento de identidad, médico tratante y ' +
      'versión del documento) constituyen un mensaje de datos con eficacia probatoria conforme a la Ley sobre Mensajes de Datos y Firmas Electrónicas.',
  },
];
