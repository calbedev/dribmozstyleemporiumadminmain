import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ConvexClientProvider } from "./ConvexClientProvider";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../app/stack/server";

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt">
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }   `}
        </style>
      </head>
      <body style={{ zoom: 0.9 }}>
        <StackProvider app={stackServerApp}  lang={'pt-BR'}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
        </StackProvider>
      </body>
    </html>
  )
}
