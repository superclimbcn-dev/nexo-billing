import { ProgressDots, VerticalCard, Button } from '@nexo/core-ui'
import { onboardingData } from '@/mocks/spoiler-data'

export default function OnboardingPage() {
  return (
    <div
      className="bg-[var(--bg)] min-h-[calc(100vh-65px)] flex items-center"
    >
      <div className="max-w-[640px] mx-auto py-[60px] px-6 w-full">
        <ProgressDots dots={onboardingData.progressDots} />

        <h1 className="[font-family:var(--font-serif)] text-[64px] font-normal tracking-[-0.03em] leading-none mb-4">
          ¿A qué te <em className="italic text-[var(--text-dim)]">dedicas</em>?
        </h1>
        <p className="text-base text-[var(--text-dim)] mb-10 max-w-[480px] leading-relaxed">
          Cada sector tiene sus particularidades. Selecciona el tuyo y configuraremos tu plantilla
          de factura, tarifas de IVA por defecto y los módulos que necesitas.
        </p>

        <div className="grid grid-cols-2 gap-3.5 mb-8">
          {onboardingData.verticals.map((v) => (
            <VerticalCard
              key={v.title}
              icon={v.icon}
              title={v.title}
              description={v.description}
              selected={v.selected}
            />
          ))}
        </div>

        <div className="flex justify-between items-center mt-8">
          <span className="text-[var(--text-subtle)] text-[13px] cursor-pointer">← Anterior</span>
          <Button>Continuar →</Button>
        </div>
      </div>
    </div>
  )
}
