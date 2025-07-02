import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { ChannelChart } from "@/components/ChannelChart";
import { TopAdsTable } from "@/components/TopAdsTable";
import { TrackingInstructions } from "@/components/TrackingInstructions";
import { useMetrics } from "@/hooks/useMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Target, MousePointer } from "lucide-react";

const Index = () => {
  const { investimentoTotal, faturamentoTotal, roiMedio, totalVendas, loading } = useMetrics();

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="p-6 space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="setup">Configuração</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Investimento Total"
                value={formatCurrency(investimentoTotal)}
                change={{ value: 12.5, isPositive: true }}
                icon={<DollarSign className="h-5 w-5" />}
                loading={loading}
              />
              <MetricCard
                title="Faturamento Total"
                value={formatCurrency(faturamentoTotal)}
                change={{ value: 18.2, isPositive: true }}
                icon={<TrendingUp className="h-5 w-5" />}
                loading={loading}
              />
              <MetricCard
                title="ROI Médio"
                value={`${roiMedio.toFixed(1)}%`}
                change={{ value: 5.8, isPositive: true }}
                icon={<Target className="h-5 w-5" />}
                loading={loading}
              />
              <MetricCard
                title="Total de Vendas"
                value={totalVendas.toString()}
                change={{ value: 22.1, isPositive: true }}
                icon={<MousePointer className="h-5 w-5" />}
                loading={loading}
              />
            </div>

            {/* Gráficos e Tabelas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChannelChart />
              <div className="lg:col-span-1">
                <TopAdsTable />
              </div>
            </div>

            {/* Seção de Status */}
            <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-success">Sistema Funcionando</h3>
                  <p className="text-sm text-muted-foreground">
                    Script de rastreamento ativo • Última conversão: há 2 minutos
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="setup">
            <TrackingInstructions />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
