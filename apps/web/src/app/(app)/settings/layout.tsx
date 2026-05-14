import { SettingsTabs } from './_components/settings-tabs'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">Ajustes</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Configura los datos de tu empresa, logo y series de facturación.
        </p>
      </header>
      <SettingsTabs />
      <div>{children}</div>
    </div>
  )
}
