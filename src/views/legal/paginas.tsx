import React from 'react';
import { Link } from 'react-router-dom';
import { Aviso, LegalLayout, Lista, Seccion } from './LegalLayout';

/* El número de contacto vive solo en la página principal (botón "WhatsApp de Citas"); aquí se remite a ella. */
const Contacto = () => <Link to="/" className="text-aurora-deep underline">el WhatsApp de citas de la página principal</Link>;

/* ───────────────────────── AVISO LEGAL ───────────────────────── */
export const AvisoLegal: React.FC = () => (
  <LegalLayout
    titulo="Aviso legal"
    resumen="Quién somos, qué es y qué no es este sitio, y los límites de la información que publicamos."
  >
    <Seccion titulo="1. Titular del sitio">
      <Lista items={[
        <><b>Clínica Dra. Mayela González</b> — consulta de Medicina Estética y Longevidad.</>,
        <>Médica tratante: <b>Dra. Mayela González</b> · MPPS N° 652562 · Colegio de Médicos N° 7645.</>,
        <>Ubicación: Av. Principal de Las Mercedes, Caracas, República Bolivariana de Venezuela.</>,
        <>Contacto: <Contacto />.</>,
      ]} />
    </Seccion>

    <Seccion titulo="2. Carácter informativo">
      <p>Los contenidos de este sitio son divulgativos. <b>No constituyen consulta, diagnóstico, prescripción ni tratamiento</b> y no sustituyen la evaluación médica presencial. No utilices la información publicada para automedicarte ni para modificar un tratamiento en curso.</p>
    </Seccion>

    <Seccion titulo="3. Resultados y riesgos">
      <p>La medicina estética y las terapias biológicas dependen de factores individuales como la edad, el metabolismo, los antecedentes y la respuesta de los tejidos. <b>No se garantizan resultados idénticos ni específicos.</b></p>
      <p>Todo procedimiento tiene riesgos inherentes, por ejemplo edema, hematomas, enrojecimiento, asimetrías transitorias y, de forma excepcional, complicaciones vasculares. En los rellenos de ácido hialurónico se dispone de hialuronidasa como medida de rescate. Estos riesgos se explican en detalle y se aceptan por escrito mediante el <b>consentimiento informado</b>, antes de cada procedimiento.</p>
    </Seccion>

    <Seccion titulo="4. Terapias con péptidos y otros productos">
      <p>Su indicación corresponde exclusivamente a la médica tratante, tras una evaluación individual de antecedentes, alergias y contraindicaciones, y con consentimiento informado. Algunos productos o indicaciones pueden no contar con una aprobación sanitaria específica para ese uso; por eso no se ofrecen como medicamentos de venta libre ni sin valoración previa.</p>
    </Seccion>

    <Seccion titulo="5. Récipes digitales verificables">
      <p>Los récipes emitidos por la clínica llevan un código QR. Al escanearlo, cualquier persona (por ejemplo, una farmacia) puede comprobar si el documento es auténtico, si fue anulado y si coincide con el original. La página de verificación muestra solo los datos mínimos necesarios, con el nombre del paciente abreviado. La validez de los documentos y firmas electrónicas se apoya en la Ley sobre Mensajes de Datos y Firmas Electrónicas.</p>
    </Seccion>

    <Seccion titulo="6. Propiedad intelectual y marcas de terceros">
      <p>Los textos, el diseño y las imágenes propias de la clínica no pueden reproducirse sin autorización. Las marcas y fotografías de productos de terceros (por ejemplo, los laboratorios fabricantes) pertenecen a sus titulares y se muestran con fines informativos.</p>
    </Seccion>

    <Seccion titulo="7. Portal del personal médico">
      <p>El acceso al portal clínico está restringido al personal autorizado. Intentar acceder sin autorización o exceder los permisos concedidos está prohibido y puede constituir un delito conforme a la Ley Especial contra los Delitos Informáticos.</p>
    </Seccion>

    <Seccion titulo="8. Enlaces y servicios de terceros">
      <p>Este sitio enlaza con servicios externos, como WhatsApp para solicitar citas. Su uso se rige por los términos y políticas de privacidad de cada proveedor, sobre los que la clínica no tiene control.</p>
    </Seccion>

    <Seccion titulo="9. Legislación aplicable y cambios">
      <p>Este aviso se rige por las leyes de la República Bolivariana de Venezuela. Podemos actualizarlo; la fecha de la última revisión figura al inicio de la página.</p>
    </Seccion>
  </LegalLayout>
);

