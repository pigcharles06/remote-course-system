"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    teacher_id: string;
    form_data: any;
}

interface Review {
    id: string;
    application_id: string;
    status: string;
    result: string | null;
    comments: string | null;
}

export default function ReviewForm() {
    const params = useParams();
    const router = useRouter();
    const reviewId = params.id as string;

    const [application, setApplication] = useState<Application | null>(null);
    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<string>("");
    const [comments, setComments] = useState<string>("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };

                // 1. Get Review Details
                // We need an endpoint to get a single review by ID.
                // For now, let's assume we can fetch it or filter from the list.
                // Actually, we should add a specific endpoint for this.
                // Let's implement the endpoint first.

                // Temporary: fetch all reviews and find the one.
                const reviewsRes = await fetch("/api/reviews/me", { headers });
                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json();
                    const currentReview = reviewsData.find((r: Review) => r.id === reviewId);
                    setReview(currentReview);

                    if (currentReview) {
                        // 2. Get Application Details
                        // We need an endpoint to get application details.
                        // We can reuse /api/applications/ but we might need to filter by ID.
                        // Or add /api/applications/{id}

                        // Let's assume we implement /api/applications/{id}
                        const appRes = await fetch(`/api/applications/${currentReview.application_id}`, { headers });
                        if (appRes.ok) {
                            setApplication(await appRes.json());
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [reviewId]);

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/reviews/${reviewId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    result,
                    comments,
                    status: "COMPLETED"
                }),
            });

            if (res.ok) {
                alert("Review submitted successfully");
                router.push("/dashboard/reviewer");
            } else {
                alert("Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review", error);
            alert("Error submitting review");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!review || !application) return <div>Review not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Review Application</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Application Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Course Name (ZH)</Label>
                            <div className="p-2 bg-gray-50 rounded">{application.course_name_zh}</div>
                        </div>
                        <div>
                            <Label>Course Name (EN)</Label>
                            <div className="p-2 bg-gray-50 rounded">{application.course_name_en}</div>
                        </div>
                        {/* Add more application details here */}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Result</Label>
                            <Select onValueChange={setResult}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select result" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PASSED">Passed</SelectItem>
                                    <SelectItem value="MODIFICATION_NEEDED">Modification Needed</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Comments</Label>
                            <Textarea
                                placeholder="Enter your comments here..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="min-h-[150px]"
                            />
                        </div>
                        <Button onClick={handleSubmit} className="w-full">
                            Submit Review
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
