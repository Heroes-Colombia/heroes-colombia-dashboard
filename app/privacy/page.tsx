import { Shield } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">

      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Shield className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Política de Privacidad</h1>
              <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString("es-CO")}</p>
            </div>

            <div className="prose prose-lg max-w-none">
              <h2>1. Información que Recopilamos</h2>
              <p>
                En Héroes Colombia, recopilamos información necesaria para verificar tu identidad militar y brindarte
                los mejores beneficios:
              </p>
              <ul>
                <li>
                  <strong>Información de Identificación:</strong> Nombre completo, número de identificación militar,
                  rango, fuerza a la que perteneces
                </li>
                <li>
                  <strong>Información de Contacto:</strong> Correo electrónico, número de teléfono
                </li>
                <li>
                  <strong>Información de Ubicación:</strong> Para mostrarte negocios cercanos (solo con tu permiso)
                </li>
                <li>
                  <strong>Información de Uso:</strong> Promociones que guardas, negocios que visitas, descuentos que
                  canjeas
                </li>
              </ul>

              <h2>2. Cómo Usamos tu Información</h2>
              <p>Utilizamos tu información para:</p>
              <ul>
                <li>Verificar tu identidad militar y elegibilidad para beneficios</li>
                <li>Mostrarte promociones relevantes cerca de tu ubicación</li>
                <li>Procesar el canje de descuentos en negocios aliados</li>
                <li>Mejorar nuestros servicios y experiencia de usuario</li>
                <li>Enviarte notificaciones sobre nuevas promociones (puedes desactivarlas)</li>
                <li>Cumplir con requisitos legales y de seguridad</li>
              </ul>

              <h2>3. Protección de Datos Militares</h2>
              <p>
                Entendemos la sensibilidad de la información militar. Por eso implementamos medidas de seguridad de
                nivel bancario:
              </p>
              <ul>
                <li>Encriptación de extremo a extremo para todos los datos</li>
                <li>Verificación de dos factores obligatoria</li>
                <li>Servidores seguros con certificación ISO 27001</li>
                <li>Auditorías de seguridad trimestrales</li>
                <li>Acceso restringido solo a personal autorizado</li>
              </ul>

              <h2>4. Compartir Información</h2>
              <p>
                <strong>NUNCA</strong> vendemos tu información personal. Solo compartimos datos necesarios con:
              </p>
              <ul>
                <li>
                  <strong>Negocios Aliados:</strong> Solo cuando canjeas un descuento, compartimos tu nombre y rango
                  para validar el beneficio
                </li>
                <li>
                  <strong>Proveedores de Servicios:</strong> Empresas que nos ayudan a operar la plataforma (hosting,
                  análisis, soporte)
                </li>
                <li>
                  <strong>Autoridades:</strong> Solo si es requerido por ley o para proteger derechos y seguridad
                </li>
              </ul>

              <h2>5. Tus Derechos</h2>
              <p>Tienes derecho a:</p>
              <ul>
                <li>Acceder a toda tu información personal</li>
                <li>Corregir datos incorrectos</li>
                <li>Eliminar tu cuenta y todos tus datos</li>
                <li>Exportar tu información en formato legible</li>
                <li>Oponerte al procesamiento de ciertos datos</li>
                <li>Revocar consentimientos en cualquier momento</li>
              </ul>

              <h2>6. Cookies y Tecnologías Similares</h2>
              <p>
                Usamos cookies para mejorar tu experiencia. Puedes controlar las cookies en la configuración de tu
                navegador. Ver nuestra <a href="/cookies">Política de Cookies</a> para más detalles.
              </p>

              <h2>7. Retención de Datos</h2>
              <p>
                Mantenemos tu información mientras tu cuenta esté activa. Si eliminas tu cuenta, borramos todos tus
                datos personales en un plazo de 30 días, excepto información que debamos retener por ley.
              </p>

              <h2>8. Menores de Edad</h2>
              <p>
                Nuestros servicios están diseñados para militares activos mayores de 18 años. No recopilamos
                intencionalmente información de menores.
              </p>

              <h2>9. Cambios a esta Política</h2>
              <p>
                Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios importantes por correo
                electrónico o notificación en la app.
              </p>

              <h2>10. Contacto</h2>
              <p>
                Si tienes preguntas sobre esta política o quieres ejercer tus derechos, contáctanos en:
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