/* ───────────────────────── PRIVACIDAD ───────────────────────── */
export const Privacidad: React.FC = () => (
  <LegalLayout
    titulo="Privacidad y protección de datos"
    resumen="Qué datos personales y de salud tratamos, para qué, quién los ve y cómo ejerces tus derechos."
  >
    <Seccion titulo="1. Responsable">
      <p>Clínica Dra. Mayela González (Dra. Mayela González, MPPS 652562 · COL 7645). Para cualquier consulta sobre tus datos escríbenos por <Contacto />.</p>
    </Seccion>

    <Seccion titulo="2. Qué datos tratamos">
      <p><b>Si eres paciente:</b></p>
      <Lista items={[
        'Identificación y contacto: nombre, cédula, teléfono, correo, fecha de nacimiento, género.',
        'Datos de salud: antecedentes, alergias, historial clínico, tratamientos y productos aplicados (con lote), laboratorios, composición corporal, protocolos de péptidos.',
        'Imágenes: fotografías antes/después y mapa facial, solo con tu autorización.',
        'Documentos: consentimientos informados con tu firma, récipes y citas.',
      ]} />
      <p><b>Si solo visitas este sitio:</b> no te pedimos datos ni usamos analítica o publicidad. Consulta la página de <a href="/cookies" className="text-aurora-deep underline">cookies</a> para el detalle técnico.</p>
    </Seccion>

    <Seccion titulo="3. Para qué los usamos">
      <Lista items={[
        'Prestar la atención médica y mantener tu historia clínica.',
        'Gestionar citas y enviarte recordatorios y cuidados por WhatsApp, solo si lo aceptas.',
        'Emitir récipes y consentimientos con validez verificable.',
        'Cumplir obligaciones legales y éticas de la profesión médica.',
      ]} />
      <p><b>No vendemos tus datos ni los usamos para publicidad de terceros.</b> Tus datos de salud no se usan en marketing ni se publican (por ejemplo, tus fotos) sin tu autorización expresa.</p>
    </Seccion>

    <Seccion titulo="4. Secreto médico y quién tiene acceso">
      <p>La información clínica está protegida por el <b>secreto profesional</b> que establece el Código de Deontología Médica. Hoy el acceso a la plataforma clínica está limitado a la Dra. Mayela González. Si en el futuro se incorpora personal de apoyo, tendrá acceso restringido y quedará obligado a la misma confidencialidad.</p>
    </Seccion>

    <Seccion titulo="5. Cuánto tiempo los conservamos">
      <p>La historia clínica se conserva el tiempo que exigen el criterio médico y las normas aplicables. Los datos no clínicos (por ejemplo, de contacto) se conservan mientras mantengamos la relación asistencial o hasta que solicites su supresión, cuando sea procedente.</p>
    </Seccion>

    <Seccion titulo="6. Tus derechos">
      <p>La Constitución de la República Bolivariana de Venezuela reconoce el derecho de toda persona a conocer los datos que sobre ella constan en registros, a rectificarlos o a solicitar su destrucción cuando sean inexactos o lesivos (art. 28), y a la protección de su honor, vida privada, intimidad, propia imagen, confidencialidad y reputación (art. 60). En la clínica puedes:</p>
      <Lista items={[
        'Acceder a la información de tu ficha y pedir una copia.',
        'Solicitar la corrección de datos inexactos.',
        'Pedir la supresión de datos o fotografías cuando la ley y la ética médica lo permitan.',
        'Retirar tu autorización para recibir mensajes de WhatsApp.',
      ]} />
      <p>Escríbenos por <Contacto /> o solicítalo en consulta. Venezuela no cuenta con una ley integral de protección de datos personales; aplicamos estos principios de forma voluntaria como buena práctica.</p>
    </Seccion>

  </LegalLayout>
);

