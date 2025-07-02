import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const MetricCard = ({ title, value, change, icon, className, loading = false }: MetricCardProps) => {
  return (
    <Card className={`bg-gradient-to-br from-card to-secondary/30 border-border/50 hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary/80">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground mb-1">
              {value}
            </div>
            {change && (
              <div className={`flex items-center text-xs ${
                change.isPositive ? 'text-success' : 'text-destructive'
              }`}>
                {change.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(change.value)}% vs mês anterior
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};