import { Outlet } from 'react-router';
import { type FC } from 'react';
import NavMenu from "@/components/NavMenu";

const Layout: FC = () => {
  return (
    <div style={{
            display: "flex",
            flexDirection: "row",
            minHeight: "100vh",
    }}>
      <NavMenu />
      <Outlet />
    </div>
  )
}

export default Layout;