import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTopAds } from "@/hooks/useTopAds";
import { Skeleton } from "@/components/ui/skeleton";


const getChannelColor = (channel: string) => {
  switch (channel) {
    case 'Meta Ads':
      return 'bg-blue-500';
    case 'Google Ads':
      return 'bg-green-500';
    case 'TikTok Ads':
      return 'bg-gray-800';
    default:
      return 'bg-primary';
  }
};

const getROIColor = (roiValue: number) => {
  if (roiValue >= 3) return 'text-success';
  if (roiValue >= 2) return 'text-warning';
  return 'text-destructive';
};

export const TopAdsTable = () => {
  const { data: topAds, loading, error } = useTopAds();

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/30 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Top 5 Anúncios por ROI
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="flex space-x-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-8">
            Erro ao carregar dados: {error}
          </div>
        ) : topAds.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum anúncio encontrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-center">Vendas</TableHead>
                <TableHead className="text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topAds.map((ad) => (
                <TableRow key={ad.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-foreground">
                    {ad.name}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${getChannelColor(ad.channel)} text-white border-0`}
                    >
                      {ad.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {ad.investment}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-success">
                    {ad.revenue}
                  </TableCell>
                  <TableCell className="text-center text-foreground">
                    {ad.sales}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${getROIColor(ad.roiValue)}`}>
                    {ad.roi}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};