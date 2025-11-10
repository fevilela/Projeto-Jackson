import { AthleteList } from '../AthleteList'

export default function AthleteListExample() {
  const mockAthletes = [
    { id: '1', name: 'João Silva', age: '25', sport: 'Futebol' },
    { id: '2', name: 'Maria Santos', age: '22', sport: 'Vôlei' },
    { id: '3', name: 'Pedro Costa', age: '28', sport: 'Basquete' },
  ]

  return (
    <AthleteList 
      athletes={mockAthletes}
      onSelectAthlete={(id) => console.log('Selected athlete:', id)}
    />
  )
}
