import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Avalanche ICM Visualizer",
  description: "A foundation for exploring Avalanche Interchain Messaging.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
