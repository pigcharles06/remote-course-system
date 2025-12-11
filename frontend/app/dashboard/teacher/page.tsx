"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, Download, Loader2 } from "lucide-react";
import Link from "next/link";

interface Application {
    id: number;
    course_name_zh: string;
    course_name_en: string;
    status: string;
    created_at: string;
}

export default function TeacherDashboard() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [downloadLinks, setDownloadLinks] = useState<Record<number, { url: string; filename: string }>>({});

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("/api/applications/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setApplications(data);
                }
            } catch (error) {
                console.error("Failed to fetch applications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const totalApps = applications.length;
    const drafts = applications.filter(app => app.status === "draft").length;
    const underReview = applications.filter(app => app.status === "submitted").length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
                <Link href="/dashboard/teacher/apply">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Application
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalApps}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{drafts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{underReview}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No applications found. Create one to get started.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map((app) => (
                                <div key={app.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">{app.course_name_zh}</p>
                                        <p className="text-sm text-muted-foreground">{app.course_name_en}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Link href={`/dashboard/teacher/applications/${app.id}`}>
                                            <Button variant="outline" size="sm">View</Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={downloadingId === app.id}
                                            onClick={async () => {
                                                setDownloadingId(app.id);
                                                try {
                                                    const token = localStorage.getItem("token");

                                                    // Use longer timeout for batch processing
                                                    const controller = new AbortController();
                                                    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 min timeout

                                                    // Call API endpoint
                                                    const res = await fetch(`/api/applications/${app.id}/generate-upload`, {
                                                        method: 'POST',
                                                        headers: {
                                                            Authorization: `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                        },
                                                        signal: controller.signal
                                                    });
                                                    clearTimeout(timeoutId);

                                                    if (!res.ok) {
                                                        const error = await res.json();
                                                        throw new Error(error.detail || "Upload failed");
                                                    }

                                                    const result = await res.json();

                                                    // Save download link to state for display on page
                                                    if (result.downloadUrl) {
                                                        setDownloadLinks(prev => ({
                                                            ...prev,
                                                            [app.id]: {
                                                                url: result.downloadUrl,
                                                                filename: result.filename
                                                            }
                                                        }));
                                                    }
                                                } catch (error: unknown) {
                                                    console.error("Download error:", error);
                                                    if (error instanceof Error && error.name === 'AbortError') {
                                                        alert("下載逾時，請稍後再試。文件生成需要約2-4分鐘。");
                                                    } else {
                                                        alert("下載失敗，請查看後端日誌");
                                                    }
                                                } finally {
                                                    setDownloadingId(null);
                                                }
                                            }}
                                        >
                                            {downloadingId === app.id ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                    產生中...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Word
                                                </>
                                            )}
                                        </Button>
                                        {/* Show download link after generation */}
                                        {downloadLinks[app.id] && (
                                            <a
                                                href={downloadLinks[app.id].url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200 transition-colors"
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                下載: {downloadLinks[app.id].filename}
                                            </a>
                                        )}
                                        <span className={`px-2 py-1 rounded-full text-xs ${app.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                            app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {app.status.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </span>
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
