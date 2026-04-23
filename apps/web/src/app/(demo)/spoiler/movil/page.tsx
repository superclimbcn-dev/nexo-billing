import {
  PhoneFrame,
  PhoneServiceItem,
  PhoneActionCard,
} from '@nexo/core-ui'
import { mobilePhone1, mobilePhone2 } from '@/mocks/spoiler-data'

export default function MovilPage() {
  return (
    <div className="flex justify-center items-start py-10 px-10 gap-12 flex-wrap bg-[var(--bg)] min-h-[calc(100vh-65px)]">

      {/* Phone 1: Vista del operario */}
      <div>
        <div className="mb-5 max-w-[380px]">
          <h2 className="[font-family:var(--font-serif)] text-[32px] font-normal tracking-[-0.01em] mb-1.5">
            Vista del <em className="italic">operario</em>
          </h2>
          <p className="text-[var(--text-dim)] text-[13px]">
            Pantalla "Hoy" — el operario de limpieza ve su ruta del día, check-in/out con
            geolocalización y firma del cliente.
          </p>
        </div>

        <PhoneFrame>
          <div className="[font-family:var(--font-serif)] text-[28px] font-normal tracking-[-0.01em] mb-1">
            {mobilePhone1.greeting} <em className="italic text-[var(--text-dim)]">{mobilePhone1.greetingName}</em>
          </div>
          <div className="text-[12px] text-[var(--text-subtle)] [font-family:var(--font-mono)] mb-6">
            {mobilePhone1.subtitle}
          </div>

          {/* Today card */}
          <div className="bg-[var(--accent)] text-black rounded-[20px] p-5 mb-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-black/8 rounded-full pointer-events-none" />
            <div className="[font-family:var(--font-mono)] text-[10px] font-semibold uppercase tracking-[0.08em] mb-2">
              HOY TIENES
            </div>
            <div className="[font-family:var(--font-serif)] text-[56px] leading-none tracking-[-0.03em] mb-1">
              {mobilePhone1.todayCount}
            </div>
            <div className="text-xs font-medium opacity-80">{mobilePhone1.todayDesc}</div>
          </div>

          {/* Service list */}
          <div className="flex-1 overflow-y-auto">
            {mobilePhone1.services.map((svc) => (
              <PhoneServiceItem key={svc.time} {...svc} />
            ))}
          </div>

          {/* FAB */}
          <div className="absolute bottom-8 right-6 w-14 h-14 bg-[var(--accent)] rounded-[20px] grid place-items-center text-black text-3xl shadow-[0_12px_40px_var(--accent-glow)] cursor-pointer">
            +
          </div>
        </PhoneFrame>
      </div>

      {/* Phone 2: Parte de servicio */}
      <div>
        <div className="mb-5 max-w-[380px]">
          <h2 className="[font-family:var(--font-serif)] text-[32px] font-normal tracking-[-0.01em] mb-1.5">
            Parte <em className="italic">en vivo</em>
          </h2>
          <p className="text-[var(--text-dim)] text-[13px]">
            Geolocalización en tiempo real, foto del antes y después, firma del cliente.
            Offline-first.
          </p>
        </div>

        <PhoneFrame>
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-[12px] bg-[var(--surface)] grid place-items-center text-[var(--text)] text-lg">
              ←
            </div>
            <div>
              <div className="text-sm font-semibold">{mobilePhone2.clientName}</div>
              <div className="text-[11px] text-[var(--text-dim)] [font-family:var(--font-mono)]">
                CHECK-IN · {mobilePhone2.checkInTime}
              </div>
            </div>
          </div>

          {/* Timer hero */}
          <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-raised)] border border-[var(--border)] rounded-[20px] p-6 mb-4 text-center">
            <div className="[font-family:var(--font-mono)] text-[10px] text-[var(--text-subtle)] uppercase tracking-[0.06em] mb-2">
              TIEMPO EN SERVICIO
            </div>
            <div className="[font-family:var(--font-serif)] text-[48px] tracking-[-0.02em] mb-1">
              {mobilePhone2.timer}
            </div>
            <div className="bg-[var(--bg)] rounded-[12px] px-3.5 py-2.5 text-[11px] text-[var(--text-dim)] flex items-center gap-2 justify-center">
              <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full shadow-[0_0_8px_var(--success)]" />
              <span>{mobilePhone2.location}</span>
            </div>
          </div>

          {/* Action cards */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {mobilePhone2.actions.slice(0, 2).map((action) => (
              <PhoneActionCard key={action.label} {...action} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {mobilePhone2.actions.slice(2).map((action) => (
              <PhoneActionCard key={action.label} {...action} />
            ))}
          </div>

          {/* Checkout button */}
          <button className="mt-auto bg-[var(--danger)] text-white border-0 py-4 rounded-[16px] [font-family:var(--font-sans)] font-semibold text-sm cursor-pointer w-full">
            Finalizar servicio
          </button>
        </PhoneFrame>
      </div>
    </div>
  )
}
