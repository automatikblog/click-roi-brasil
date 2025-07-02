import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useCompany } from '@/contexts/CompanyContext'

interface ChannelData {
  name: string
  value: number
  color: string
}

interface ChannelDataHook {
  data: ChannelData[]
  loading: boolean
  error: string | null
}

export function useChannelData(): ChannelDataHook {
  const [state, setState] = useState<ChannelDataHook>({
    data: [],
    loading: true,
    error: null,
  })
  const { activeCompany } = useCompany()

  useEffect(() => {
    if (!activeCompany) return

    const fetchChannelData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        // Get current month start and end
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        // Get sessions grouped by UTM source for this month
        const { data: sessoes } = await supabase
          .from('sessoes')
          .select('utm_source')
          .eq('empresa_id', activeCompany.id)
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())

        // Count sessions by channel
        const channelCounts = (sessoes || []).reduce((acc, session) => {
          let channel = 'Orgânico'
          if (session.utm_source?.includes('facebook') || session.utm_source?.includes('meta')) {
            channel = 'Meta Ads'
          } else if (session.utm_source?.includes('google')) {
            channel = 'Google Ads'
          } else if (session.utm_source?.includes('tiktok')) {
            channel = 'TikTok Ads'
          }
          
          acc[channel] = (acc[channel] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const total = Object.values(channelCounts).reduce((sum, count) => sum + count, 0)

        const channelColors: Record<string, string> = {
          'Meta Ads': '#1877F2',
          'Google Ads': '#4285F4',
          'TikTok Ads': '#000000',
          'Orgânico': '#10B981',
        }

        const data = Object.entries(channelCounts).map(([name, count]) => ({
          name,
          value: total > 0 ? Math.round((count / total) * 100) : 0,
          color: channelColors[name] || '#6B7280',
        }))

        setState({
          data,
          loading: false,
          error: null,
        })
      } catch (error: any) {
        console.error('Error fetching channel data:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }))
      }
    }

    fetchChannelData()
  }, [activeCompany])

  return state
}