# Agora Conversational AI Pricing Calculator

A comprehensive pricing calculator for Agora's Conversational AI services, enabling cost comparison across multiple providers and models for voice agents, speech recognition, language models, text-to-speech, and AI avatar services.

## Features

- **Multi-Service Support**: Calculate costs for 7 AI service types
  - Agent Voice ($0.0099/min)
  - Human Voice ($0.00099/min)
  - AI Noise Suppression ($0.00059/min)
  - Automatic Speech Recognition
  - Large Language Models
  - Text-to-Speech
  - AI Avatar

- **Provider Comparison**: Compare pricing across leading providers
  - ASR: Agora, Microsoft Azure, Deepgram
  - LLM: OpenAI, Microsoft Azure, Google Gemini, Anthropic Claude
  - TTS: Microsoft Azure, ElevenLabs, Cartesia, OpenAI, Hume AI
  - AI Avatar: Akool, HeyGen

- **Advanced Pricing Logic**:
  - Per-minute pricing for voice services
  - Token-based pricing for LLMs
  - Character-based pricing for TTS
  - Speech-to-speech all-inclusive models

- **Interactive Features**:
  - Real-time cost calculations
  - Detailed tooltips with pricing breakdowns
  - Export to Excel functionality
  - Responsive modern UI with glassmorphism design

## Live Demo

🌐 [https://sarthak1991.github.io/agorapricingcalculator](https://sarthak1991.github.io/agorapricingcalculator)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sarthakbatra/pricing_calculator_agora.git
cd pricing_calculator_agora/react-app

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Open your browser and navigate to the provided URL
# Typically: http://localhost:5173
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Select Services**: Choose from available AI service types
2. **Compare Providers**: Select different providers for each service
3. **Choose Models**: Pick specific models based on your needs
4. **View Costs**: See real-time pricing calculations
5. **Export Results**: Download detailed cost breakdowns to Excel

## Technology Stack

- **React 19.1.1** - Frontend framework
- **Vite 7.1.2** - Build tool and dev server
- **Recharts 3.2.0** - Data visualization
- **XLSX 0.18.5** - Excel export functionality
- **ESLint** - Code quality and linting

## Project Structure

```
react-app/
├── src/
│   ├── components/
│   │   ├── PricingCalculator.jsx    # Main calculator logic
│   │   └── PricingCalculator.css    # Calculator styles
│   ├── App.jsx                      # Application root component
│   ├── App.css                      # Application styles
│   └── main.jsx                     # React entry point
├── public/                          # Static assets
└── dist/                           # Build output
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support regarding Agora's AI services and pricing, visit [Agora Documentation](https://docs.agora.io/).

---

**Note**: This is an independent pricing calculator tool. For official Agora pricing, please refer to the [Agora website](https://www.agora.io/).
