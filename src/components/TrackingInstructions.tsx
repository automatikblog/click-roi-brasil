import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Globe, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const TrackingInstructions = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [empresaId, setEmpresaId] = useState<string>('');

  useEffect(() => {
    if (user) {
      const fetchEmpresaId = async () => {
        try {
          const { data: empresa } = await supabase
            .from('empresas')
            .select('id')
            .eq('usuario_id', user.id)
            .single();
          
          if (empresa) {
            setEmpresaId(empresa.id);
          }
        } catch (error) {
          console.error('Error fetching empresa ID:', error);
        }
      };
      
      fetchEmpresaId();
    }
  }, [user]);

  const trackingScript = `<!-- MétricaClick Tracking Script -->
<script 
  src="${window.location.origin}/metrica-click-tracker.js" 
  data-empresa-id="${empresaId}"
  data-debug="false">
</script>`;

  const webhookUrl = `https://jmzlhnbkriagrchwochr.supabase.co/functions/v1/webhook`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${type} copiado para a área de transferência.`,
    });
  };

  const generateSampleData = async () => {
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('seed-data', {
        body: { empresa_id: empresaId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Sucesso!",
        description: "Dados de exemplo criados com sucesso. Atualize a página para ver os resultados.",
      });
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar dados de exemplo.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Script de Rastreamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Script de Rastreamento
            <Badge variant="outline">JavaScript</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adicione este script antes do fechamento da tag &lt;/head&gt; do seu site:
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              <code>{trackingScript}</code>
            </pre>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(trackingScript, 'Script de rastreamento')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Script
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a href="/metrica-click-tracker.js" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Script
              </a>
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Como funciona:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Captura automaticamente UTMs, GCLID, FBCLID</li>
              <li>• Detecta dispositivo e localização do visitante</li>
              <li>• Cria sessão única para cada visitante</li>
              <li>• Compatível com todos os navegadores modernos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* URL do Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            URL do Webhook
            <Badge variant="outline">API</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure esta URL nas suas plataformas de venda (Hotmart, Kiwify, etc.):
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm break-all">{webhookUrl}</code>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => copyToClipboard(webhookUrl, 'URL do webhook')}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar URL
          </Button>

          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
              Parâmetros esperados:
            </h4>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• <strong>empresa_id</strong>: {empresaId || 'Carregando...'}</li>
              <li>• <strong>valor</strong>: Valor da venda (obrigatório)</li>
              <li>• <strong>produto</strong>: Nome do produto (obrigatório)</li>
              <li>• <strong>webhook_source</strong>: hotmart, kiwify, etc.</li>
              <li>• <strong>email</strong>: Email do cliente (opcional)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Botão para Gerar Dados de Exemplo */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Exemplo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Para testar o dashboard, você pode gerar dados de exemplo com campanhas, 
            sessões e conversões dos últimos 30 dias.
          </p>
          
          <Button onClick={generateSampleData} disabled={!empresaId}>
            Gerar Dados de Exemplo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};