/* ───────────────────────── SEGURIDAD Y NORMATIVA ───────────────────────── */
export const Seguridad: React.FC = () => (
  <LegalLayout
    titulo="Seguridad de la información y normativa"
    resumen="El marco legal venezolano que nos orienta y los estándares internacionales que tomamos como referencia para proteger tu información."
  >
    <Seccion titulo="1. Marco normativo venezolano que nos orienta">
      <Lista items={[
        <><b>Constitución de la República Bolivariana de Venezuela</b>, arts. 28 (acceso y rectificación de datos personales) y 60 (honor, vida privada, intimidad y confidencialidad).</>,
        <><b>Ley sobre Mensajes de Datos y Firmas Electrónicas</b> (Gaceta Oficial N° 37.148 del 28 de febrero de 2001): eficacia probatoria de los documentos y firmas electrónicas.</>,
        <><b>Ley Especial contra los Delitos Informáticos</b> (Gaceta Oficial N° 37.313 del 30 de octubre de 2001): sanciona el acceso indebido a sistemas informáticos.</>,
        <><b>Código de Deontología Médica</b> (Federación Médica Venezolana, 1985): secreto profesional y confidencialidad de la historia clínica.</>,
        <><b>Ley del Ejercicio de la Medicina</b> (1982).</>,
      ]} />
      <Aviso>Venezuela no tiene una ley integral de protección de datos personales. Por eso, además de cumplir lo anterior, adoptamos de forma voluntaria buenas prácticas internacionales.</Aviso>
    </Seccion>

    <Seccion titulo="2. Estándares internacionales de referencia">
      <p>Los usamos como guía de buenas prácticas para proteger la información clínica.</p>
      <Lista items={[
        <><b>ISO/IEC 27799</b> (seguridad de la información en salud): control de acceso, auditoría y confidencialidad de datos clínicos.</>,
        <><b>HIPAA Security Rule</b> (EE. UU.): referencia para cifrado, control de acceso, auditoría y cierre automático de sesión.</>,
        <><b>IHE ATNA</b>: modelo para la trazabilidad de accesos y modificaciones (quién, cuándo, sobre qué paciente).</>,
        <><b>HL7 FHIR, CIE-10/CIE-11, SNOMED CT y LOINC</b>: estándares de interoperabilidad y codificación clínica. Hoy no los aplicamos; la clínica opera como consulta independiente y evaluará su adopción si necesita intercambiar información con otras instituciones.</>,
      ]} />
    </Seccion>

    <Seccion titulo="3. Reportar un problema de seguridad">
      <p>Si crees haber encontrado una falla o recibes un mensaje sospechoso que dice venir de la clínica, avísanos por <Contacto />. Nunca te pediremos contraseñas ni datos bancarios por mensaje.</p>
    </Seccion>
  </LegalLayout>
);

/* ───────────────────────── COOKIES ───────────────────────── */
export const Cookies: React.FC = () => (
  <LegalLayout
    titulo="Cookies"
    resumen="Qué son las cookies y qué hace —y qué no hace— este sitio con ellas."
  >
    <Seccion titulo="1. Qué son las cookies">
      <p>Las cookies y el almacenamiento local son pequeños archivos que un sitio guarda en tu navegador para recordar información entre visitas, por ejemplo para mantener una sesión iniciada o acelerar la carga de la página.</p>
    </Seccion>

    <Seccion titulo="2. Lo que hacemos y lo que no">
      <Aviso><b>No usamos cookies de publicidad, analítica ni seguimiento</b>, y no elaboramos perfiles de quienes visitan el sitio.</Aviso>
      <p>Solo empleamos almacenamiento técnico estrictamente necesario para que el sitio y el portal de la clínica funcionen de forma segura:</p>
      <Lista items={[
        <><b>Seguridad del portal:</b> mantener la sesión del personal autorizado y cerrarla automáticamente tras un periodo de inactividad.</>,
        <><b>Rendimiento:</b> una caché de los archivos del sitio para que cargue más rápido, incluso con conexión inestable. No contiene datos personales.</>,
      ]} />
      <p>Por ser de uso estrictamente técnico, no mostramos un banner de consentimiento.</p>
    </Seccion>

    <Seccion titulo="3. Cómo controlarlo">
      <p>Puedes borrar el almacenamiento local y la caché en cualquier momento desde la configuración de tu navegador; al hacerlo, el personal de la clínica deberá iniciar sesión de nuevo. Si en el futuro incorporáramos analítica u otras cookies no esenciales, actualizaremos esta página y te pediremos tu consentimiento antes de activarlas.</p>
    </Seccion>
  </LegalLayout>
);
