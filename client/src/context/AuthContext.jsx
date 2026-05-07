import { createContext, useEffect, useState } from "react";


export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);


  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);


  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
  };


  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };


  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
