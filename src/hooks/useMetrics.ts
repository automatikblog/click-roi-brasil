import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useCompany } from '@/contexts/CompanyContext'

interface Metrics {
  investimentoTotal: number
  faturamentoTotal: number
  roiMedio: number
  totalVendas: number
  loading: boolean
  error: string | null
}

export function useMetrics(): Metrics {
  const [metrics, setMetrics] = useState<Metrics>({
    investimentoTotal: 0,
    faturamentoTotal: 0,
    roiMedio: 0,
    totalVendas: 0,
    loading: true,
    error: null,
  })
  const { activeCompany } = useCompany()

  useEffect(() => {
    if (!activeCompany) return

    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true, error: null }))

        // Get current month start and end
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        // Get total investment (from campanhas)
        const { data: campanhas } = await supabase
          .from('campanhas')
          .select('investimento')
          .eq('empresa_id', activeCompany.id)
          .gte('periodo', startOfMonth.toISOString())
          .lte('periodo', endOfMonth.toISOString())

        const investimentoTotal = campanhas?.reduce((sum, c) => sum + c.investimento, 0) || 0

        // Get total revenue and sales count (from conversoes)
        const { data: conversoes } = await supabase
          .from('conversoes')
          .select('valor')
          .eq('empresa_id', activeCompany.id)
          .gte('data_conversao', startOfMonth.toISOString())
          .lte('data_conversao', endOfMonth.toISOString())

        const faturamentoTotal = conversoes?.reduce((sum, c) => sum + c.valor, 0) || 0
        const totalVendas = conversoes?.length || 0

        // Calculate ROI
        const roiMedio = investimentoTotal > 0 ? ((faturamentoTotal - investimentoTotal) / investimentoTotal) * 100 : 0

        setMetrics({
          investimentoTotal,
          faturamentoTotal,
          roiMedio,
          totalVendas,
          loading: false,
          error: null,
        })
      } catch (error: any) {
        console.error('Error fetching metrics:', error)
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    }

    fetchMetrics()
  }, [activeCompany])

  return metrics
}