import { AthleteForm } from '../AthleteForm'

export default function AthleteFormExample() {
  return (
    <AthleteForm
      onSubmit={(athlete) => console.log('Athlete submitted:', athlete)}
    />
  )
}
