import { Outlet } from 'react-router';
import { type FC } from 'react';
import NavMenu from "@/components/NavMenu";

const Layout: FC = () => {
  return (
    <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
      alignItems: 'center'
    }}>
      <NavMenu />
      <Outlet />
    </div>
  )
}

export default Layout;