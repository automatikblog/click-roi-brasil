import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface TopAd {
  id: string
  name: string
  channel: string
  investment: string
  revenue: string
  sales: number
  roi: string
  roiValue: number
}

interface TopAdsHook {
  data: TopAd[]
  loading: boolean
  error: string | null
}

export function useTopAds(): TopAdsHook {
  const [state, setState] = useState<TopAdsHook>({
    data: [],
    loading: true,
    error: null,
  })
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchTopAds = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        // Get current month start and end
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        // Get user's company
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('usuario_id', user.id)
          .single()

        if (!empresa) throw new Error('Empresa não encontrada')

        // Get campaigns for this month
        const { data: campanhas } = await supabase
          .from('campanhas')
          .select('*')
          .eq('empresa_id', empresa.id)
          .gte('periodo', startOfMonth.toISOString())
          .lte('periodo', endOfMonth.toISOString())
          .order('investimento', { ascending: false })
          .limit(5)

        if (!campanhas || campanhas.length === 0) {
          setState({
            data: [],
            loading: false,
            error: null,
          })
          return
        }

        // For each campaign, get conversion data
        const topAdsData = await Promise.all(
          campanhas.map(async (campanha) => {
            // Get conversions for this campaign (simplified - get all conversions for now)
            const { data: conversoes } = await supabase
              .from('conversoes')
              .select('valor')
              .eq('empresa_id', empresa.id)
              .gte('data_conversao', startOfMonth.toISOString())
              .lte('data_conversao', endOfMonth.toISOString())

            // For now, distribute conversions equally among campaigns
            const totalCampaigns = campanhas.length
            const campaignConversions = conversoes?.slice(0, Math.floor((conversoes.length || 0) / totalCampaigns)) || []

            const revenue = campaignConversions.reduce((sum, conv) => sum + conv.valor, 0)
            const sales = campaignConversions.length
            const roiValue = campanha.investimento > 0 ? revenue / campanha.investimento : 0

            return {
              id: campanha.id,
              name: campanha.nome,
              channel: campanha.canal,
              investment: `R$ ${campanha.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              revenue: `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              sales,
              roi: `${Math.round((roiValue - 1) * 100)}%`,
              roiValue: roiValue - 1,
            }
          })
        )

        // Sort by ROI descending
        topAdsData.sort((a, b) => b.roiValue - a.roiValue)

        setState({
          data: topAdsData,
          loading: false,
          error: null,
        })
      } catch (error: any) {
        console.error('Error fetching top ads:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    }

    fetchTopAds()
  }, [user])

  return state
}