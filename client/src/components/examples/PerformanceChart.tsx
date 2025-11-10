import { PerformanceChart } from '../PerformanceChart'

export default function PerformanceChartExample() {
  const mockData = [
    { date: '2024-01-10', cmj: 42.5, sj: 40.2, difference: 5.7 },
    { date: '2024-01-15', cmj: 44.8, sj: 41.5, difference: 7.9 },
    { date: '2024-01-20', cmj: 46.2, sj: 43.1, difference: 7.2 },
    { date: '2024-01-25', cmj: 48.5, sj: 45.2, difference: 7.3 },
    { date: '2024-01-30', cmj: 47.9, sj: 44.8, difference: 6.9 },
  ]

  return (
    <div className="space-y-4">
      <PerformanceChart 
        data={mockData} 
        athleteName="João Silva"
        type="line"
      />
      <PerformanceChart 
        data={mockData} 
        athleteName="João Silva"
        type="bar"
      />
    </div>
  )
}
