import {createContext, useContext, useEffect, useMemo, useState} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);

    useEffect(() => { 
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    },[]);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    const value = useMemo(() => {
        return {
            user,
            login,
            logout,
            isAuthenticated: !! user,
            role: user?.role || null,
            };
        }, [user]);

        return <AuthContext.Provider value = {value} > {children} </AuthContext.Provider>;
 }

 export function useAuth() {
    return useContext(AuthContext);
 }