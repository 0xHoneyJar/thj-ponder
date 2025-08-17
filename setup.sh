#!/bin/bash

echo "🍯 THJ Ponder Setup Script"
echo "========================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update .env with your configuration:"
echo "   - Add HJ1 contract address"
echo "   - Add deployment block number"
echo "   - Add RPC URL (if not using default)"
echo ""
echo "2. Update the ABI in abis/HoneyJar1.ts"
echo ""
echo "3. Start the development server:"
echo "   pnpm dev"
echo ""
echo "4. Access the API:"
echo "   http://localhost:42069/api/stats"
echo ""
echo "Happy indexing! 🚀"