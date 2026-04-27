'use client'

import { useState } from 'react'
import { VerticalCard, Button } from '@nexo/core-ui'

const VERTICALS = [
  {
    value: 'limpieza',
    icon: '🧹',
    title: 'Limpieza',
    description: 'Servicios de limpieza doméstica, industrial y mantenimiento',
  },
  {
    value: 'construccion',
    icon: '🏗️',
    title: 'Construcción',
    description: 'Reformas, obra nueva, instalaciones y rehabilitación',
  },
  {
    value: 'medicos',
    icon: '⚕️',
    title: 'Salud y médicos',
    description: 'Clínicas, consultas médicas y servicios sanitarios',
  },
  {
    value: 'servicios_pro',
    icon: '💼',
    title: 'Servicios pro',
    description: 'Consultoría, legal, asesoría, marketing y servicios B2B',
  },
  {
    value: 'retail',
    icon: '🏪',
    title: 'Comercio',
    description: 'Tiendas, comercio minorista y venta al público',
  },
  {
    value: 'generic',
    icon: '✦',
    title: 'Genérico',
    description: 'Facturación estándar sin módulos sectoriales adicionales',
  },
]

interface VerticalSelectorProps {
  defaultValue?: string
}

export function VerticalSelector({ defaultValue = 'generic' }: VerticalSelectorProps) {
  const [selected, setSelected] = useState(defaultValue)

  return (
    <div className="flex flex-col gap-6">
      <input type="hidden" name="vertical" value={selected} />

      <div className="grid grid-cols-2 gap-3">
        {VERTICALS.map((v) => (
          <div key={v.value} onClick={() => setSelected(v.value)}>
            <VerticalCard
              icon={v.icon}
              title={v.title}
              description={v.description}
              selected={selected === v.value}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <a href="/onboarding/datos-fiscales">
          <Button type="button" variant="secondary">
            ← Atrás
          </Button>
        </a>
        <Button type="submit" variant="primary">
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
