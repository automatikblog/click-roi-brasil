import { Header } from "@/components/Header";
import { TrackingInstructions } from "@/components/TrackingInstructions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground mt-2">
              Configure o rastreamento e gerencie suas preferências
            </p>
          </div>
        </div>

        <TrackingInstructions />
      </main>
    </div>
  );
};

export default Settings;