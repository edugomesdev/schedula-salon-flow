#!/bin/bash

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT" || exit 1

EXTENSIONS=("js" "ts" "jsx" "tsx" "py" "html" "css" "json" "md")
COMBINED_FILE="combined_code.md"
OUTPUT_PDF="project_code_export.pdf"

if ! command -v pandoc &> /dev/null; then
  echo "❌ 'pandoc' not found. Install it first."
  exit 1
fi

if ! command -v xelatex &> /dev/null; then
  echo "❌ 'xelatex' not found. Install it first."
  exit 1
fi

> "$COMBINED_FILE"

EXCLUDE_DIRS="-path ./node_modules -prune -o -path ./.git -prune -o -path ./dist -prune -o -path ./build -prune"

for ext in "${EXTENSIONS[@]}"; do
  echo "🔍 Collecting *.$ext files..."
  while IFS= read -r file; do
    [[ "$file" == *"$COMBINED_FILE"* ]] && continue
    echo "📄 Processing: $file"
    echo -e "\n\n# File: \`$file\`\n\n\`\`\`" >> "$COMBINED_FILE"
    cat "$file" >> "$COMBINED_FILE"
    echo -e "\n\`\`\`\n\n\\newpage\n" >> "$COMBINED_FILE"
  done < <(find . \( $EXCLUDE_DIRS \) -o -type f -name "*.$ext" -print)
done

# Disable syntax highlighting using `--no-highlight`
echo "📦 Generating PDF without syntax highlighting (for stability)..."
pandoc "$COMBINED_FILE" -o "$OUTPUT_PDF" --pdf-engine=xelatex --no-highlight

echo "✅ PDF saved as: $OUTPUT_PDF"
