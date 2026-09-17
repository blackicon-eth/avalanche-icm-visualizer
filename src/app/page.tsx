export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground sm:px-10">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center gap-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Avalanche / ICM
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">ICM Visualizer</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            The project foundation is ready. Network visualization and protocol features will be
            added in the next implementation steps.
          </p>
        </div>
        <div className="h-px w-full bg-border" />
        <p className="font-mono text-sm text-muted-foreground">Bootstrap complete · App Router · TypeScript</p>
      </div>
    </main>
  )
}
