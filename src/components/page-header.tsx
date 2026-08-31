interface PageHeaderProps {
  title: string
  description: string
}

/** Presentational page heading — props only, no fetching (§6). */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  )
}
