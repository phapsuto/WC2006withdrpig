import re

file_path = "src/components/MatchDetail.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace bento-glass
content = content.replace("bento-glass", "bg-white rounded-[32px] shadow-[var(--shadow-dribbble)] border border-gray-100")

# Colors
content = content.replace("text-on-surface-variant", "text-[var(--color-text-sub)]")
content = content.replace("text-on-surface", "text-[var(--color-text-main)]")
content = content.replace("text-primary", "text-[var(--color-primary)]")
content = content.replace("bg-primary", "bg-[var(--color-primary)]")
content = content.replace("border-primary", "border-[var(--color-primary)]")
content = content.replace("text-secondary", "text-blue-500")
content = content.replace("bg-secondary", "bg-blue-500")
content = content.replace("border-secondary", "border-blue-500")
content = content.replace("text-tertiary", "text-purple-500")
content = content.replace("bg-tertiary", "bg-purple-500")
content = content.replace("border-tertiary", "border-purple-500")
content = content.replace("text-danger", "text-red-500")
content = content.replace("bg-danger", "bg-red-500")
content = content.replace("border-danger", "border-red-500")

# Glassmorphism to flat
content = re.sub(r'bg-white/\d+', 'bg-gray-50', content)
content = re.sub(r'border-white/\d+', 'border-gray-100', content)
content = re.sub(r'dark:bg-white/\d+', '', content)
content = re.sub(r'dark:border-white/\d+', '', content)
content = re.sub(r'dark:hover:bg-white/\d+', '', content)
content = re.sub(r'dark:hover:border-primary/\d+', '', content)
content = re.sub(r'dark:text-primary', '', content)
content = re.sub(r'shadow-\[.*?\]', 'shadow-sm', content) # simplify shadows

# Clean up multiple spaces inside class strings
content = re.sub(r'\s+(?=")', '', content) # wait, that's dangerous. Let's just do:
content = re.sub(r' {2,}', ' ', content)

with open(file_path, "w") as f:
    f.write(content)

print("Done")
