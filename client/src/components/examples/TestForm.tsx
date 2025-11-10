import { TestForm } from '../TestForm'

export default function TestFormExample() {
  const mockAthletes = [
    { id: '1', name: 'João Silva' },
    { id: '2', name: 'Maria Santos' },
    { id: '3', name: 'Pedro Costa' },
  ]

  return (
    <TestForm
      athletes={mockAthletes}
      onSubmit={(test) => console.log('Test submitted:', test)}
    />
  )
}
