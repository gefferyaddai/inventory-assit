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







 }