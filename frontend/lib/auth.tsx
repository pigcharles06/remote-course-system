"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
    email: string;
    name: string;
    role: "TEACHER" | "REVIEWER" | "ADMIN";
    department?: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, role: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Fetch user details
            fetch("/api/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (res.ok) return res.json();
                    throw new Error("Failed to fetch user");
                })
                .then((userData) => setUser(userData))
                .catch(() => {
                    localStorage.removeItem("token");
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (token: string, role: string) => {
        localStorage.setItem("token", token);
        // Refresh user data immediately
        fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((userData) => {
                setUser(userData);
                // Redirect based on role
                if (role === "ADMIN") router.push("/dashboard/admin");
                else if (role === "REVIEWER") router.push("/dashboard/reviewer");
                else router.push("/dashboard/teacher");
            });
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
