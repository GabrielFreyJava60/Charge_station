import './App.css'
import HealthChecker from '@/components/HealthChecker';
import WelcomeTable from '@/components/WelcomeTable'

const App = () => {
  return (
    <>
      <div>
        Welcome to the Charging stations application
        <HealthChecker defaultInfo="Click to check!" endpoint='/health' checkerName='Check backend service'/>
        <HealthChecker defaultInfo="Click to check!" endpoint='/health/api' checkerName='Check backend + lambda'/>
        <WelcomeTable />
      </div>
    </>
  )
}

export default App
