import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white dark:bg-slate-950">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          {/* Header */}
          <header className="mb-12">
            <p className="text-sm font-semibold text-gold-600 dark:text-gold-400 uppercase tracking-wider mb-3">
              Legal
            </p>
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
              Aviso de Privacidad
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Última actualización: 1 de mayo de 2025
            </p>
            <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              El presente Aviso de Privacidad (en adelante, el{" "}
              <strong>"Aviso"</strong>) es emitido en cumplimiento de lo
              dispuesto por la Ley Federal de Protección de Datos Personales en
              Posesión de los Particulares (en adelante,{" "}
              <strong>"LFPDPPP"</strong>), su Reglamento y los Lineamientos del
              Aviso de Privacidad emitidos por el Instituto Nacional de
              Transparencia, Acceso a la Información y Protección de Datos
              Personales (<strong>"INAI"</strong>). Le rogamos leer
              detenidamente el presente Aviso antes de proporcionar sus datos
              personales a través de la Plataforma.
            </p>
          </header>

          <div className="space-y-10 text-slate-600 dark:text-slate-300 leading-relaxed">
            {/* 1. Responsable */}
            <Section title="1. Responsable del Tratamiento de sus Datos Personales">
              <p>
                <strong>EstateElevate S.A.S. de C.V.</strong> (en adelante, el{" "}
                <strong>"Responsable"</strong> o <strong>"EstateElevate"</strong>
                ), con domicilio en Av. Paseo de la Reforma 250, Piso 12,
                Colonia Juárez, Alcaldía Cuauhtémoc, C.P. 06600, Ciudad de
                México, México, es el Responsable del tratamiento de sus datos
                personales recabados a través del sitio web{" "}
                <span className="font-medium">www.estateelevate.mx</span> y sus
                subdominios, así como de cualquier aplicación móvil o canal
                digital relacionado (en conjunto, la{" "}
                <strong>"Plataforma"</strong>).
              </p>
              <p>
                Para cualquier consulta, aclaración o ejercicio de derechos
                relacionados con sus datos personales, puede contactar a nuestro
                Departamento de Datos Personales a través de los siguientes
                medios:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Correo electrónico:{" "}
                  <span className="font-medium">
                    privacidad@estateelevate.mx
                  </span>
                </li>
                <li>
                  Teléfono: <span className="font-medium">+52 55 1234 5678</span>{" "}
                  (lunes a viernes, 9:00 a 18:00 h, hora del Centro de México)
                </li>
                <li>
                  Domicilio: Av. Paseo de la Reforma 250, Piso 12, Col. Juárez,
                  CDMX, C.P. 06600
                </li>
              </ul>
              <p>
                Hemos designado a un Oficial de Privacidad, cuya función
                principal es velar por el cumplimiento de las obligaciones en
                materia de protección de datos personales y actuar como punto de
                contacto entre los titulares y el Responsable.
              </p>
            </Section>

            {/* 2. Datos recabados */}
            <Section title="2. Datos Personales que Recabamos">
              <p>
                Dependiendo del tipo de relación que usted establezca con
                EstateElevate —ya sea como usuario visitante, comprador
                interesado o agente inmobiliario registrado—, recabamos las
                siguientes categorías de datos personales:
              </p>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                a) Datos de identificación y contacto
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono móvil y/o fijo</li>
                <li>Nombre de usuario y contraseña (datos de acceso)</li>
                <li>
                  Fotografía de perfil (opcional, proporcionada por el usuario)
                </li>
              </ul>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                b) Datos profesionales (exclusivos para agentes inmobiliarios)
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombre o razón social del agente o inmobiliaria</li>
                <li>Cédula o registro profesional inmobiliario (si aplica)</li>
                <li>RFC (para efectos de facturación electrónica)</li>
                <li>
                  Domicilio fiscal o comercial del agente o agencia inmobiliaria
                </li>
                <li>
                  Información sobre propiedades listadas: dirección, precio,
                  características físicas, fotografías y contenido multimedia
                </li>
              </ul>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                c) Datos de pago
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Últimos cuatro dígitos y marca de la tarjeta de crédito o
                  débito (los datos completos de la tarjeta son procesados
                  directamente por Conekta y nunca son almacenados en nuestros
                  servidores)
                </li>
                <li>CLABE interbancaria (cuando aplique pago por SPEI)</li>
                <li>Referencia de pago OXXO Pay (cuando aplique)</li>
                <li>Historial de transacciones y suscripciones en la Plataforma</li>
              </ul>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                d) Datos de navegación y uso
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Dirección IP</li>
                <li>Tipo y versión de navegador</li>
                <li>Sistema operativo y tipo de dispositivo</li>
                <li>Páginas visitadas, tiempo de permanencia y acciones realizadas</li>
                <li>Cookies y tecnologías de rastreo similares (ver Sección 9)</li>
                <li>
                  Geolocalización aproximada derivada de la dirección IP (no se
                  recaba ubicación GPS precisa sin consentimiento explícito)
                </li>
              </ul>
              <p>
                EstateElevate <strong>no recaba ni trata datos personales sensibles</strong> en
                los términos del artículo 3, fracción VI de la LFPDPPP (tales
                como datos de salud, origen racial o étnico, creencias
                religiosas, afiliación sindical u opiniones políticas), salvo
                que usted los proporcione de forma voluntaria en las
                comunicaciones libres que realice a través de la Plataforma, en
                cuyo caso se le solicitará consentimiento expreso.
              </p>
            </Section>

            {/* 3. Finalidades */}
            <Section title="3. Finalidades del Tratamiento">
              <p>
                Sus datos personales son utilizados para las siguientes
                finalidades:
              </p>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                Finalidades primarias (necesarias para la relación jurídica)
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Crear y administrar su cuenta de usuario o agente en la
                  Plataforma.
                </li>
                <li>
                  Procesar, confirmar y dar seguimiento a los pagos de
                  suscripciones y servicios adquiridos.
                </li>
                <li>
                  Publicar, actualizar y eliminar los listados de propiedades
                  creados por agentes registrados.
                </li>
                <li>
                  Poner en contacto a compradores o arrendatarios interesados
                  con el agente o propietario correspondiente.
                </li>
                <li>
                  Enviar notificaciones transaccionales: confirmación de cuenta,
                  restablecimiento de contraseña, recibos de pago y alertas de
                  seguridad.
                </li>
                <li>
                  Emitir comprobantes fiscales digitales (CFDI) cuando sean
                  solicitados por agentes o personas morales suscriptoras.
                </li>
                <li>
                  Gestionar solicitudes de soporte técnico y atención al cliente.
                </li>
                <li>
                  Cumplir con obligaciones legales y reglamentarias aplicables a
                  EstateElevate.
                </li>
              </ul>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2 mt-4">
                Finalidades secundarias (puede oponerse en cualquier momento)
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Enviarle comunicaciones de marketing, boletines informativos y
                  promociones sobre nuevas propiedades, actualizaciones de planes
                  y eventos del sector inmobiliario.
                </li>
                <li>
                  Realizar encuestas de satisfacción y estudios de mercado para
                  mejorar nuestros servicios.
                </li>
                <li>
                  Personalizar su experiencia en la Plataforma mediante la
                  recomendación de propiedades basada en su historial de
                  búsqueda y preferencias.
                </li>
                <li>
                  Compartir, de forma agregada y anonimizada, información
                  estadística sobre tendencias del mercado inmobiliario con
                  socios comerciales o publicarla con fines informativos.
                </li>
              </ul>
              <p>
                Si usted no desea que sus datos personales sean tratados para
                las finalidades secundarias descritas anteriormente, puede
                manifestar su oposición enviando un correo electrónico a{" "}
                <span className="font-medium">privacidad@estateelevate.mx</span>{" "}
                con el asunto <em>"Oposición a finalidades secundarias"</em>{" "}
                dentro de los primeros cinco (5) días hábiles siguientes a la
                recepción de este Aviso, o en cualquier momento posterior.
              </p>
            </Section>

            {/* 4. Transferencias */}
            <Section title="4. Transferencias de Datos Personales">
              <p>
                EstateElevate podrá transferir sus datos personales a terceros en los
                siguientes supuestos, sin que sea necesario su consentimiento
                cuando la transferencia se encuentre en alguno de los supuestos
                previstos en el artículo 37 de la LFPDPPP:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse mt-2">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Destinatario
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Finalidad
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Consentimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        "Conekta S.A.P.I. de C.V.",
                        "Procesamiento seguro de pagos con tarjeta, OXXO Pay y SPEI",
                        "No requerido (encargado)",
                      ],
                      [
                        "Supabase Inc.",
                        "Almacenamiento de base de datos en infraestructura cloud",
                        "No requerido (encargado)",
                      ],
                      [
                        "Cloudinary Inc.",
                        "Almacenamiento y optimización de imágenes de propiedades",
                        "No requerido (encargado)",
                      ],
                      [
                        "Vercel Inc.",
                        "Hospedaje y despliegue de la Plataforma web",
                        "No requerido (encargado)",
                      ],
                      [
                        "Google LLC (Analytics)",
                        "Análisis de tráfico y comportamiento de usuarios",
                        "Requerido (ver Sección 9)",
                      ],
                      [
                        "Meta Platforms Ireland",
                        "Publicidad personalizada en redes sociales (opcional)",
                        "Requerido",
                      ],
                      [
                        "Autoridades competentes",
                        "Cumplimiento de requerimientos legales, judiciales o regulatorios",
                        "No requerido (obligación legal)",
                      ],
                    ].map(([dest, fin, cons]) => (
                      <tr key={dest} className="odd:bg-white dark:odd:bg-slate-950 even:bg-slate-50 dark:even:bg-slate-900">
                        <td className="px-3 py-2 border border-slate-200 dark:border-slate-700 font-medium">
                          {dest}
                        </td>
                        <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                          {fin}
                        </td>
                        <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                          {cons}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Los encargados del tratamiento (aquellos que procesan datos por
                cuenta de EstateElevate) están obligados contractualmente a
                mantener la confidencialidad de los datos y a utilizarlos
                exclusivamente para los fines indicados en sus respectivos
                contratos de prestación de servicios, los cuales incluyen
                cláusulas de protección de datos conformes con la LFPDPPP y, en
                su caso, con el Reglamento General de Protección de Datos
                (RGPD) de la Unión Europea.
              </p>
              <p>
                EstateElevate no vende, cede ni comercializa sus datos personales a
                terceros con fines publicitarios propios de dichos terceros, sin
                su consentimiento previo, expreso e informado.
              </p>
            </Section>

            {/* 5. Derechos ARCO */}
            <Section title="5. Derechos ARCO: Acceso, Rectificación, Cancelación y Oposición">
              <p>
                De conformidad con lo establecido en los artículos 28 al 37 de
                la LFPDPPP, usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong>Acceso:</strong> Conocer qué datos personales suyos
                  obran en nuestros registros, de dónde provienen, para qué
                  finalidades los utilizamos, con quién los compartimos y cuáles
                  son las condiciones generales del tratamiento.
                </li>
                <li>
                  <strong>Rectificación:</strong> Solicitar la corrección de sus
                  datos personales cuando éstos sean inexactos, incompletos o
                  desactualizados, adjuntando los documentos que sustenten la
                  solicitud.
                </li>
                <li>
                  <strong>Cancelación:</strong> Solicitar la supresión de sus
                  datos personales de nuestros registros cuando considere que no
                  están siendo utilizados conforme a los principios, deberes y
                  obligaciones previstos en la LFPDPPP, o bien, cuando haya
                  concluido la relación jurídica o comercial que justificó su
                  tratamiento. La cancelación dará lugar a un período de
                  bloqueo, tras el cual se procederá a la supresión definitiva.
                </li>
                <li>
                  <strong>Oposición:</strong> Oponerse al tratamiento de sus
                  datos personales para determinadas finalidades, en particular
                  las finalidades secundarias descritas en la Sección 3, o
                  cuando exista una causa legítima y fundada relacionada con su
                  situación particular que le justifique dejar de ser objeto de
                  un tratamiento.
                </li>
              </ul>
              <p>
                Adicionalmente, y en la medida en que resulte aplicable, usted
                tiene derecho a la{" "}
                <strong>portabilidad de datos</strong>: recibir sus datos
                personales en un formato estructurado, de uso común y legtura
                mecánica, para transmitirlos a otro responsable del tratamiento
                cuando el tratamiento se base en su consentimiento y se efectúe
                por medios automatizados.
              </p>
              <p>
                Asimismo, tiene derecho a{" "}
                <strong>revocar en cualquier momento</strong> el consentimiento
                que haya otorgado para el tratamiento de sus datos personales,
                siempre que dicho tratamiento no tenga carácter obligatorio en
                virtud de una disposición legal. La revocación del
                consentimiento no tendrá efectos retroactivos.
              </p>
            </Section>

            {/* 6. Medios ARCO */}
            <Section title="6. Cómo Ejercer sus Derechos ARCO">
              <p>
                Para ejercer cualquiera de los derechos mencionados en la
                Sección 5, o para revocar su consentimiento, deberá presentar
                una solicitud escrita —denominada{" "}
                <strong>Solicitud ARCO</strong>— siguiendo el procedimiento
                descrito a continuación:
              </p>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                Canales de presentación
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Correo electrónico:</strong>{" "}
                  <span className="font-medium">privacidad@estateelevate.mx</span>{" "}
                  (con asunto: "Solicitud ARCO – [Tipo de Derecho]")
                </li>
                <li>
                  <strong>Escrito físico:</strong> Entregado en nuestras
                  oficinas ubicadas en Av. Paseo de la Reforma 250, Piso 12,
                  Col. Juárez, CDMX, en días hábiles de 9:00 a 17:00 h.
                </li>
              </ul>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                Requisitos de la solicitud
              </h3>
              <p>Su Solicitud ARCO deberá contener, como mínimo:</p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>
                  Nombre completo del titular y domicilio u otro medio para
                  comunicarle la respuesta.
                </li>
                <li>
                  Documentos que acrediten su identidad (copia de INE/IFE,
                  pasaporte vigente u otro documento oficial) y, en su caso, los
                  documentos que acrediten la representación legal del titular.
                </li>
                <li>
                  Descripción clara y precisa de los datos personales respecto
                  de los que se busca ejercer el derecho.
                </li>
                <li>
                  Cualquier otro elemento o documento que facilite la
                  localización de los datos personales.
                </li>
                <li>
                  En el caso de Rectificación, indicar los cambios solicitados y
                  proporcionar documentación de soporte.
                </li>
              </ol>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                Plazos de respuesta
              </h3>
              <p>
                EstateElevate responderá su solicitud dentro de un plazo máximo de{" "}
                <strong>veinte (20) días hábiles</strong> contados a partir de
                la fecha de recepción. De ser procedente, los cambios se harán
                efectivos dentro de los <strong>quince (15) días hábiles</strong>{" "}
                siguientes a que se comunique la respuesta. Estos plazos podrán
                ser ampliados en términos de la LFPDPPP cuando así lo requieran
                las circunstancias del caso.
              </p>
              <p>
                Si considera que su solicitud no fue atendida satisfactoriamente
                o que EstateElevate ha incurrido en una violación a la LFPDPPP,
                puede acudir ante el{" "}
                <strong>
                  Instituto Nacional de Transparencia, Acceso a la Información y
                  Protección de Datos Personales (INAI)
                </strong>{" "}
                para promover el procedimiento de protección de derechos
                correspondiente. Para mayor información, visite{" "}
                <span className="font-medium">www.inai.org.mx</span>.
              </p>
            </Section>

            {/* 7. Medidas de seguridad */}
            <Section title="7. Medidas de Seguridad">
              <p>
                EstateElevate ha implementado las medidas de seguridad técnicas,
                administrativas y físicas necesarias para proteger sus datos
                personales contra daño, pérdida, alteración, destrucción,
                acceso no autorizado o tratamiento no permitido, conforme a lo
                dispuesto por el artículo 19 de la LFPDPPP. Entre dichas
                medidas destacan:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Cifrado en tránsito mediante TLS 1.2 o superior para todas las
                  comunicaciones entre su navegador y nuestros servidores.
                </li>
                <li>
                  Cifrado en reposo de datos sensibles almacenados en base de
                  datos mediante algoritmos AES-256.
                </li>
                <li>
                  Hashing de contraseñas con algoritmos bcrypt (sin
                  almacenamiento de contraseñas en texto claro).
                </li>
                <li>
                  Control de acceso basado en roles (RBAC) y principio de
                  mínimo privilegio para el personal interno.
                </li>
                <li>
                  Auditorías periódicas de seguridad y revisión de accesos.
                </li>
                <li>
                  Gestión segura de secretos y claves API mediante variables de
                  entorno protegidas en la infraestructura de despliegue.
                </li>
                <li>
                  Monitoreo continuo de incidentes de seguridad y plan de
                  respuesta ante vulneraciones de datos.
                </li>
              </ul>
              <p>
                En caso de que ocurra una vulneración de seguridad que afecte de
                forma significativa sus derechos patrimoniales o morales,
                EstateElevate le informará de manera oportuna a través del correo
                electrónico registrado en su cuenta, a fin de que pueda tomar
                las medidas defensivas correspondientes.
              </p>
            </Section>

            {/* 8. Retención */}
            <Section title="8. Conservación de los Datos Personales">
              <p>
                Sus datos personales serán conservados durante el tiempo que sea
                necesario para cumplir con las finalidades para las cuales fueron
                recabados, así como para cumplir con las obligaciones legales,
                contables y fiscales aplicables. Los criterios generales para
                determinar los períodos de retención son:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Datos de cuenta activa:</strong> Mientras mantenga una
                  cuenta activa en la Plataforma, más un período de 90 días
                  posteriores a la solicitud de eliminación de cuenta (para
                  permitir la recuperación ante errores involuntarios).
                </li>
                <li>
                  <strong>Datos de transacciones y facturación:</strong> Cinco
                  (5) años contados a partir de la fecha de la transacción, en
                  cumplimiento del Código Fiscal de la Federación.
                </li>
                <li>
                  <strong>Datos de prospectos (leads):</strong> Dos (2) años a
                  partir de la última interacción, salvo que el agente
                  responsable solicite su eliminación anticipada.
                </li>
                <li>
                  <strong>Registros de navegación y logs:</strong> Noventa (90)
                  días, salvo que sean necesarios para la investigación de
                  incidentes de seguridad.
                </li>
              </ul>
              <p>
                Al concluir los períodos de retención, los datos personales
                serán eliminados de forma segura mediante procesos de borrado
                irreversible o anonimización, de manera que no sea posible
                vincularlos nuevamente con su persona.
              </p>
            </Section>

            {/* 9. Cookies */}
            <Section title="9. Uso de Cookies y Tecnologías de Rastreo">
              <p>
                La Plataforma utiliza cookies y tecnologías de rastreo similares
                (balizas web, píxeles, almacenamiento local) para ofrecerle una
                experiencia personalizada y mejorar la funcionalidad del sitio.
                A continuación le informamos sobre los tipos de cookies que
                utilizamos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Cookies estrictamente necesarias:</strong> Esenciales
                  para el funcionamiento de la Plataforma (gestión de sesión,
                  seguridad CSRF, preferencias de idioma y tema). No pueden
                  desactivarse.
                </li>
                <li>
                  <strong>Cookies analíticas:</strong> Utilizadas para medir el
                  tráfico, las páginas más visitadas y el comportamiento de
                  navegación mediante Google Analytics 4 y herramientas propias.
                  Requieren su consentimiento.
                </li>
                <li>
                  <strong>Cookies de funcionalidad:</strong> Permiten recordar
                  sus preferencias de búsqueda, filtros guardados y ajustes de
                  visualización. Requieren su consentimiento.
                </li>
                <li>
                  <strong>Cookies publicitarias:</strong> Permiten mostrarle
                  anuncios relevantes en terceras plataformas (Meta, Google Ads)
                  basados en su historial de navegación. Requieren su
                  consentimiento expreso.
                </li>
              </ul>
              <p>
                Puede gestionar sus preferencias de cookies en cualquier momento
                a través del{" "}
                <strong>Panel de Preferencias de Privacidad</strong> disponible
                en el pie de página de la Plataforma, o configurando su
                navegador para rechazar o eliminar cookies. Tenga en cuenta que
                la desactivación de ciertos tipos de cookies puede afectar la
                funcionalidad de la Plataforma.
              </p>
            </Section>

            {/* 10. Menores */}
            <Section title="10. Menores de Edad">
              <p>
                La Plataforma está dirigida exclusivamente a personas mayores de
                18 años. EstateElevate no recaba de forma intencional datos
                personales de menores de edad. Si usted es padre, madre o tutor
                legal y tiene conocimiento de que un menor de edad nos ha
                proporcionado datos personales, le rogamos que nos contacte de
                inmediato a través de{" "}
                <span className="font-medium">privacidad@estateelevate.mx</span>{" "}
                para proceder a la eliminación de dicha información de nuestros
                registros.
              </p>
            </Section>

            {/* 11. Cambios */}
            <Section title="11. Cambios al Aviso de Privacidad">
              <p>
                EstateElevate se reserva el derecho de actualizar o modificar el
                presente Aviso en cualquier momento, a fin de reflejar cambios
                en nuestras prácticas de privacidad, en la legislación aplicable
                o en los servicios ofrecidos. Cualquier modificación será
                notificada a través de uno o más de los siguientes mecanismos:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Publicación de la versión actualizada del Aviso en la
                  Plataforma, con indicación de la fecha de la última
                  actualización en el encabezado del documento.
                </li>
                <li>
                  Envío de un correo electrónico de notificación a la dirección
                  registrada en su cuenta, cuando los cambios sean sustanciales
                  y afecten sus derechos o el alcance del tratamiento de sus
                  datos personales.
                </li>
                <li>
                  Aviso mediante un banner o mensaje visible en la Plataforma
                  durante un período razonable tras la publicación de la nueva
                  versión.
                </li>
              </ul>
              <p>
                Le recomendamos revisar periódicamente el presente Aviso para
                mantenerse informado sobre cómo protegemos su información. El
                uso continuado de la Plataforma tras la publicación de los
                cambios implicará su aceptación de las modificaciones realizadas,
                siempre que éstas no requieran un nuevo consentimiento expreso
                en términos de la LFPDPPP.
              </p>
              <p>
                Si los cambios implican nuevas finalidades de tratamiento o
                nuevas transferencias de datos que requieran su consentimiento, se
                lo solicitaremos de forma expresa antes de proceder al
                tratamiento bajo las nuevas condiciones.
              </p>
            </Section>

            {/* 12. Ley aplicable */}
            <Section title="12. Ley Aplicable y Jurisdicción">
              <p>
                El presente Aviso de Privacidad se rige por la{" "}
                <strong>
                  Ley Federal de Protección de Datos Personales en Posesión de
                  los Particulares
                </strong>
                , publicada en el Diario Oficial de la Federación el 5 de julio
                de 2010, así como por su Reglamento publicado el 21 de
                diciembre de 2011 y los Lineamientos del Aviso de Privacidad
                publicados el 17 de enero de 2013, todos ellos de los Estados
                Unidos Mexicanos.
              </p>
              <p>
                Para cualquier controversia derivada de la interpretación o
                aplicación del presente Aviso, las partes se someten a la
                jurisdicción y competencia del{" "}
                <strong>INAI</strong> para los procedimientos administrativos de
                protección de derechos, y a los tribunales competentes de la{" "}
                <strong>Ciudad de México</strong> para cualquier otra
                controversia de naturaleza civil o mercantil, renunciando
                expresamente a cualquier otro fuero que pudiera corresponderles
                por razón de sus domicilios presentes o futuros.
              </p>
            </Section>

            {/* Footer note */}
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Si tiene preguntas, comentarios o inquietudes sobre el
                tratamiento de sus datos personales, no dude en contactar a
                nuestro Departamento de Datos Personales en{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  privacidad@estateelevate.mx
                </span>
                . Estaremos encantados de atenderle.
              </p>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
