"use client"

import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface InfoTooltipProps {
  title: string
  children: React.ReactNode
  align?: "start" | "center" | "end"
  width?: string
}

export function InfoTooltip({ title, children, align = "start", width = "w-80" }: InfoTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Más información sobre ${title}`}
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={width} align={align}>
        {children}
      </PopoverContent>
    </Popover>
  )
}

// Pre-defined tooltip content for analytics metrics
export const analyticsTooltips = {
  impressions: {
    title: "Impresiones",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué son las impresiones?</h4>
        <p className="text-sm text-muted-foreground">
          Número de veces que tu negocio <strong>apareció en la pantalla</strong> de un usuario (en listados, búsquedas, o recomendaciones).
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Impresiones altas:</strong> Tu negocio tiene buena visibilidad</li>
          <li>• <strong>Impresiones bajas:</strong> Considera mejorar tu perfil o crear más promociones</li>
        </ul>
      </div>
    ),
  },
  clicks: {
    title: "Clicks",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué son los clicks?</h4>
        <p className="text-sm text-muted-foreground">
          Número de veces que usuarios <strong>hicieron clic para ver tu perfil</strong> completo.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Tasa de click (clicks/impresiones):</strong> Mide qué tan atractivo es tu negocio</li>
          <li>• <strong>Bajo ratio:</strong> Mejora tu imagen de portada o descripción corta</li>
        </ul>
      </div>
    ),
  },
  businessSaves: {
    title: "Negocio Favorito",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué significa?</h4>
        <p className="text-sm text-muted-foreground">
          Número de usuarios que <strong>guardaron tu negocio como favorito</strong> para acceder fácilmente después.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Muchos favoritos:</strong> Usuarios interesados en volver</li>
          <li>• <strong>Pocos favoritos:</strong> Mejora tu propuesta de valor o promociones</li>
        </ul>
      </div>
    ),
  },
  promotionSaves: {
    title: "Promociones Favoritas",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué significa?</h4>
        <p className="text-sm text-muted-foreground">
          Número de veces que usuarios <strong>guardaron tus promociones</strong> para usarlas después.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Alta tasa de guardado:</strong> Promociones atractivas</li>
          <li>• <strong>Compara promociones:</strong> Identifica cuáles generan más interés</li>
        </ul>
      </div>
    ),
  },
  navigation: {
    title: "Navegación",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué significa?</h4>
        <p className="text-sm text-muted-foreground">
          Número de veces que usuarios <strong>abrieron la navegación GPS</strong> para llegar a tu negocio.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Indica intención de visita:</strong> Usuarios que planean ir físicamente</li>
          <li>• <strong>Compara con visitas reales:</strong> Evalúa conversión a visitas</li>
        </ul>
      </div>
    ),
  },
  website: {
    title: "Sitio Web",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué significa?</h4>
        <p className="text-sm text-muted-foreground">
          Número de veces que usuarios <strong>hicieron clic para visitar tu sitio web</strong>.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Mide interés profundo:</strong> Usuarios que quieren saber más</li>
          <li>• <strong>Optimiza tu web:</strong> Asegúrate de que esté actualizada</li>
        </ul>
      </div>
    ),
  },
  phone: {
    title: "Llamadas",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué significa?</h4>
        <p className="text-sm text-muted-foreground">
          Número de veces que usuarios <strong>iniciaron una llamada telefónica</strong> a tu negocio.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Alta intención de compra:</strong> Llamadas indican interés serio</li>
          <li>• <strong>Asegura disponibilidad:</strong> Responde llamadas rápidamente</li>
        </ul>
      </div>
    ),
  },
  whatsapp: {
    title: "WhatsApp",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué significa?</h4>
        <p className="text-sm text-muted-foreground">
          Número de veces que usuarios <strong>iniciaron una conversación por WhatsApp</strong>.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Canal preferido:</strong> Muchos usuarios prefieren WhatsApp</li>
          <li>• <strong>Responde rápido:</strong> La velocidad de respuesta es clave</li>
        </ul>
      </div>
    ),
  },
  timeSeries: {
    title: "Tendencias Temporales",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra este gráfico?</h4>
        <p className="text-sm text-muted-foreground">
          La <strong>evolución diaria</strong> de impresiones, vistas y guardados en el período seleccionado.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Identifica patrones:</strong> ¿Qué días tienes más actividad?</li>
          <li>• <strong>Evalúa campañas:</strong> ¿Subieron las métricas después de una promoción?</li>
          <li>• <strong>Detecta tendencias:</strong> ¿Estás creciendo o decreciendo?</li>
        </ul>
      </div>
    ),
  },
  funnel: {
    title: "Embudo de Conversión",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra este gráfico?</h4>
        <p className="text-sm text-muted-foreground">
          El <strong>flujo de usuarios</strong> desde que ven tu negocio hasta que lo guardan.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo interpretar?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Impresiones → Vistas:</strong> ¿Tu negocio atrae clicks?</li>
          <li>• <strong>Vistas → Guardados:</strong> ¿Tu perfil convence?</li>
          <li>• <strong>Caídas grandes:</strong> Identifica dónde pierdes usuarios</li>
        </ul>
      </div>
    ),
  },
  ageDemo: {
    title: "Demografía por Edad",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra este gráfico?</h4>
        <p className="text-sm text-muted-foreground">
          La <strong>distribución por edad</strong> de los usuarios que interactúan con tu negocio.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Adapta tu mensaje:</strong> Conoce tu audiencia principal</li>
          <li>• <strong>Promociones dirigidas:</strong> Crea ofertas para tu grupo más activo</li>
        </ul>
      </div>
    ),
  },
  genderDemo: {
    title: "Distribución por Género",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra este gráfico?</h4>
        <p className="text-sm text-muted-foreground">
          La <strong>proporción de género</strong> de los usuarios que interactúan con tu negocio.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Marketing dirigido:</strong> Adapta tu comunicación</li>
          <li>• <strong>Productos/servicios:</strong> Considera ofertas específicas</li>
        </ul>
      </div>
    ),
  },
  rankDemo: {
    title: "Distribución por Fuerza",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra este gráfico?</h4>
        <p className="text-sm text-muted-foreground">
          Los <strong>rangos militares</strong> más frecuentes entre tus usuarios.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Conoce tu audiencia:</strong> ¿Oficiales, suboficiales, o soldados?</li>
          <li>• <strong>Ajusta precios:</strong> Considera el poder adquisitivo de tu audiencia</li>
        </ul>
      </div>
    ),
  },
  cityDemo: {
    title: "Usuarios por Ciudad",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra esta lista?</h4>
        <p className="text-sm text-muted-foreground">
          Las <strong>ciudades de origen</strong> de los usuarios que más interactúan con tu negocio.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Alcance geográfico:</strong> ¿Llegas a usuarios de otras ciudades?</li>
          <li>• <strong>Expansión:</strong> Considera abrir en ciudades con alto interés</li>
        </ul>
      </div>
    ),
  },
  locationAnalytics: {
    title: "Análisis por Ubicación",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra esta sección?</h4>
        <p className="text-sm text-muted-foreground">
          El <strong>rendimiento individual</strong> de cada una de tus ubicaciones/sucursales.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Compara sucursales:</strong> ¿Cuál tiene mejor conversión?</li>
          <li>• <strong>Identifica problemas:</strong> Ubicaciones con bajo rendimiento</li>
          <li>• <strong>Replica éxitos:</strong> Aplica estrategias de la mejor ubicación</li>
        </ul>
      </div>
    ),
  },
  heatmaps: {
    title: "Mapas de Calor",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra esta sección?</h4>
        <p className="text-sm text-muted-foreground">
          Las <strong>promociones más populares</strong> ordenadas por número de interacciones.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Identifica ganadores:</strong> ¿Qué promociones funcionan mejor?</li>
          <li>• <strong>Optimiza contenido:</strong> Replica el estilo de las más exitosas</li>
          <li>• <strong>Retira las débiles:</strong> Considera mejorar o eliminar las de bajo rendimiento</li>
        </ul>
      </div>
    ),
  },
  cohorts: {
    title: "Análisis de Cohortes",
    content: (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">¿Qué son las cohortes?</h4>
        <p className="text-sm text-muted-foreground">
          Las cohortes agrupan usuarios según el <strong>mes en que interactuaron por primera vez</strong> con tu negocio (vieron tu perfil, guardaron una promoción, etc.).
        </p>
        <h4 className="font-semibold text-sm">¿Qué significa retención?</h4>
        <p className="text-sm text-muted-foreground">
          El porcentaje de usuarios de cada cohorte que <strong>siguen activos</strong> (tuvieron actividad en los últimos 30 días).
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Retención alta (70%+):</strong> Buena fidelización</li>
          <li>• <strong>Retención baja (&lt;40%):</strong> Considera campañas de re-engagement</li>
          <li>• <strong>Tendencia descendente:</strong> Evalúa cambios en tus ofertas</li>
        </ul>
      </div>
    ),
  },
  engagement: {
    title: "Engagement por Tipo de Contacto",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra este gráfico?</h4>
        <p className="text-sm text-muted-foreground">
          La <strong>distribución de clics</strong> en tus diferentes métodos de contacto.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Canal preferido:</strong> ¿Cómo prefieren contactarte tus usuarios?</li>
          <li>• <strong>Optimiza recursos:</strong> Enfócate en los canales más usados</li>
          <li>• <strong>Mejora disponibilidad:</strong> Asegura respuesta rápida en canales populares</li>
        </ul>
      </div>
    ),
  },
  // Dashboard-specific tooltips
  activePromotions: {
    title: "Promociones Activas",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué significa?</h4>
        <p className="text-sm text-muted-foreground">
          Número de promociones que están <strong>actualmente visibles</strong> para los usuarios en la app.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Mantén ofertas frescas:</strong> Rota promociones regularmente</li>
          <li>• <strong>Revisa límites:</strong> Tu plan tiene un máximo de promociones activas</li>
        </ul>
      </div>
    ),
  },
  totalViews: {
    title: "Total Vistas",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué son las vistas?</h4>
        <p className="text-sm text-muted-foreground">
          Número de veces que usuarios <strong>abrieron tu perfil</strong> para ver más detalles de tu negocio.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Mide interés real:</strong> Usuarios que quieren saber más de ti</li>
          <li>• <strong>Compara con impresiones:</strong> Alta tasa = buen contenido visible</li>
        </ul>
      </div>
    ),
  },
  saves: {
    title: "Guardadas",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué significa?</h4>
        <p className="text-sm text-muted-foreground">
          Número total de veces que usuarios <strong>guardaron tu negocio o promociones</strong> como favoritos.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Indica intención futura:</strong> Usuarios que planean volver</li>
          <li>• <strong>Buen indicador de valor:</strong> Tu oferta les interesa</li>
        </ul>
      </div>
    ),
  },
  weeklyTrend: {
    title: "Tendencia Semanal",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">¿Qué muestra este gráfico?</h4>
        <p className="text-sm text-muted-foreground">
          La <strong>evolución de los últimos 7 días</strong> de impresiones, vistas y guardados.
        </p>
        <h4 className="font-semibold text-sm">¿Cómo usar esta información?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Días fuertes:</strong> ¿Cuándo tienes más actividad?</li>
          <li>• <strong>Evalúa impacto:</strong> ¿Una nueva promoción aumentó las métricas?</li>
          <li>• <strong>Planifica contenido:</strong> Publica en tus mejores días</li>
        </ul>
      </div>
    ),
  },
}
