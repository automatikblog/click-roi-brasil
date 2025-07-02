import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const topAds = [
  {
    id: 1,
    name: "Black Friday - Produto A",
    channel: "Meta Ads",
    investment: "R$ 2.500,00",
    revenue: "R$ 12.500,00",
    sales: 25,
    roi: "400%",
    roiValue: 4.0
  },
  {
    id: 2,
    name: "Campanha de Verão",
    channel: "Google Ads",
    investment: "R$ 1.800,00",
    revenue: "R$ 7.200,00",
    sales: 18,
    roi: "300%",
    roiValue: 3.0
  },
  {
    id: 3,
    name: "Promoção Produto B",
    channel: "TikTok Ads",
    investment: "R$ 900,00",
    revenue: "R$ 2.700,00",
    sales: 9,
    roi: "200%",
    roiValue: 2.0
  },
  {
    id: 4,
    name: "Remarketing Premium",
    channel: "Meta Ads",
    investment: "R$ 1.200,00",
    revenue: "R$ 3.000,00",
    sales: 12,
    roi: "150%",
    roiValue: 1.5
  },
  {
    id: 5,
    name: "Keywords Golden",
    channel: "Google Ads",
    investment: "R$ 2.000,00",
    revenue: "R$ 4.000,00",
    sales: 16,
    roi: "100%",
    roiValue: 1.0
  }
];

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
  return (
    <Card className="bg-gradient-to-br from-card to-secondary/30 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Top 5 Anúncios por ROI
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};