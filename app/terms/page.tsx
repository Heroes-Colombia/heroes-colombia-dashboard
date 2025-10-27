import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">

      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <FileText className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Términos y Condiciones</h1>
              <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString("es-CO")}</p>
            </div>

            <div className="prose prose-lg max-w-none">
              <h2>1. Aceptación de los Términos</h2>
              <p>
                Al acceder y usar Héroes Colombia, aceptas estar sujeto a estos Términos y Condiciones. Si no estás de
                acuerdo, por favor no uses nuestros servicios.
              </p>

              <h2>2. Elegibilidad</h2>
              <p>Para usar Héroes Colombia debes:</p>
              <ul>
                <li>Tener una empresa legalmente constituida</li>
                <li>Ser mayor de 18 años</li>
                <li>Proporcionar información de verificación verdadera y precisa</li>
                <li>Mantener la confidencialidad de tu cuenta</li>
              </ul>

              <h2>3. Uso de la Plataforma</h2>
              <p>Te comprometes a:</p>
              <ul>
                <li>Usar la plataforma solo para fines personales y legales</li>
                <li>No compartir tu cuenta con personas no elegibles</li>
                <li>No intentar acceder a áreas restringidas del sistema</li>
                <li>No usar la plataforma para actividades fraudulentas</li>
                <li>No revender o transferir beneficios a terceros</li>
              </ul>

              <h2>4. Oferta de Prueba para Negocios (Pre-Lanzamiento)</h2>
              <p>
                Durante el período de pre-lanzamiento, los negocios pueden acceder a una oferta especial de prueba:
              </p>
              <ul>
                <li>
                  <strong>Precio:</strong> 20,000 COP (pago único que incluye IVA)
                </li>
                <li>
                  <strong>Acceso:</strong> Plan Enterprise completo hasta el 1 de febrero de 2026
                </li>
                <li>
                  <strong>Características incluidas:</strong> Ubicaciones ilimitadas, promociones ilimitadas, analiticas, sección destacada premium, soporte prioritario
                </li>
                <li>
                  <strong>Sin renovación automática:</strong> Al finalizar el período de prueba, NO se realizarán cargos automáticos
                </li>
                <li>
                  <strong>Selección de plan:</strong> Antes del 1 de febrero de 2026, los negocios deben seleccionar un plan regular (Básico, Pro o Enterprise) para continuar con el servicio
                </li>
                <li>
                  <strong>Incentivo temprano:</strong> Negocios que seleccionen su plan antes del 15 de enero de 2025 recibirán un descuento en su primer mes
                </li>
                <li>
                  <strong>Período de gracia:</strong> Después del 1 de febrero de 2026, los negocios tendrán 7 días de acceso de solo lectura para seleccionar un plan
                </li>
                <li>
                  <strong>Downgrade automático:</strong> Si no se selecciona un plan dentro del período de gracia, la cuenta será transferida automáticamente al Plan Gratuito
                </li>
              </ul>

              <h2>5. Planes de Suscripción para Negocios</h2>
              <p>Después del período de prueba, los negocios pueden elegir entre:</p>
              <ul>
                <li>
                  <strong>Plan Gratuito:</strong> 1 ubicación, 1 promoción activa, pago por promoción adicional (11,900 COP + IVA)
                </li>
                <li>
                  <strong>Plan Básico:</strong> 70,000 COP/mes (IVA incluido) - Hasta 3 ubicaciones, 3 promociones activas
                </li>
                <li>
                  <strong>Plan Pro:</strong> 270,000 COP/mes (IVA incluido) - Hasta 10 ubicaciones, 10 promociones activas, analiticas avanzados
                </li>
                <li>
                  <strong>Plan Enterprise:</strong> Desde 800,000 COP/mes (IVA incluido) - Ubicaciones ilimitadas, todas las funciones premium, precio personalizado
                </li>
                <li>
                  <strong>Planes anuales:</strong> Disponibles con 15% de descuento sobre el precio mensual
                </li>
                <li>
                  <strong>Facturación:</strong> Los planes regulares se facturan mensual o anualmente según la selección
                </li>
                <li>
                  <strong>Cancelación:</strong> Los negocios pueden cancelar su suscripción en cualquier momento, con acceso hasta el final del período pagado
                </li>
              </ul>

              <h2>6. Pagos y Reembolsos</h2>
              <ul>
                <li>Todos los pagos se procesan a través de MercadoPago</li>
                <li>Los precios incluyen IVA del 19% según la legislación colombiana</li>
                <li>
                  <strong>Reembolsos de prueba:</strong> El pago de la prueba (20,000 COP) NO es reembolsable una vez procesado
                </li>
                <li>
                  <strong>Reembolsos de suscripción:</strong> Los pagos de suscripciones regulares no son reembolsables, pero el servicio continuará hasta el final del período pagado
                </li>
                <li>Los precios pueden cambiar con 30 días de aviso previo para nuevas suscripciones</li>
                <li>Los negocios existentes mantendrán su precio actual durante el período de facturación vigente</li>
              </ul>

              <h2>7. Promociones y Descuentos para Usuarios</h2>
              <ul>
                <li>Las promociones son ofrecidas por negocios aliados, no por Héroes Colombia directamente</li>
                <li>Los descuentos están sujetos a disponibilidad y términos específicos de cada negocio</li>
                <li>Héroes Colombia no es responsable si un negocio no honra una promoción</li>
                <li>Las promociones pueden cambiar o terminar sin previo aviso</li>
                <li>Un descuento solo puede canjearse una vez por usuario, salvo que se indique lo contrario</li>
              </ul>

              <h2>8. Cuenta de Usuario</h2>
              <p>Eres responsable de:</p>
              <ul>
                <li>Mantener tu contraseña segura y confidencial</li>
                <li>Todas las actividades que ocurran bajo tu cuenta</li>
                <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
                <li>Mantener tu información de contacto actualizada</li>
              </ul>

              <h2>9. Propiedad Intelectual</h2>
              <p>
                Todos los contenidos, marcas, logos y materiales en Héroes Colombia son propiedad de la empresa o sus
                licenciantes. No puedes copiar, modificar o distribuir ningún contenido sin autorización escrita.
              </p>

              <h2>10. Limitación de Responsabilidad</h2>
              <p>Héroes Colombia no es responsable por:</p>
              <ul>
                <li>Daños indirectos, incidentales o consecuentes del uso de la plataforma</li>
                <li>Pérdida de datos, ganancias o ahorros esperados</li>
                <li>Interrupciones del servicio o errores técnicos</li>
                <li>Acciones u omisiones de negocios aliados</li>
                <li>Contenido generado por usuarios</li>
              </ul>

              <h2>11. Modificaciones del Servicio</h2>
              <p>
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte del servicio en
                cualquier momento, con o sin previo aviso.
              </p>

              <h2>12. Terminación</h2>
              <p>Podemos terminar o suspender tu cuenta si:</p>
              <ul>
                <li>Violas estos términos</li>
                <li>Proporcionas información falsa</li>
                <li>Usas la plataforma de manera fraudulenta</li>
                <li>Ya no eres elegible para los beneficios</li>
              </ul>

              <h2>13. Ley Aplicable</h2>
              <p>
                Estos términos se rigen por las leyes de Colombia. Cualquier disputa será resuelta en los tribunales de
                Bogotá, Colombia.
              </p>

              <h2>14. Cambios a los Términos</h2>
              <p>
                Podemos actualizar estos términos ocasionalmente. Te notificaremos de cambios importantes. El uso
                continuado del servicio después de cambios constituye aceptación de los nuevos términos.
              </p>

              <h2>15. Contacto</h2>
              <p>
                Para preguntas sobre estos términos, contáctanos en:
                <br />
                <strong>Email:</strong> gerencia@heroescolombia.com
                <br />
                <strong>Teléfono:</strong> +57 3115157814
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
