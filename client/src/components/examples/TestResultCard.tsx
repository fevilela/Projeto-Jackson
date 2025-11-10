import { TestResultCard } from '../TestResultCard'

export default function TestResultCardExample() {
  return (
    <div className="space-y-4">
      <TestResultCard
        athleteName="João Silva"
        date="2024-01-15"
        cmj={48.5}
        sj={45.2}
        observations="Ótimo desempenho, melhora significativa em relação ao teste anterior."
      />
      <TestResultCard
        athleteName="Maria Santos"
        date="2024-01-14"
        cmj={42.3}
        sj={44.1}
      />
    </div>
  )
}
