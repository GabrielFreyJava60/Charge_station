import { type FC } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { APP_PATH, LOGIN_PATH } from "@/router/roleNavigation";

const NavMenuButton: FC<{ buttonTitle: string, clickHandler: () => void }> = ({ buttonTitle, clickHandler}) => {
  return (
    <button
    onClick={clickHandler}
    style={{
      padding: "6px 12px",
      cursor: "pointer",
    }}>
      {buttonTitle}
    </button>
  )
}

const NavMenuTextItem: FC<{ itemText: string }> = ({ itemText }) => {
  return <span style={{ marginRight: "15px" }}>{itemText}</span>;
}

const NavMenu: FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleHome = () => {
    navigate(APP_PATH);
  }

  const handleLogin = () => {
    navigate(LOGIN_PATH);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        width: "100%",
        height: "60px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0 20px",
        boxSizing: "border-box",
        zIndex: 1000,
      }}
    >
      <NavMenuButton buttonTitle={"Home"} clickHandler={handleHome} />
      {user ? (
        <>
          <NavMenuTextItem itemText={user.email} />
          <NavMenuButton buttonTitle={"Logout"} clickHandler={handleLogout} />
        </>
      ) : (
        <>
          <NavMenuTextItem itemText="Guest" />
          <NavMenuButton buttonTitle={"Login"} clickHandler={handleLogin} />
        </>
      )}
    </div>
  );
};

export default NavMenu;