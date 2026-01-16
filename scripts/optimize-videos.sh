#!/bin/bash

# Optimize all videos to small MP4 files
# Target: 480p, H.264, AAC, CRF 28

INPUT_DIR="videos"
OUTPUT_DIR="public/videos"

mkdir -p "$OUTPUT_DIR"

# Counter for naming
count=1

echo "Converting videos to optimized MP4..."
echo ""

for file in "$INPUT_DIR"/*.{mp4,mkv,webm}; do
    [ -e "$file" ] || continue

    # Get base name and create output filename
    basename=$(basename "$file")
    # Clean up filename - remove special chars, keep alphanumeric and hyphens
    cleanname=$(echo "$basename" | sed 's/[^a-zA-Z0-9.-]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
    # Remove original extension and add mp4
    cleanname="${cleanname%.*}.mp4"

    output="$OUTPUT_DIR/$cleanname"

    echo "[$count] Converting: $basename"
    echo "    Output: $cleanname"

    # Convert with ffmpeg
    # -vf scale: max 480p height, maintain aspect ratio
    # -c:v libx264: H.264 codec
    # -crf 28: good compression (higher = smaller file)
    # -preset slow: better compression
    # -c:a aac -b:a 96k: AAC audio at 96kbps
    # -movflags +faststart: web optimization
    ffmpeg -i "$file" \
        -vf "scale=-2:480" \
        -c:v libx264 \
        -crf 28 \
        -preset slow \
        -c:a aac \
        -b:a 96k \
        -movflags +faststart \
        -y \
        "$output" 2>/dev/null

    if [ $? -eq 0 ]; then
        # Get file sizes
        original_size=$(ls -lh "$file" | awk '{print $5}')
        new_size=$(ls -lh "$output" | awk '{print $5}')
        echo "    Done: $original_size -> $new_size"
    else
        echo "    FAILED!"
    fi

    echo ""
    ((count++))
done

echo "============================================"
echo "Conversion complete!"
echo ""
echo "Output files:"
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null
echo ""
echo "Total size:"
du -sh "$OUTPUT_DIR"
