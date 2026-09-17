import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Avalanche ICM Visualizer",
  description: "A foundation for exploring Avalanche Interchain Messaging.",
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background bg-[linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] bg-size-[56px_56px] font-sans text-foreground">
        {children}
      </body>
    </html>
  )
}
