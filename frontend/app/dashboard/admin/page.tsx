"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Application {
    id: string;
    course_name_zh: string;
    course_name_en: string;
    status: string;
    created_at: string;
    teacher_id: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

export default function AdminDashboard() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [reviewers, setReviewers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [appsRes, reviewersRes] = await Promise.all([
                fetch("/api/applications/", { headers }),
                fetch("/api/users/reviewers", { headers })
            ]);

            if (appsRes.ok) {
                setApplications(await appsRes.json());
            }
            if (reviewersRes.ok) {
                setReviewers(await reviewersRes.json());
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async () => {
        if (!selectedAppId || !selectedReviewerId) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/reviews/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    application_id: selectedAppId,
                    reviewer_id: selectedReviewerId,
                }),
            });

            if (res.ok) {
                alert("Reviewer assigned successfully");
                setIsDialogOpen(false);
                fetchData(); // Refresh data
            } else {
                alert("Failed to assign reviewer");
            }
        } catch (error) {
            console.error("Error assigning reviewer", error);
            alert("Error assigning reviewer");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No applications found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((app) => (
                                <div key={app.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">{app.course_name_zh}</p>
                                        <p className="text-sm text-muted-foreground">{app.course_name_en}</p>
                                        <p className="text-xs text-gray-400">Teacher ID: {app.teacher_id}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={
                                            app.status === 'SUBMITTED' ? 'default' :
                                                app.status === 'APPROVED' ? 'success' :
                                                    'secondary'
                                        }>
                                            {app.status}
                                        </Badge>
                                        <span className="text-sm text-gray-500">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </span>

                                        <Dialog open={isDialogOpen && selectedAppId === app.id} onOpenChange={(open) => {
                                            setIsDialogOpen(open);
                                            if (open) setSelectedAppId(app.id);
                                            else {
                                                setSelectedAppId(null);
                                                setSelectedReviewerId("");
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    Assign Reviewer
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Assign Reviewer</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Select Reviewer</label>
                                                        <Select onValueChange={setSelectedReviewerId}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a reviewer" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {reviewers.map((reviewer) => (
                                                                    <SelectItem key={reviewer.id} value={reviewer.id}>
                                                                        {reviewer.name} ({reviewer.email})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button onClick={handleAssign} disabled={!selectedReviewerId} className="w-full">
                                                        Confirm Assignment
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
