# Fix checkbox onChange
import re

path = r'c:\Users\user\Desktop\ewant\映竹專案\remote_course_system\frontend\app\dashboard\teacher\applications\[id]\page.tsx'
content = open(path, 'r', encoding='utf-8').read()

# Add onChange to checkboxes that have checked but no onChange
content = re.sub(
    r'type="checkbox"([^>]*?)checked=',
    r'type="checkbox"\1onChange={handleChange} checked=',
    content
)

# Also add onChange to radio buttons with checked but no onChange
content = re.sub(
    r'type="radio"([^>]*?)checked=',
    r'type="radio"\1onChange={handleChange} checked=',
    content
)

open(path, 'w', encoding='utf-8').write(content)
print('Done fixing checkboxes and radios')
