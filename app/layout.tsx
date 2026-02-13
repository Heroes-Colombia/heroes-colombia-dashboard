import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/hooks/use-auth"
import Script from "next/script"
import "./globals.css"

export const metadata: Metadata = {
  title: "Portal web Heroes Colombia",
  description: "Portal web para la gestion de promociones y descuentos de las empresas",
  generator: "Heroes Colombia",
  icons: {
    icon: "/images/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "tv5h13b6ph");`,
          }}
        />
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </AuthProvider>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
            var script = document.createElement('script');
            script.dataset.bot = "698eee354c9ee63bf5cf99ac";
            script.dataset.zindex = "99999";
            script.src = "https://panel.chatfuel.com/widgets/chat-widget/chat-widget.js";
            script.async = true;
            script.defer = true;
            document.getElementsByTagName('head')[0].appendChild(script);
          })()`,
          }}
        />
      </body>
    </html>
  )
}
