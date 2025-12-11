# Create edit page by modifying apply page
import re

# Read the working apply page
apply_path = r'c:\Users\user\Desktop\ewant\映竹專案\remote_course_system\frontend\app\dashboard\teacher\apply\page.tsx'
content = open(apply_path, 'r', encoding='utf-8').read()

# 1. Change the component name
content = content.replace('export default function ApplyPage()', 'export default function EditApplicationPage()')

# 2. Add useParams import
content = content.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter, useParams } from "next/navigation";'
)

# 3. Add params after router
content = content.replace(
    'const router = useRouter();',
    '''const router = useRouter();
    const params = useParams();'''
)

# 4. Change title from 課程申請 to 編輯申請表單
content = content.replace('課程申請 (Apply for Course)', '編輯申請表單')

# 5. Add loading state and useEffect to load existing data (after formData useState)
# Find the pattern after formData's initial closing brace
old_pattern = '''copyright_declaration: false,
    });'''

new_pattern = '''copyright_declaration: false,
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load existing application data
    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const res = await fetch(`/api/applications/${params.id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (!res.ok) throw new Error("Failed to fetch application");
                const data = await res.json();
                if (data.form_data) {
                    setFormData(data.form_data);
                }
            } catch (error) {
                console.error("Error fetching application:", error);
                alert("Failed to load application data");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchApplication();
        }
    }, [params.id]);'''

content = content.replace(old_pattern, new_pattern)

# 6. Add useEffect import
content = content.replace(
    'import { useState } from "react";',
    'import { useState, useEffect } from "react";'
)

# 7. Change submit to update (PUT instead of POST)
# Find and replace the handleSubmit function's fetch call
content = content.replace(
    'const res = await fetch("/api/applications", {',
    '''// Update existing application
                const res = await fetch(`/api/applications/${params.id}`, {'''
)

content = content.replace(
    '''method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(formData)''',
    '''method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({ form_data: formData })'''
)

# 8. Change submit button text
content = content.replace('提交申請', '儲存修改')

# 9. Add loading check before render
content = content.replace(
    'return (',
    '''if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

    return ('''
)

# Save to the edit page location
edit_path = r'c:\Users\user\Desktop\ewant\映竹專案\remote_course_system\frontend\app\dashboard\teacher\applications\[id]\page.tsx'
open(edit_path, 'w', encoding='utf-8').write(content)

print('Created new edit page based on apply page')
