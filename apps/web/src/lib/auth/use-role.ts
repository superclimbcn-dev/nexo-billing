'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { isOwnerOrAdmin, isAccountant, canRead, canWrite, canExport, canAccessSettings } from './role-guard'

export interface RoleInfo {
  role: string | null
  isOwnerOrAdmin: boolean
  isAccountant: boolean
  canRead: boolean
  canWrite: boolean
  canExport: boolean
  canAccessSettings: boolean
  isLoading: boolean
}

export function useRole(): RoleInfo {
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRole() {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )
        const { data: { user } } = await supabase.auth.getUser()
        const userRole = user?.app_metadata?.role as string | undefined ?? null
        setRole(userRole)
      } catch {
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }
    loadRole()
  }, [])

  const user = { app_metadata: { role: role ?? undefined } }

  return {
    role,
    isOwnerOrAdmin: isOwnerOrAdmin(user),
    isAccountant: isAccountant(user),
    canRead: canRead(user),
    canWrite: canWrite(user),
    canExport: canExport(user),
    canAccessSettings: canAccessSettings(user),
    isLoading,
  }
}
