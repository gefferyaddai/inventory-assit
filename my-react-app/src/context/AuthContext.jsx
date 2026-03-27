import {createContext, useContext, useEffect, useMemo, useState} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);

    useEffect(() => { 
        const savedUser = localStorgae.getItem('user');
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







 }