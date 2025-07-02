import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { ChannelChart } from "@/components/ChannelChart";
import { TopAdsTable } from "@/components/TopAdsTable";
import { DollarSign, TrendingUp, Target, MousePointer } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="p-6 space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Investimento Total"
            value="R$ 8.400,00"
            change={{ value: 12.5, isPositive: true }}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <MetricCard
            title="Faturamento Total"
            value="R$ 29.400,00"
            change={{ value: 18.2, isPositive: true }}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <MetricCard
            title="ROI Médio"
            value="250%"
            change={{ value: 5.8, isPositive: true }}
            icon={<Target className="h-5 w-5" />}
          />
          <MetricCard
            title="Total de Vendas"
            value="80"
            change={{ value: 22.1, isPositive: true }}
            icon={<MousePointer className="h-5 w-5" />}
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
      </main>
    </div>
  );
};

export default Index;
