import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Check token on mount
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const { data } = await API.get('/auth/me');
                    setUser(data.user);
                } catch {
                    // Token invalid
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (credential, password, email = null) => {
        const payload = { credential, password };
        if (email) payload.email = email;

        const { data } = await API.post('/auth/login', payload);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
    };

    const register = async (userData) => {
        const endpoint = userData.account_type === 'business' ? '/auth/register-business' : '/auth/register';
        const { data } = await API.post(endpoint, userData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';
    const isAuthenticated = !!user && !!token;

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAuthenticated,
            isAdmin,
            login,
            register,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
