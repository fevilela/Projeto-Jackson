import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TestData {
  date: string;
  cmj: number;
  sj: number;
  difference: number;
}

interface PerformanceChartProps {
  data: TestData[];
  athleteName?: string;
  type?: 'line' | 'bar';
}

export function PerformanceChart({ data, athleteName, type = 'line' }: PerformanceChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução dos Saltos</CardTitle>
        {athleteName && <CardDescription>{athleteName}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Altura (cm)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cmj" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name="CMJ (cm)"
                  dot={{ fill: 'hsl(var(--chart-1))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sj" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="SJ (cm)"
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
              </LineChart>
            ) : (
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Altura (cm)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="cmj" fill="hsl(var(--chart-1))" name="CMJ (cm)" />
                <Bar dataKey="sj" fill="hsl(var(--chart-2))" name="SJ (cm)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
