#!/bin/bash

# Create storage directory if it doesn't exist
if [ -n "$RENDER_STORAGE_PATH" ]; then
    mkdir -p $RENDER_STORAGE_PATH
    # Copy Excel file to storage if it doesn't exist
    if [ ! -f "$RENDER_STORAGE_PATH/sbilife.xlsx" ]; then
        cp sbilife.xlsx $RENDER_STORAGE_PATH/
    fi
fi

# Make Python file executable
chmod +x policypredict.py

# Start the application
node index.js
