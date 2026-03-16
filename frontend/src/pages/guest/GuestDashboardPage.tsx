import { NavLink } from 'react-router-dom';
import HealthChecker from '@/components/HealthChecker';
import WelcomeTable from '@/components/WelcomeTable';

const GuestDashboardPage = () => {
  return (
      <>
            <h1>Welcome to the Charging stations application</h1>
            You can <NavLink to="/login">Login</NavLink> or <NavLink to="/register">join us</NavLink>
            <div>
                <HealthChecker defaultInfo="Click to check!" endpoint='/health' checkerName='Check backend service'/>
                <HealthChecker defaultInfo="Click to check!" endpoint='/health/api' checkerName='Check backend + lambda'/>
                <WelcomeTable />
            </div>
    </>
  )
}

export default GuestDashboardPage;
