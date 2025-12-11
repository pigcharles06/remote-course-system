"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const res = await fetch("/api/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });

            if (!res.ok) throw new Error("Invalid credentials");

            const data = await res.json();
            login(data.access_token, data.role);
        } catch (err) {
            setError("Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Remote Course System</CardTitle>
                    <CardDescription>Login to access your dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-gray-500">
                        <p>Demo Accounts:</p>
                        <p>Teacher: test@example.com / password</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
