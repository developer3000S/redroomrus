import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { 
  ShieldAlert, 
  Activity, 
  Globe, 
  Radio, 
  Cpu,
  Terminal,
  Server
} from "lucide-react";
import Map from "@/components/Map";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function C4ISRPage() {
  const { data: stats } = trpc.c4isr.getDashboardStats.useQuery();
  const { data: comms } = trpc.c4isr.getLiveComms.useQuery(undefined, {
    refetchInterval: 10000
  });
  const { data: hardwareNodes } = trpc.hardware.listNodes.useQuery();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          C4ISR Integrated Command
        </h1>
        <p className="text-muted-foreground">
          Unified Command, Control, Communications, Computers, Intelligence, Surveillance, and Reconnaissance.
        </p>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard 
          title="Active Missions" 
          value={stats?.activeMissions ?? "--"} 
          icon={Activity} 
          trend="+2 vs previous"
        />
        <MetricCard 
          title="Intel Alerts (24h)" 
          value={stats?.intelAlerts24h ?? "--"} 
          icon={ShieldAlert} 
          trend="Critical priority"
          color="text-destructive"
        />
        <MetricCard 
          title="Critical Infra" 
          value={stats?.criticalInfrastructures ?? "--"} 
          icon={Globe} 
          trend="Monitored worldwide"
        />
        <MetricCard 
          title="Comms Status" 
          value={stats?.commsStatus ?? "--"} 
          icon={Radio} 
          trend="Encrypted (AES-512)"
        />
        <MetricCard 
          title="System Health" 
          value={stats?.systemHealth ?? "--"} 
          icon={Cpu} 
          trend="Normal operation"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Situation Map */}
        <Card className="lg:col-span-2 border-primary/20 bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Global Tactical Overlay</CardTitle>
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">LIVE SITUATION</Badge>
          </CardHeader>
          <CardContent className="h-[500px] p-0 overflow-hidden rounded-b-xl relative">
            <Map 
              region="Global" 
              className="w-full h-full"
            />
          </CardContent>
        </Card>

        {/* Live Communications & External Nodes */}
        <div className="flex flex-col gap-6">
          <Card className="border-primary/20 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="size-4 text-primary" />
                Intelligence Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[250px] px-4">
                <div className="flex flex-col gap-3 pb-4">
                  {comms?.map((msg) => (
                    <div key={msg.id} className="text-xs border-l-2 border-primary/30 pl-3 py-1 bg-primary/5 rounded-r-md">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-primary/80 uppercase tracking-widest text-[9px]">{msg.type}</span>
                        <span className="text-muted-foreground text-[8px]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-foreground/90 leading-relaxed font-mono">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="size-4 text-primary" />
                External Physical Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {hardwareNodes?.map((node) => (
                  <div key={node.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{node.name}</span>
                      <span className="text-[10px] text-muted-foreground">{node.location}</span>
                    </div>
                    <Badge 
                      variant={node.status === 'online' ? 'default' : 'secondary'} 
                      className={`text-[9px] ${node.status === 'online' ? 'bg-green-600/20 text-green-500 border-green-500/50' : ''}`}
                    >
                      {node.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <Card className="border-primary/10 bg-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color ?? ''}`}>{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1 font-medium">{trend}</p>
      </CardContent>
    </Card>
  );
}
