#!/bin/bash

# Build the extension
echo "Building Harmony VS Code Extension..."
pnpm build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful!"
    
    # Package the extension
    echo "Packaging extension..."
    pnpm package
    
    if [ $? -eq 0 ]; then
        echo "Extension packaged successfully!"
        echo "You can find the .vsix file in the current directory"
    else
        echo "Failed to package extension"
        exit 1
    fi
else
    echo "Build failed!"
    exit 1
fi 