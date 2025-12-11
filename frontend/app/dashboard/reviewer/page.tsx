"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Review {
    id: string;
    application_id: string;
    status: string;
    result: string | null;
    submitted_at: string | null;
}

export default function ReviewerDashboard() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("/api/reviews/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                }
            } catch (error) {
                console.error("Failed to fetch reviews", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Reviewer Dashboard</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Assigned Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No reviews assigned.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">Application ID: {review.application_id}</p>
                                        <p className="text-sm text-muted-foreground">Status: {review.status}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={review.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                            {review.status}
                                        </Badge>
                                        {review.status === 'PENDING' && (
                                            <Link href={`/dashboard/reviewer/review/${review.id}`}>
                                                <Button size="sm">
                                                    Start Review
                                                </Button>
                                            </Link>
                                        )}
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
