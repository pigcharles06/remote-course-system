"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    if (!user) {
        router.push("/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-blue-600">NYCU Remote Course</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link href={`/dashboard/${user.role.toLowerCase()}`} className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Dashboard
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="mr-4 text-sm text-gray-500">
                                    {user.name} ({user.role})
                                </span>
                                <Button variant="outline" onClick={logout} size="sm">
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
