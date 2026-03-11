import { type FC } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

const NavMenu: FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
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
      {user ? (
        <>
          <span style={{ marginRight: "15px" }}>{user.email}</span>

          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <span style={{ marginRight: "15px" }}>Guest</span>

          <button
            onClick={handleLogin}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </>
      )}
    </div>
  );
};

export default NavMenu;