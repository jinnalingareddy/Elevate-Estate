import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description:
    "Lee los términos y condiciones que rigen el uso de la plataforma EstateElevate.",
};

export default function TerminosPage() {
  const lastUpdated = "7 de mayo de 2026";

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 bg-white dark:bg-slate-950">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-12 pb-8 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-gold-600 dark:text-gold-400 uppercase tracking-wider mb-3">
              Documento legal
            </p>
            <h1 className="text-4xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
              Términos de Servicio
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Última actualización: {lastUpdated}
            </p>
          </header>

          <div className="space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed">
            {/* Intro */}
            <p>
              Bienvenido a EstateElevate. Al acceder o utilizar nuestra
              plataforma, usted acepta quedar vinculado por los presentes
              Términos de Servicio (&quot;Términos&quot;). Le recomendamos leer
              este documento detenidamente antes de utilizar cualquier función
              de la plataforma. Si no está de acuerdo con alguna de las
              condiciones aquí establecidas, deberá abstenerse de usar el
              servicio.
            </p>
            <p>
              EstateElevate es operado por{" "}
              <strong>EstateElevate S.A.S. de C.V.</strong>, una sociedad
              constituida conforme a las leyes de los Estados Unidos Mexicanos,
              con domicilio en Ciudad de México, México (&quot;EstateElevate&quot;,
              &quot;nosotros&quot; o &quot;la empresa&quot;).
            </p>

            {/* 1 */}
            <Section title="1. Objeto del Servicio">
              <p>
                EstateElevate es una plataforma digital de marketplace
                inmobiliario que conecta a agentes inmobiliarios y propietarios
                (&quot;Agentes&quot;) con compradores, arrendatarios e
                interesados en propiedades de carácter residencial y comercial
                ubicadas en México y Latinoamérica (&quot;Usuarios&quot;).
              </p>
              <p>
                Nuestros servicios incluyen, de manera enunciativa más no
                limitativa: (a) la publicación y difusión de propiedades
                inmobiliarias; (b) la gestión de contactos y prospectos entre
                Agentes y Usuarios interesados; (c) herramientas de análisis y
                estadísticas de desempeño de propiedades; (d) funciones de tour
                virtual y galería fotográfica; y (e) planes de suscripción y
                publicación de propiedades adicionales.
              </p>
              <p>
                EstateElevate actúa exclusivamente como intermediario
                tecnológico y no es parte en ninguna transacción inmobiliaria.
                No somos agentes, corredores ni asesores inmobiliarios. Las
                negociaciones, contratos de compraventa, arrendamiento u otros
                acuerdos entre Agentes y Usuarios se realizan directamente
                entre las partes y quedan fuera del ámbito de nuestra
                responsabilidad.
              </p>
            </Section>

            {/* 2 */}
            <Section title="2. Registro de Agentes">
              <p>
                Para publicar propiedades en EstateElevate es necesario
                registrarse como Agente. Al hacerlo, usted declara y garantiza
                que: (a) es una persona física mayor de 18 años o una persona
                moral legalmente constituida; (b) cuenta con las facultades,
                autorizaciones y, en su caso, cédula profesional o licencia
                requerida por la legislación aplicable para ejercer como agente
                inmobiliario; (c) la información proporcionada durante el
                registro es veraz, completa y actualizada; y (d) actuará en
                cumplimiento de todas las leyes y reglamentos aplicables.
              </p>
              <p>
                Es su responsabilidad mantener la confidencialidad de sus
                credenciales de acceso. Usted es el único responsable de toda
                actividad que ocurra bajo su cuenta. Deberá notificarnos de
                inmediato cualquier uso no autorizado de su cuenta a través de
                soporte@estateelevate.mx.
              </p>
              <p>
                EstateElevate se reserva el derecho de rechazar, suspender o
                cancelar el registro de cualquier Agente que, a juicio
                razonable de la empresa, represente un riesgo para la
                plataforma, otros usuarios o terceros, o que haya incurrido en
                cualquiera de las conductas prohibidas descritas en estos
                Términos.
              </p>
            </Section>

            {/* 3 */}
            <Section title="3. Uso Aceptable">
              <p>
                El uso de EstateElevate está sujeto a las siguientes
                condiciones de uso aceptable. Usted se obliga a:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  Publicar únicamente propiedades respecto de las cuales cuente
                  con autorización expresa del propietario o sea usted mismo el
                  propietario.
                </li>
                <li>
                  Proporcionar información veraz, precisa y actualizada sobre
                  las propiedades publicadas, incluyendo precio, superficie,
                  características y ubicación.
                </li>
                <li>
                  Utilizar imágenes fotográficas de su autoría o sobre las
                  cuales cuente con los derechos necesarios de uso.
                </li>
                <li>
                  No usar la plataforma para fines ilícitos, fraudulentos o que
                  contravengan las normas de protección al consumidor.
                </li>
                <li>
                  No publicar contenido engañoso, difamatorio, obsceno,
                  discriminatorio o que viole los derechos de terceros.
                </li>
                <li>
                  No intentar acceder de forma no autorizada a los sistemas,
                  datos o cuentas de otros usuarios.
                </li>
                <li>
                  No utilizar robots, scrapers u otras herramientas automatizadas
                  para extraer datos de la plataforma sin autorización previa y
                  escrita de EstateElevate.
                </li>
                <li>
                  No publicar precios artificialmente alterados con el propósito
                  de distorsionar el mercado.
                </li>
              </ul>
              <p>
                El incumplimiento de cualquiera de estas obligaciones podrá
                resultar en la suspensión inmediata de su cuenta, sin perjuicio
                de las acciones legales que la empresa pueda ejercer.
              </p>
            </Section>

            {/* 4 */}
            <Section title="4. Planes y Pagos">
              <p>
                EstateElevate ofrece los siguientes planes de servicio para
                Agentes:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <strong>Plan Gratuito:</strong> Permite publicar hasta 1
                  propiedad activa de manera indefinida, sin cargo alguno.
                </li>
                <li>
                  <strong>Plan Pro:</strong> Publicación de hasta 10 propiedades
                  activas simultáneas, 2 propiedades destacadas y acceso a
                  estadísticas básicas. Precio mensual sujeto a la tarifa
                  vigente publicada en la plataforma.
                </li>
                <li>
                  <strong>Plan Elite:</strong> Publicación de hasta 50
                  propiedades activas, 10 propiedades destacadas, estadísticas
                  avanzadas, soporte prioritario e insignia de Agente Elite.
                  Precio mensual sujeto a la tarifa vigente.
                </li>
                <li>
                  <strong>Publicación por unidad:</strong> Para Agentes en el
                  Plan Gratuito que deseen publicar propiedades adicionales sin
                  suscribirse, se ofrece la opción de pago por publicación
                  individual a la tarifa vigente.
                </li>
              </ul>
              <p>
                Los pagos se procesan de forma segura a través de{" "}
                <strong>Conekta</strong>, plataforma certificada PCI-DSS
                para procesamiento de pagos en México. Aceptamos:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  Tarjetas de crédito y débito (Visa, Mastercard, American
                  Express).
                </li>
                <li>
                  Pago en efectivo mediante <strong>OXXO Pay</strong> (el pago
                  debe realizarse dentro de las 48 horas siguientes a la
                  generación de la referencia).
                </li>
                <li>
                  Transferencia bancaria electrónica mediante{" "}
                  <strong>SPEI</strong> desde cualquier institución bancaria
                  mexicana (acreditación en 1 a 2 días hábiles).
                </li>
              </ul>
              <p>
                Para las suscripciones mensuales Pro y Elite, el cargo se
                realiza de manera automática a la tarjeta de pago registrada en
                la fecha de renovación correspondiente. En caso de que el cargo
                no pueda procesarse, su plan será degradado al Plan Gratuito
                hasta que el pago sea completado.
              </p>
              <p>
                Todos los precios se expresan en Pesos Mexicanos (MXN) e
                incluyen el Impuesto al Valor Agregado (IVA) cuando
                corresponda. EstateElevate emitirá Comprobante Fiscal Digital
                por Internet (CFDI) a los Agentes que así lo soliciten y
                proporcionen sus datos fiscales completos.
              </p>
            </Section>

            {/* 5 */}
            <Section title="5. Cancelaciones y Reembolsos">
              <p>
                Usted puede cancelar su suscripción en cualquier momento desde
                la sección &quot;Gestionar Plan&quot; dentro de su portal de
                Agente. La cancelación surtirá efecto al término del período de
                facturación vigente; no se realizarán cargos adicionales una
                vez procesada la cancelación, y su cuenta continuará activa con
                las funciones del plan contratado hasta la fecha de
                vencimiento.
              </p>
              <p>
                <strong>Política de reembolsos:</strong> EstateElevate no
                otorga reembolsos por períodos de suscripción ya transcurridos
                o parcialmente transcurridos, excepto en los siguientes casos:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  Error de cobro duplicado: si se ha realizado un cargo doble
                  por error de la plataforma, el monto duplicado será
                  reembolsado íntegramente dentro de los 10 días hábiles
                  siguientes a la verificación del error.
                </li>
                <li>
                  Falla técnica grave: en caso de que un incidente técnico de
                  nuestra plataforma haya impedido el uso del servicio por un
                  período mayor a 72 horas consecutivas durante un mes de
                  suscripción, se podrá otorgar un crédito proporcional a los
                  días de inactividad.
                </li>
                <li>
                  Cancelación dentro del período de garantía: Para nuevas
                  suscripciones al Plan Pro o Elite, se otorga una garantía de
                  satisfacción de 7 días naturales desde la fecha de la primera
                  contratación. Si cancela dentro de este período, recibirá un
                  reembolso completo del primer mes.
                </li>
              </ul>
              <p>
                Para solicitar un reembolso, envíe su solicitud a
                soporte@estateelevate.mx indicando su número de Agente, fecha
                de cargo y motivo. Nos comprometemos a responder en un plazo no
                mayor a 5 días hábiles.
              </p>
            </Section>

            {/* 6 */}
            <Section title="6. Propiedad Intelectual">
              <p>
                Todos los derechos de propiedad intelectual sobre la
                plataforma EstateElevate, incluyendo su diseño, código fuente,
                logotipos, marcas comerciales, texto original, fotografías
                propias e interfaces de usuario, son propiedad exclusiva de
                EstateElevate S.A.S. de C.V. y están protegidos por la Ley
                Federal del Derecho de Autor y la Ley de la Propiedad
                Industrial de México.
              </p>
              <p>
                Al publicar contenido en la plataforma (fotografías, textos,
                videos, etc.), el Agente otorga a EstateElevate una licencia no
                exclusiva, mundial, libre de regalías y sublicenciable para
                usar, reproducir, modificar, adaptar, publicar y distribuir
                dicho contenido con el propósito de operar y promover el
                servicio. Esta licencia termina cuando el Agente elimina el
                contenido de la plataforma.
              </p>
              <p>
                El Agente declara ser el titular o contar con las autorizaciones
                necesarias para el contenido que sube a la plataforma, y
                acepta indemnizar a EstateElevate ante cualquier reclamación de
                terceros por infracción de derechos de autor, marcas u otros
                derechos de propiedad intelectual relacionados con el contenido
                publicado.
              </p>
            </Section>

            {/* 7 */}
            <Section title="7. Limitación de Responsabilidad">
              <p>
                EstateElevate proporciona sus servicios &quot;tal como están&quot; y
                &quot;según disponibilidad&quot;, sin garantías de ningún tipo, ya sean
                expresas o implícitas, incluyendo pero no limitándose a
                garantías de comerciabilidad, idoneidad para un propósito
                particular o no infracción.
              </p>
              <p>
                EstateElevate no será responsable por:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  La exactitud, integridad o legalidad de la información
                  publicada por los Agentes en sus listados.
                </li>
                <li>
                  Cualquier daño directo, indirecto, incidental, especial,
                  consecuente o punitivo derivado del uso o la imposibilidad de
                  uso de la plataforma.
                </li>
                <li>
                  El resultado de las negociaciones o transacciones
                  inmobiliarias entre Agentes y Usuarios.
                </li>
                <li>
                  Interrupciones del servicio causadas por eventos de fuerza
                  mayor, fallas en infraestructura de terceros o ataques
                  cibernéticos fuera de nuestro control razonable.
                </li>
                <li>
                  La conducta de Agentes o Usuarios que violen estos Términos
                  o las leyes aplicables.
                </li>
              </ul>
              <p>
                En ningún caso la responsabilidad total de EstateElevate frente
                a un Agente excederá el monto total pagado por dicho Agente a
                la plataforma durante los 3 meses inmediatos anteriores al
                evento que da lugar al reclamo.
              </p>
            </Section>

            {/* 8 */}
            <Section title="8. Modificaciones a los Términos">
              <p>
                EstateElevate se reserva el derecho de modificar estos Términos
                en cualquier momento. Cuando lo hagamos, notificaremos a los
                Agentes registrados mediante correo electrónico con al menos 15
                días naturales de anticipación a la fecha de entrada en vigor
                de los cambios significativos. Para cambios menores (corrección
                de errores tipográficos, ajustes de redacción sin impacto
                sustancial), la notificación se hará únicamente mediante la
                actualización de este documento con la fecha de revisión
                correspondiente.
              </p>
              <p>
                El uso continuado de la plataforma después de la fecha de
                entrada en vigor de los Términos modificados constituirá su
                aceptación de los mismos. Si no está de acuerdo con los cambios,
                deberá cancelar su suscripción y dejar de utilizar el servicio
                antes de la fecha de entrada en vigor.
              </p>
            </Section>

            {/* 9 */}
            <Section title="9. Ley Aplicable y Resolución de Controversias">
              <p>
                Los presentes Términos se rigen e interpretan de conformidad con
                las leyes de los Estados Unidos Mexicanos. Para la resolución de
                cualquier controversia que pudiera surgir con motivo de la
                interpretación o cumplimiento de estos Términos, las partes
                acuerdan someterse a la jurisdicción de los Tribunales
                competentes de la Ciudad de México, renunciando expresamente a
                cualquier otro fuero que pudiera corresponderles por razón de su
                domicilio presente o futuro.
              </p>
              <p>
                Las partes acuerdan que, antes de iniciar cualquier
                procedimiento legal, se realizará un intento de resolución
                amigable a través de negociación directa durante un período de
                30 días naturales a partir de la notificación escrita de la
                controversia. Si transcurrido dicho período no se llegara a un
                acuerdo, las partes podrán recurrir a las instancias legales
                correspondientes.
              </p>
              <p>
                Para cualquier consulta relacionada con estos Términos, puede
                contactarnos en:{" "}
                <a
                  href="mailto:legal@estateelevate.mx"
                  className="text-gold-600 dark:text-gold-400 hover:underline underline-offset-2"
                >
                  legal@estateelevate.mx
                </a>
              </p>
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

// ─── Section helper ───────────────────────────────────────────────────────────

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
