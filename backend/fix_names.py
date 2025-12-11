# Fix inputs to add proper name attributes
import re

path = r'c:\Users\user\Desktop\ewant\映竹專案\remote_course_system\frontend\app\dashboard\teacher\applications\[id]\page.tsx'
content = open(path, 'r', encoding='utf-8').read()

# Fix radio buttons for semester - add name="semester" and value
content = content.replace(
    '<input type="radio" onChange={handleChange} checked={formData.semester === sem}',
    '<input type="radio" name="semester" value={sem} onChange={handleChange} checked={formData.semester === sem}'
)

# Fix radio buttons for degree_level - add name and value
content = content.replace(
    '<input type="radio" onChange={handleChange} checked={formData.degree_level === level}',
    '<input type="radio" name="degree_level" value={level} onChange={handleChange} checked={formData.degree_level === level}'
)

content = content.replace(
    '<input type="radio" onChange={handleChange} checked={formData.degree_level === "學位學程"}',
    '<input type="radio" name="degree_level" value="學位學程" onChange={handleChange} checked={formData.degree_level === "學位學程"}'
)

# Fix radio buttons for degree_program_type - add name and value
content = content.replace(
    '<input type="radio" onChange={handleChange} checked={formData.degree_program_type === type}',
    '<input type="radio" name="degree_program_type" value={type} onChange={handleChange} checked={formData.degree_program_type === type}'
)

# Fix Inputs that are missing name attribute - add name based on value field
content = re.sub(
    r'<Input className="w-24" value=\{formData\.academic_year\}',
    '<Input className="w-24" name="academic_year" value={formData.academic_year}',
    content
)

content = re.sub(
    r'<Input value=\{formData\.main_department\}',
    '<Input name="main_department" value={formData.main_department}',
    content
)

content = re.sub(
    r'<Input value=\{formData\.co_department\}',
    '<Input name="co_department" value={formData.co_department}',
    content
)

# Generic fix: add name attribute to all Inputs that have value={formData.X} but no name
def add_name_to_input(match):
    field_name = match.group(1)
    return f'<Input name="{field_name}" value={{formData.{field_name}}}'

content = re.sub(
    r'<Input value=\{formData\.(\w+)\}',
    add_name_to_input,
    content
)

# Fix Textarea - add name attribute
def add_name_to_textarea(match):
    field_name = match.group(1)
    return f'<Textarea name="{field_name}" value={{formData.{field_name}}}'

content = re.sub(
    r'<Textarea value=\{formData\.(\w+)\}',
    add_name_to_textarea,
    content
)

open(path, 'w', encoding='utf-8').write(content)
print('Done fixing name attributes')
