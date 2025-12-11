"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Plus, Trash2 } from "lucide-react";

export default function CreateApplicationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        // Page 1: Basic Info A
        academic_year: "",
        semester: "",
        main_department: "",
        co_department: "",
        degree_level: "", // Changed to string for single selection
        degree_level_other: "",
        degree_program_type: "", // New field for "學位學程" sub-selection
        subject_type: "",
        subject_type_other: "",
        course_name_zh: "",
        course_name_en: "",
        teacher_name: "",

        // Page 1: Basic Info B
        permanent_course_id: "",
        credits: "",
        course_type: "",
        course_type_other: "",
        class_count: "",
        student_count: "",
        language: "",
        subtitles: "",
        platform: [] as string[],
        platform_other: "",

        // 2. External Participation
        external_participation: "",
        external_school_name: "",
        external_department: "",

        // 2. International Collaboration
        international_collaboration_school_dept: "",
        international_collaboration_type: [] as string[],
        international_collaboration_other: "",

        review_category: "",

        // 3. Past Async Materials
        past_async_materials_type: [] as string[],
        past_async_materials_e3_id: "",
        past_async_materials_link: "",
        past_async_materials_other: "",

        // Page 2: Teaching Method Table (Moved to Step 3)
        teaching_method_async_weeks: "",
        teaching_method_async_hours: "",
        teaching_method_sync_weeks: "",
        teaching_method_sync_hours: "",
        teaching_method_physical_weeks: "",
        teaching_method_physical_hours: "",
        teaching_method_other_weeks: "",
        teaching_method_other_hours: "",
        teaching_method_other_description: "",
        teaching_method_total_weeks: "",

        // Page 2: Course Details
        teaching_objectives: "",

        // 6. Textbooks & References
        textbooks: "",
        handouts: "",
        reference_materials: "",
        related_websites: "",

        // Page 3: Course Outline Table (Complex)
        course_outline_weeks: [] as {
            week: number;
            content: string;
            has_activity: boolean;
            activity_description: string;
            hours_physical: string;
            hours_async: string;
            hours_sync: string;
            note: string;
        }[],

        // Page 4: Activities & Interaction
        teaching_activities: [] as string[],
        teaching_activities_other: "",
        e3_functions: [] as string[],
        e3_functions_other: "",

        // Interaction (Checkbox + Count)
        interaction_sync_checked: false,
        interaction_sync_count: "",
        interaction_physical_checked: false,
        interaction_physical_count: "",
        interaction_async_checked: false,
        interaction_async_count: "",
        interaction_other_checked: false,
        interaction_other_description: "",

        assignment_submission: [] as string[],
        assignment_submission_other: "",

        // Page 5: Grading (Complex Table)
        grading_criteria: [] as { category: string; percentage: string; description: string; ref_calculation: string }[],
        async_check: "",

        // Page 5: Support (Refined)
        teacher_office_info: "",
        teacher_email: "",
        teacher_office_location: "",
        ta_name: "",
        ta_email: "",
        ta_consult_time: "",
        office_hour: "",
        office_hour_reservation: false,
        support_other: "",

        // Page 6: Final
        notes: "",
        paper_delivery: "",
        electronic_delivery: "",
        copyright_declaration: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            if (name === 'teaching_activities' || name === 'e3_functions' || name === 'assignment_submission' || name === 'international_collaboration_type' || name === 'past_async_materials_type' || name === 'platform') {
                setFormData(prev => {
                    const currentArray = prev[name as keyof typeof prev] as string[];
                    if (checked) {
                        return { ...prev, [name]: [...currentArray, value] };
                    } else {
                        return { ...prev, [name]: currentArray.filter(item => item !== value) };
                    }
                });
            } else if (name.startsWith('interaction_') && name.endsWith('_checked')) {
                setFormData(prev => ({ ...prev, [name]: checked }));
            } else if (name === 'copyright_declaration' || name === 'office_hour_reservation') {
                setFormData(prev => ({ ...prev, [name]: checked }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Course Outline Table Handlers
    const addOutlineRow = () => {
        setFormData(prev => ({
            ...prev,
            course_outline_weeks: [...prev.course_outline_weeks, {
                week: prev.course_outline_weeks.length + 1,
                content: "",
                has_activity: false,
                activity_description: "",
                hours_physical: "",
                hours_async: "",
                hours_sync: "",
                note: ""
            }]
        }));
    };

    const removeOutlineRow = (index: number) => {
        const newWeeks = formData.course_outline_weeks.filter((_, i) => i !== index);
        const reindexed = newWeeks.map((item, i) => ({ ...item, week: i + 1 }));
        setFormData(prev => ({ ...prev, course_outline_weeks: reindexed }));
    };

    const handleOutlineChange = (index: number, field: string, value: any) => {
        const newWeeks = [...formData.course_outline_weeks];
        newWeeks[index] = { ...newWeeks[index], [field]: value };
        setFormData(prev => ({ ...prev, course_outline_weeks: newWeeks }));
    };

    // Grading Table Handlers
    const addGradingRow = () => {
        setFormData(prev => ({
            ...prev,
            grading_criteria: [...prev.grading_criteria, { category: "", percentage: "", description: "", ref_calculation: "" }]
        }));
    };

    const removeGradingRow = (index: number) => {
        const newGrading = formData.grading_criteria.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, grading_criteria: newGrading }));
    };

    const handleGradingChange = (index: number, field: string, value: string) => {
        const newGrading = [...formData.grading_criteria];
        newGrading[index] = { ...newGrading[index], [field]: value };
        setFormData(prev => ({ ...prev, grading_criteria: newGrading }));
    };

    const handleSubmit = async () => {
        try {
            const res = await fetch("/api/applications/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    course_name_zh: formData.course_name_zh,
                    course_name_en: formData.course_name_en,
                    permanent_course_id: formData.permanent_course_id,
                    is_moe_certified: formData.review_category.includes("教育部"),
                    form_data: formData,
                    video_links: { url: "" },
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to submit: ${res.status} ${errorText}`);
            }

            router.push("/dashboard/teacher");
        } catch (error) {
            console.error("Full error:", error);
            alert("Failed to submit application. Check console for details.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">New Course Application (遠距教學課程申請)</h1>
                <span className="text-sm text-gray-500">Step {step} of 6</span>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Step 1: Basic Info A (基本資料 A)"}
                        {step === 2 && "Step 2: Basic Info B (基本資料 B)"}
                        {step === 3 && "Step 3: Course Details & Method (課程計畫與授課方式)"}
                        {step === 4 && "Step 4: Activities & Interaction (教學活動與互動)"}
                        {step === 5 && "Step 5: Grading & Support (評量與輔導)"}
                        {step === 6 && "Step 6: Final Review (簽核與送件)"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Step 1: Basic Info A */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>開課學期 (Semester)</Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2"><Input name="academic_year" className="w-24" placeholder="114" value={formData.academic_year} onChange={handleChange} /><span>學年度</span></div>
                                    {["上學期", "下學期", "暑期", "寒假"].map(sem => (
                                        <label key={sem} className="flex items-center gap-2"><input type="radio" name="semester" value={sem} checked={formData.semester === sem} onChange={handleChange} />{sem}</label>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>主開系所</Label><Input name="main_department" value={formData.main_department} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>輔開系所</Label><Input name="co_department" value={formData.co_department} onChange={handleChange} /></div>
                            </div>
                            <div className="space-y-2">
                                <Label>課程學制 (單選)</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["學士班", "學士後專班", "碩士班", "碩士在職專班", "博士班"].map(level => (
                                        <label key={level} className="flex items-center gap-2">
                                            <input type="radio" name="degree_level" value={level} checked={formData.degree_level === level} onChange={handleChange} />
                                            {level}
                                        </label>
                                    ))}

                                    <div className="col-span-3 flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="degree_level" value="學位學程" checked={formData.degree_level === "學位學程"} onChange={handleChange} />
                                            學位學程
                                        </label>
                                        <div className="flex gap-4 ml-4">
                                            {["四年制", "碩士班", "博士班"].map(type => (
                                                <label key={type} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <input type="radio" name="degree_program_type" value={type} checked={formData.degree_program_type === type} onChange={handleChange} disabled={formData.degree_level !== "學位學程"} />
                                                    {type}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="degree_level" value="學分學程" checked={formData.degree_level === "學分學程"} onChange={handleChange} />
                                        學分學程
                                    </label>

                                    <label className="flex items-center gap-2 col-span-2">
                                        <input type="radio" name="degree_level" value="其他教學單位" checked={formData.degree_level === "其他教學單位"} onChange={handleChange} />
                                        其他教學單位
                                        <Input name="degree_level_other" placeholder="請說明" className="w-48 h-8" value={formData.degree_level_other} onChange={handleChange} disabled={formData.degree_level !== "其他教學單位"} />
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>科目類別</Label>
                                <div className="flex flex-wrap gap-4">
                                    {["共同科目", "專業科目", "教育科目"].map(type => (
                                        <label key={type} className="flex items-center gap-2">
                                            <input type="radio" name="subject_type" value={type} checked={formData.subject_type === type} onChange={handleChange} />
                                            {type}
                                        </label>
                                    ))}
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="subject_type" value="其他" checked={formData.subject_type === "其他"} onChange={handleChange} />
                                        其他
                                        <Input name="subject_type_other" placeholder="說明" className="w-32 h-8" value={formData.subject_type_other} onChange={handleChange} disabled={formData.subject_type !== "其他"} />
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>課程名稱 (中文)</Label><Input name="course_name_zh" value={formData.course_name_zh} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>Course Name (English)</Label><Input name="course_name_en" value={formData.course_name_en} onChange={handleChange} /></div>
                            </div>
                            <div className="space-y-2">
                                <Label>授課教師姓名及職稱</Label>
                                <div className="text-xs text-red-600 font-bold">※若欲申請教育部數位學習課程認證，請注意至多為四位教師開課。</div>
                                <Input name="teacher_name" value={formData.teacher_name} onChange={handleChange} placeholder="姓名 / 職稱" />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Basic Info B */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>永久課號</Label><Input name="permanent_course_id" value={formData.permanent_course_id} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>學分數</Label><Input name="credits" value={formData.credits} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>選課別</Label><div className="flex gap-2 pt-2">{["必修", "選修", "其他"].map(t => (<label key={t} className="flex items-center gap-1"><input type="radio" name="course_type" value={t} checked={formData.course_type === t} onChange={handleChange} />{t}</label>))}</div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>開課班級數</Label><Input name="class_count" value={formData.class_count} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>預計總修課人數</Label><Input name="student_count" value={formData.student_count} onChange={handleChange} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>全英語教學</Label><div className="flex gap-4 pt-2"><label className="flex items-center gap-2"><input type="radio" name="language" value="是" checked={formData.language === "是"} onChange={handleChange} />是</label><label className="flex items-center gap-2"><input type="radio" name="language" value="否" checked={formData.language === "否"} onChange={handleChange} />否</label></div></div>
                                <div className="space-y-2"><Label>課程字幕</Label><div className="flex gap-4 pt-2"><label className="flex items-center gap-2"><input type="radio" name="subtitles" value="有字幕" checked={formData.subtitles === "有字幕"} onChange={handleChange} />有字幕</label><label className="flex items-center gap-2"><input type="radio" name="subtitles" value="無字幕" checked={formData.subtitles === "無字幕"} onChange={handleChange} />無字幕</label></div></div>
                            </div>
                            <div className="space-y-2"><Label>課程平臺網址</Label><div className="flex gap-4 pt-2"><label className="flex items-center gap-2"><input type="checkbox" name="platform" value="E3" checked={formData.platform.includes("E3")} onChange={handleChange} />E3</label><label className="flex items-center gap-2"><input type="checkbox" name="platform" value="其他" checked={formData.platform.includes("其他")} onChange={handleChange} />其他</label><Input name="platform_other" placeholder="網址" className="w-64" value={formData.platform_other} onChange={handleChange} /></div></div>

                            <div className="space-y-2 p-4 border rounded bg-gray-50">
                                <Label>本校主播而外校收播情形 (無則免填)</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <Input name="external_school_name" placeholder="外校名稱" value={formData.external_school_name} onChange={handleChange} />
                                    <Input name="external_department" placeholder="外校系所" value={formData.external_department} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-2 p-4 border rounded bg-gray-50">
                                <Label>與國外學校有合作遠距課程 (無則免填)</Label>
                                <Input name="international_collaboration_school_dept" placeholder="國外合作學校與系所名稱" value={formData.international_collaboration_school_dept} onChange={handleChange} className="mb-2" />
                                <div className="flex gap-4 flex-wrap">
                                    {["國內主播", "境外專班", "雙聯學制"].map(item => (
                                        <label key={item} className="flex items-center gap-2"><input type="checkbox" name="international_collaboration_type" value={item} checked={formData.international_collaboration_type.includes(item)} onChange={handleChange} />{item}</label>
                                    ))}
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="international_collaboration_type" value="其他" checked={formData.international_collaboration_type.includes("其他")} onChange={handleChange} />
                                        其他
                                        <Input name="international_collaboration_other" className="w-32 h-6 text-xs" value={formData.international_collaboration_other} onChange={handleChange} disabled={!formData.international_collaboration_type.includes("其他")} />
                                    </label>
                                </div>
                            </div>

                            {/* 1. Review Category Refinement */}
                            <div className="space-y-2">
                                <Label>申請審查類別</Label>
                                <div className="text-xs text-red-600 font-bold">※提醒：單純跨校區連線不屬本校遠距課程之定義範圍</div>
                                <div className="space-y-2 pt-2">
                                    <label className="flex items-center gap-2"><input type="radio" name="review_category" value="校內遠距課程審查" checked={formData.review_category === "校內遠距課程審查"} onChange={handleChange} />校內遠距課程審查</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="review_category" value="教育部數位學習課程認證" checked={formData.review_category === "教育部數位學習課程認證"} onChange={handleChange} />欲申請教育部數位學習課程認證（須填寫附件－教育部課程認證初評表）</label>
                                </div>
                            </div>

                            <div className="space-y-2 p-4 border rounded bg-gray-50">
                                <Label>過去非同步授課相關成果資料 (如教材、作業、師生互動紀錄等)</Label>
                                <div className="space-y-2 mt-2">
                                    <label className="flex items-center gap-2"><input type="checkbox" name="past_async_materials_type" value="首次開課" checked={formData.past_async_materials_type.includes("首次開課")} onChange={handleChange} />首次開課，尚無相關成果資料/為同步課程毋須繳交</label>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="past_async_materials_type" value="E3" checked={formData.past_async_materials_type.includes("E3")} onChange={handleChange} />
                                        E3平台，前次開課課號：
                                        <Input name="past_async_materials_e3_id" className="w-32 h-6" value={formData.past_async_materials_e3_id} onChange={handleChange} disabled={!formData.past_async_materials_type.includes("E3")} />
                                        (優先建議)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="past_async_materials_type" value="雲端" checked={formData.past_async_materials_type.includes("雲端")} onChange={handleChange} />
                                        雲端連結：
                                        <Input name="past_async_materials_link" className="w-64 h-6" value={formData.past_async_materials_link} onChange={handleChange} disabled={!formData.past_async_materials_type.includes("雲端")} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="past_async_materials_type" value="其他" checked={formData.past_async_materials_type.includes("其他")} onChange={handleChange} />
                                        其他：
                                        <Input name="past_async_materials_other" className="w-64 h-6" value={formData.past_async_materials_other} onChange={handleChange} disabled={!formData.past_async_materials_type.includes("其他")} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Course Details & Method */}
                    {step === 3 && (
                        <div className="space-y-6">
                            {/* 2. Teaching Method Refinement */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center"><Label>授課方式 (Teaching Method)</Label><div className="flex items-center gap-2 text-sm">總計 <Input name="teaching_method_total_weeks" className="w-16 h-8" value={formData.teaching_method_total_weeks} onChange={handleChange} /> 週</div></div>
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2 space-y-1">
                                    <p className="font-bold">※請注意：</p>
                                    <p>遠距(同步及非同步)授課時數超過總授課時數二分之一。</p>
                                    <p>若欲申請教育部數位學習課程認證，1/2以上週次須採非同步遠距教學，1/6以上週次須採同步教學，以16週為例，非同步須≧ 8週，同步須≧ 3週。</p>
                                </div>
                                <table className="w-full text-sm text-left border rounded-md">
                                    <thead className="bg-gray-100"><tr><th className="p-2">授課方式</th><th className="p-2 w-24">週數</th><th className="p-2 w-24">總時數</th></tr></thead>
                                    <tbody>
                                        <tr className="border-t"><td className="p-2">非同步遠距教學</td><td className="p-2"><Input name="teaching_method_async_weeks" value={formData.teaching_method_async_weeks} onChange={handleChange} /></td><td className="p-2"><Input name="teaching_method_async_hours" value={formData.teaching_method_async_hours} onChange={handleChange} /></td></tr>
                                        <tr className="border-t"><td className="p-2">同步遠距教學</td><td className="p-2"><Input name="teaching_method_sync_weeks" value={formData.teaching_method_sync_weeks} onChange={handleChange} /></td><td className="p-2"><Input name="teaching_method_sync_hours" value={formData.teaching_method_sync_hours} onChange={handleChange} /></td></tr>
                                        <tr className="border-t"><td className="p-2">面授</td><td className="p-2"><Input name="teaching_method_physical_weeks" value={formData.teaching_method_physical_weeks} onChange={handleChange} /></td><td className="p-2"><Input name="teaching_method_physical_hours" value={formData.teaching_method_physical_hours} onChange={handleChange} /></td></tr>
                                        <tr className="border-t">
                                            <td className="p-2 flex items-center gap-2">
                                                其他 (如國定假日)
                                                <Input name="teaching_method_other_description" className="w-32 h-6 text-xs" placeholder="請說明" value={formData.teaching_method_other_description} onChange={handleChange} />
                                            </td>
                                            <td className="p-2"><Input name="teaching_method_other_weeks" value={formData.teaching_method_other_weeks} onChange={handleChange} /></td>
                                            <td className="p-2"><Input name="teaching_method_other_hours" value={formData.teaching_method_other_hours} onChange={handleChange} /></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-2"><Label>教學目標</Label><Textarea name="teaching_objectives" value={formData.teaching_objectives} onChange={handleChange} rows={4} /></div>

                            {/* 3. Course Outline Refinement */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center"><Label>課程內容大綱 (Course Outline)</Label><Button onClick={addOutlineRow} size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Week</Button></div>
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
                                    <span className="font-bold">※請注意：</span>非同步遠距週次請提供影音教材MP4檔案，申請校內遠距課程審查者若影片時長小於非同步遠距授課時數，請補充說明搭配的教學活動與時數規劃，並提供相關附件或佐證資料。
                                </div>
                                <div className="border rounded-md overflow-x-auto">
                                    <table className="w-full text-sm text-left min-w-[800px]">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 w-16">週次</th>
                                                <th className="p-2">授課內容 (含作業/測驗/討論)</th>
                                                <th className="p-2 w-20">面授時數</th>
                                                <th className="p-2 w-20">非同步</th>
                                                <th className="p-2 w-20">同步</th>
                                                <th className="p-2">備註</th>
                                                <th className="p-2 w-16">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.course_outline_weeks.map((row, index) => (
                                                <tr key={index} className="border-t align-top">
                                                    <td className="p-2 text-center pt-4">{row.week}</td>
                                                    <td className="p-2 space-y-2">
                                                        <Textarea value={row.content} onChange={(e) => handleOutlineChange(index, 'content', e.target.value)} placeholder="Topic..." rows={2} />
                                                        <div className="flex items-start gap-2 text-xs bg-gray-50 p-2 rounded">
                                                            <span className="font-medium whitespace-nowrap">作業/測驗/討論：</span>
                                                            <div className="space-y-1 w-full">
                                                                <div className="flex gap-4">
                                                                    <label className="flex items-center gap-1"><input type="radio" checked={!row.has_activity} onChange={() => handleOutlineChange(index, 'has_activity', false)} />無</label>
                                                                    <label className="flex items-center gap-1"><input type="radio" checked={row.has_activity} onChange={() => handleOutlineChange(index, 'has_activity', true)} />有 (下方簡述)</label>
                                                                </div>
                                                                {row.has_activity && (
                                                                    <Input size={20} className="h-6 text-xs" placeholder="簡述..." value={row.activity_description} onChange={(e) => handleOutlineChange(index, 'activity_description', e.target.value)} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 pt-4"><Input className="h-8" value={row.hours_physical} onChange={(e) => handleOutlineChange(index, 'hours_physical', e.target.value)} /></td>
                                                    <td className="p-2 pt-4"><Input className="h-8" value={row.hours_async} onChange={(e) => handleOutlineChange(index, 'hours_async', e.target.value)} /></td>
                                                    <td className="p-2 pt-4"><Input className="h-8" value={row.hours_sync} onChange={(e) => handleOutlineChange(index, 'hours_sync', e.target.value)} /></td>
                                                    <td className="p-2 pt-4"><Input className="h-8" value={row.note} onChange={(e) => handleOutlineChange(index, 'note', e.target.value)} /></td>
                                                    <td className="p-2 text-center pt-4"><Button variant="ghost" size="icon" onClick={() => removeOutlineRow(index)}><Trash2 className="w-4 h-4" /></Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>教科書及參考書資料</Label>
                                <div className="space-y-2 pl-4 border-l-2">
                                    <div className="space-y-1"><Label className="text-xs">1. 教科書</Label><Textarea name="textbooks" value={formData.textbooks} onChange={handleChange} rows={2} /></div>
                                    <div className="space-y-1"><Label className="text-xs">2. 講義</Label><Textarea name="handouts" value={formData.handouts} onChange={handleChange} rows={2} /></div>
                                    <div className="space-y-1"><Label className="text-xs">3. 參考資料</Label><Textarea name="reference_materials" value={formData.reference_materials} onChange={handleChange} rows={2} /></div>
                                    <div className="space-y-1"><Label className="text-xs">4. 相關網站</Label><Textarea name="related_websites" value={formData.related_websites} onChange={handleChange} rows={2} /></div>
                                </div>
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                    ※請注意︰教師授課使用之教材，不得非法重製，並應遵守著作財產權之相關規定，如有涉及犯罪或侵權行為應負相關法律責任。建議老師參考主管機關之教師授課著作權錦囊(連結經濟部智慧財產局)
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Activities & Interaction */}
                    {step === 4 && (
                        <div className="space-y-6">
                            {/* 4. Activities Refinement */}
                            <div className="space-y-2">
                                <Label>教學活動 (可複選)</Label>
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2 space-y-1">
                                    <p className="font-bold">※請注意：</p>
                                    <p>整門課須使用三種(含)以上教學活動。</p>
                                    <p>若欲申請教育部數位課程認證，則須使用五種以上教學活動，並須包含一種以上的合作學習策略(如C、F、I)。</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {["A.講述", "B.學習指引", "C.分組報告", "D.個人報告", "E.議題討論", "F.分組討論", "G.示範操作", "H.練習測驗", "I.同儕互評", "J.實例分享", "K.課堂作業", "L.課後作業"].map(item => (
                                        <label key={item} className="flex items-center gap-2"><input type="checkbox" name="teaching_activities" value={item} checked={formData.teaching_activities.includes(item)} onChange={handleChange} />{item}</label>
                                    ))}
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="teaching_activities" value="M.其他" checked={formData.teaching_activities.includes("M.其他")} onChange={handleChange} />
                                        M.其他
                                        <Input name="teaching_activities_other" className="w-32 h-6 text-xs" value={formData.teaching_activities_other} onChange={handleChange} disabled={!formData.teaching_activities.includes("M.其他")} />
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>於E3會使用之功能 (可複選)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["最新消息發佈", "教材內容設計", "成績系統管理", "線上測驗", "學習資訊", "互動式學習設計", "各種教學活動"].map(item => (
                                        <label key={item} className="flex items-center gap-2"><input type="checkbox" name="e3_functions" value={item} checked={formData.e3_functions.includes(item)} onChange={handleChange} />{item}</label>
                                    ))}
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="e3_functions" value="其他" checked={formData.e3_functions.includes("其他")} onChange={handleChange} />
                                        其他相關功能
                                        <Input name="e3_functions_other" className="w-48 h-6 text-xs" placeholder="請說明" value={formData.e3_functions_other} onChange={handleChange} disabled={!formData.e3_functions.includes("其他")} />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>師生互動方式 (可複選)</Label>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="interaction_sync_checked" checked={formData.interaction_sync_checked} onChange={handleChange} className="w-4 h-4" />
                                        <span>同步遠距討論：</span>
                                        <Input name="interaction_sync_count" className="w-20 h-8" value={formData.interaction_sync_count} onChange={handleChange} disabled={!formData.interaction_sync_checked} />
                                        <span>次</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="interaction_physical_checked" checked={formData.interaction_physical_checked} onChange={handleChange} className="w-4 h-4" />
                                        <span>實體討論：</span>
                                        <Input name="interaction_physical_count" className="w-20 h-8" value={formData.interaction_physical_count} onChange={handleChange} disabled={!formData.interaction_physical_checked} />
                                        <span>次</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="interaction_async_checked" checked={formData.interaction_async_checked} onChange={handleChange} className="w-4 h-4" />
                                        <span>非同步討論：</span>
                                        <Input name="interaction_async_count" className="w-20 h-8" value={formData.interaction_async_count} onChange={handleChange} disabled={!formData.interaction_async_checked} />
                                        <span>次</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="interaction_other_checked" checked={formData.interaction_other_checked} onChange={handleChange} className="w-4 h-4" />
                                        <span>其他：</span>
                                        <Input name="interaction_other_description" className="w-40 h-8" value={formData.interaction_other_description} onChange={handleChange} disabled={!formData.interaction_other_checked} placeholder="請說明" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>作業繳交方式 (可複選)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["線上說明作業", "線上即時作業", "作業檔案上傳", "線上測驗", "成績查詢"].map(item => (
                                        <label key={item} className="flex items-center gap-2"><input type="checkbox" name="assignment_submission" value={item} checked={formData.assignment_submission.includes(item)} onChange={handleChange} />{item}</label>
                                    ))}
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" name="assignment_submission" value="其他" checked={formData.assignment_submission.includes("其他")} onChange={handleChange} />
                                        其他
                                        <Input name="assignment_submission_other" className="w-48 h-6 text-xs" placeholder="請說明" value={formData.assignment_submission_other} onChange={handleChange} disabled={!formData.assignment_submission.includes("其他")} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Grading & Support */}
                    {step === 5 && (
                        <div className="space-y-6">
                            {/* 5. Grading Refinement */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center"><Label>成績評量方式 (Grading)</Label><Button onClick={addGradingRow} size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add</Button></div>
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
                                    <span className="font-bold">※請注意：</span>若欲申請教育部數位學習課程認證，教師應用五種以上學習歷程紀錄做為評量依據。
                                </div>
                                <table className="w-full text-sm text-left border rounded-md">
                                    <thead className="bg-gray-100"><tr><th className="p-2">類別 (Category)</th><th className="p-2 w-24">百分比</th><th className="p-2">說明 (Description)</th><th className="p-2">計分參考 (Ref)</th><th className="p-2 w-16">Action</th></tr></thead>
                                    <tbody>
                                        {formData.grading_criteria.map((row, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="p-2"><Input value={row.category} onChange={(e) => handleGradingChange(index, 'category', e.target.value)} placeholder="e.g. 作業" /></td>
                                                <td className="p-2"><Input value={row.percentage} onChange={(e) => handleGradingChange(index, 'percentage', e.target.value)} placeholder="%" /></td>
                                                <td className="p-2"><Input value={row.description} onChange={(e) => handleGradingChange(index, 'description', e.target.value)} placeholder="說明" /></td>
                                                <td className="p-2"><Input value={row.ref_calculation} onChange={(e) => handleGradingChange(index, 'ref_calculation', e.target.value)} placeholder="計分參考" /></td>
                                                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => removeGradingRow(index)}><Trash2 className="w-4 h-4" /></Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 6. Async Check Refinement */}
                            <div className="space-y-2">
                                <Label>非同步遠距教學週數檢核方式</Label>
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
                                    <span className="font-bold">※請注意：</span>提醒師長如有非同步遠距教學週數，須設計足量學習成效的檢核方式，敬請師長擇一審查標準，學習活動納入成績評量占比才列計（單純同步遠距課程不須擇定）
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2"><input type="radio" name="async_check" value="1/3作業+1/3討論" checked={formData.async_check === "1/3作業+1/3討論"} onChange={handleChange} />三分之一非同步週數有作業或評量，且三分之一非同步週數有主題式討論</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="async_check" value="1/2作業" checked={formData.async_check === "1/2作業"} onChange={handleChange} />二分之一非同步週數有作業或評量</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="async_check" value="1/2討論" checked={formData.async_check === "1/2討論"} onChange={handleChange} />二分之一非同步週數有主題式討論</label>
                                </div>
                            </div>

                            {/* 7. Support Refinement */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-medium">課業輔導措施</h3>
                                <div className="space-y-2">
                                    <Label>1. 授課教師</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input name="teacher_name" placeholder="姓名" value={formData.teacher_name} onChange={handleChange} />
                                        <Input name="teacher_email" placeholder="Email" value={formData.teacher_email} onChange={handleChange} />
                                        <Input name="teacher_office_location" placeholder="辦公室位置" value={formData.teacher_office_location} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>2. 教學助理</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input name="ta_name" placeholder="姓名" value={formData.ta_name} onChange={handleChange} />
                                        <Input name="ta_email" placeholder="Email" value={formData.ta_email} onChange={handleChange} />
                                        <Input name="ta_consult_time" placeholder="可諮詢時間" value={formData.ta_consult_time} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>3. 線上辦公室時間</Label>
                                    <div className="flex items-center gap-4">
                                        <Input name="office_hour" placeholder="(例) 每周二 18:00-19:00" className="flex-1" value={formData.office_hour} onChange={handleChange} />
                                        <label className="flex items-center gap-2 whitespace-nowrap">
                                            <input type="checkbox" name="office_hour_reservation" checked={formData.office_hour_reservation} onChange={handleChange} />
                                            預約制
                                        </label>
                                    </div>
                                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1">
                                        <span className="font-bold">※請注意：</span>全程非同步課程為保障教師可近性與學生學習權益，來年再次開設時，如曾有學生使用 Office hour，請檢附師生線上互動紀錄或截圖，以供審查。
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>4. 其他</Label>
                                    <Input name="support_other" placeholder="可自行增列" value={formData.support_other} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Final Review */}
                    {step === 6 && (
                        <div className="space-y-6">
                            <div className="space-y-2"><Label>上課注意事項</Label><Textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>紙本請送達</Label><Input name="paper_delivery" value={formData.paper_delivery} onChange={handleChange} /></div>
                                <div className="space-y-2"><Label>電子檔請寄至</Label><Input name="electronic_delivery" value={formData.electronic_delivery} onChange={handleChange} /></div>
                            </div>
                            <div className="pt-4 border-t">
                                <label className="flex items-start gap-2 p-4 border rounded-md bg-gray-50">
                                    <input type="checkbox" name="copyright_declaration" checked={formData.copyright_declaration} onChange={handleChange} className="mt-1" />
                                    <span className="text-sm">本人聲明本課程使用之教材均符合著作權法及相關規定，如有引用他人著作，均已取得授權。</span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>Previous</Button>
                        {step < 6 ? <Button onClick={() => setStep(s => Math.min(6, s + 1))}>Next</Button> : <Button onClick={handleSubmit} disabled={!formData.copyright_declaration}>Submit Application</Button>}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
