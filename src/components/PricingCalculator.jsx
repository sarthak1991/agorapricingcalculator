import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const COLORS = {
    agent_session: { name: 'purple', hex: '#9333ea' },
    asr: { name: 'cyan', hex: '#00d9ff' },
    llm: { name: 'yellow', hex: '#ffd700' },
    tts: { name: 'green', hex: '#00ff88' },
    ai_avatar: { name: 'orange', hex: '#ff6b35' }
};

const PROVIDERS = {
    agent_session: {
        providers: [
            {
                id: 'audio-basic-task',
                name: 'Audio Basic Task',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per min',
                        unitPrice: 0.0099,
                        notes: 'Audio Basic Task pricing'
                    }
                ]
            }
        ]
    },
    asr: {
        providers: [
            {
                id: 'ares-agora',
                name: 'ARES(Agora)',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per min',
                        unitPrice: 0.0166,
                        notes: 'Agora built-in ASR (only the ASR component cost)'
                    }
                ]
            },
            {
                id: 'microsoft-azure-asr',
                name: 'Microsoft Azure ASR',
                models: [
                    {
                        id: 'standard-payg',
                        name: 'Standard (Pay-as-you-go)',
                        pricingUnit: 'per min',
                        unitPrice: 0.013,
                        notes: 'Approx. $0.96–0.78/hour → $0.016–0.013 per minute'
                    }
                ]
            },
            {
                id: 'deepgram-asr',
                name: 'Deepgram ASR',
                models: [
                    {
                        id: 'nova-2-streaming',
                        name: 'Nova-2 (Streaming)',
                        pricingUnit: 'per min',
                        unitPrice: 0.0058,
                        notes: 'Entry-level Nova model'
                    },
                    {
                        id: 'nova-3-streaming',
                        name: 'Nova-3 (Streaming)',
                        pricingUnit: 'per min',
                        unitPrice: 0.0077,
                        notes: 'Deepgram\'s advanced streaming model'
                    }
                ]
            }
        ]
    },
    llm: {
        providers: [
            {
                id: 'openai',
                name: 'OpenAI',
                models: [
                    {
                        id: 'gpt-4o',
                        name: 'GPT-4o',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 5,
                        outputPrice: 15,
                        notes: 'Most capable multi-modal GPT model'
                    },
                    {
                        id: 'gpt-4o-mini',
                        name: 'GPT-4o mini',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.15,
                        outputPrice: 0.6,
                        notes: 'Fast, low-cost GPT model'
                    },
                    {
                        id: 'gpt-4-turbo-1106',
                        name: 'GPT-4 Turbo (1106)',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 10,
                        outputPrice: 30,
                        notes: 'Previous gen GPT-4 Turbo'
                    },
                    {
                        id: 'gpt-3.5-turbo-0125',
                        name: 'GPT-3.5 Turbo (0125)',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.5,
                        outputPrice: 1.5,
                        notes: 'Economical GPT model'
                    }
                ]
            },
            {
                id: 'microsoft-azure-openai',
                name: 'Microsoft Azure OpenAI',
                models: [
                    {
                        id: 'gpt-4o',
                        name: 'GPT-4o',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 5,
                        outputPrice: 15,
                        notes: 'Matches OpenAI pricing; billed via Azure'
                    },
                    {
                        id: 'gpt-4o-mini',
                        name: 'GPT-4o mini',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.15,
                        outputPrice: 0.6,
                        notes: 'Matches OpenAI pricing'
                    },
                    {
                        id: 'gpt-4-turbo',
                        name: 'GPT-4 Turbo',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 10,
                        outputPrice: 30,
                        notes: 'Matches OpenAI pricing'
                    },
                    {
                        id: 'gpt-3.5-turbo',
                        name: 'GPT-3.5 Turbo',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.5,
                        outputPrice: 1.5,
                        notes: 'Matches OpenAI pricing'
                    }
                ]
            },
            {
                id: 'google-gemini',
                name: 'Google Gemini',
                models: [
                    {
                        id: 'gemini-1.5-pro',
                        name: 'Gemini 1.5 Pro',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 3.5,
                        outputPrice: 10.5,
                        notes: 'Long context (up to 2M tokens)'
                    },
                    {
                        id: 'gemini-1.5-flash',
                        name: 'Gemini 1.5 Flash',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.35,
                        outputPrice: 1.05,
                        notes: 'Lightweight, faster model'
                    }
                ]
            },
            {
                id: 'google-vertex-ai',
                name: 'Google Vertex AI',
                models: [
                    {
                        id: 'gemini-1.5-pro',
                        name: 'Gemini 1.5 Pro',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 3.5,
                        outputPrice: 10.5,
                        notes: 'Same as Google Gemini direct'
                    },
                    {
                        id: 'gemini-1.5-flash',
                        name: 'Gemini 1.5 Flash',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.35,
                        outputPrice: 1.05,
                        notes: 'Same as Google Gemini direct'
                    }
                ]
            },
            {
                id: 'anthropic-claude',
                name: 'Anthropic Claude',
                models: [
                    {
                        id: 'claude-3.5-sonnet',
                        name: 'Claude 3.5 Sonnet',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 3,
                        outputPrice: 15,
                        notes: 'Balanced Claude model'
                    },
                    {
                        id: 'claude-3-haiku',
                        name: 'Claude 3 Haiku',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.25,
                        outputPrice: 1.25,
                        notes: 'Smallest & cheapest Claude'
                    },
                    {
                        id: 'claude-3-opus',
                        name: 'Claude 3 Opus',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 15,
                        outputPrice: 75,
                        notes: 'Most capable Claude model'
                    }
                ]
            }
        ]
    },
    tts: {
        providers: [
            {
                id: 'microsoft-azure-speech',
                name: 'Microsoft Azure Speech Services',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per 1M chars',
                        unitPrice: 16,
                        notes: 'Standard Neural; custom voices cost more.'
                    }
                ]
            },
            {
                id: 'elevenlabs',
                name: 'ElevenLabs',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per 1M chars',
                        unitPrice: 150,
                        notes: 'Starter plan; $0.15 per 1K chars.'
                    }
                ]
            },
            {
                id: 'cartesia',
                name: 'Cartesia',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per 1M chars',
                        unitPrice: 150,
                        notes: 'Starter plan; 1 char = 1 credit.'
                    }
                ]
            },
            {
                id: 'openai-tts',
                name: 'OpenAI TTS',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per 1M chars',
                        unitPrice: 15,
                        notes: 'Applies to gpt-4o-mini-tts and tts-1.'
                    }
                ]
            },
            {
                id: 'hume-ai',
                name: 'Hume AI (Octave)',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per 1M chars',
                        unitPrice: 150,
                        notes: 'Starter plan; voice cloning & speech-to-speech available.'
                    }
                ]
            }
        ]
    },
    ai_avatar: {
        providers: [
            {
                id: 'akool',
                name: 'Akool',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per minute',
                        unitPrice: 0.1000,
                        notes: '$6 for 60 minutes (akool.com) [Standard Avatar]'
                    }
                ]
            },
            {
                id: 'heygen',
                name: 'HeyGen',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per minute',
                        unitPrice: 0.1000,
                        notes: '$6 for 60 minutes (updated pricing)'
                    }
                ]
            }
        ]
    }
};

const PricingCalculator = () => {
    const [hoveredService, setHoveredService] = useState(null);
    const [formData, setFormData] = useState({
        agent_session: { provider: 'audio-basic-task', model: 'default' },
        asr: { provider: 'ares-agora', model: 'default' },
        llm: { provider: 'openai', model: 'gpt-4o-mini' },
        tts: { provider: 'microsoft-azure-speech', model: 'default' },
        ai_avatar: { provider: 'akool', model: 'default' }
    });

    const handleModelChange = (service, combinedValue) => {
        // combinedValue format: "providerId|modelId"
        const [providerId, modelId] = combinedValue.split('|');
        setFormData(prev => ({
            ...prev,
            [service]: {
                provider: providerId,
                model: modelId
            }
        }));
    };

    const calculateLLMTokens = () => {
        const inputTokensPerMinute = 77.13;
        const outputTokensPerMinute = 154.27;
        return {
            inputTokens: Math.round(inputTokensPerMinute),
            outputTokens: Math.round(outputTokensPerMinute)
        };
    };

    const calculateTTSCharacters = () => {
        const charactersPerMinute = 30082 / 60;
        return Math.round(charactersPerMinute);
    };

    const calculatedCosts = useMemo(() => {
        const costs = {
            agent_session: 0,
            asr: 0,
            llm: 0,
            tts: 0,
            ai_avatar: 0
        };

        // Agent Session
        if (formData.agent_session.provider && formData.agent_session.model) {
            const provider = PROVIDERS.agent_session.providers.find(p => p.id === formData.agent_session.provider);
            const model = provider?.models.find(m => m.id === formData.agent_session.model);
            if (model) {
                costs.agent_session = model.unitPrice;
            }
        }

        // ASR
        if (formData.agent_session.provider !== 'audio-basic-task' && formData.asr.provider && formData.asr.model) {
            const provider = PROVIDERS.asr.providers.find(p => p.id === formData.asr.provider);
            const model = provider?.models.find(m => m.id === formData.asr.model);
            if (model) {
                costs.asr = model.unitPrice;
            }
        }

        // LLM
        if (formData.llm.provider && formData.llm.model) {
            const provider = PROVIDERS.llm.providers.find(p => p.id === formData.llm.provider);
            const model = provider?.models.find(m => m.id === formData.llm.model);
            if (model) {
                const tokens = calculateLLMTokens();
                const inputCost = (tokens.inputTokens / 1000000) * model.inputPrice;
                const outputCost = (tokens.outputTokens / 1000000) * model.outputPrice;
                costs.llm = inputCost + outputCost;
            }
        }

        // TTS
        if (formData.tts.provider && formData.tts.model) {
            const provider = PROVIDERS.tts.providers.find(p => p.id === formData.tts.provider);
            const model = provider?.models.find(m => m.id === formData.tts.model);
            if (model) {
                const characters = calculateTTSCharacters();
                costs.tts = (characters / 1000000) * model.unitPrice;
            }
        }

        // AI Avatar
        if (formData.ai_avatar.provider && formData.ai_avatar.model) {
            const provider = PROVIDERS.ai_avatar.providers.find(p => p.id === formData.ai_avatar.provider);
            const model = provider?.models.find(m => m.id === formData.ai_avatar.model);
            if (model) {
                costs.ai_avatar = model.unitPrice;
            }
        }

        const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
        return { ...costs, total };
    }, [formData]);

    const barChartData = useMemo(() => {
        const data = [];
        const total = calculatedCosts.total;
        if (total === 0) return data;

        Object.keys(COLORS).forEach(service => {
            const cost = calculatedCosts[service];
            if (cost > 0) {
                data.push({
                    service,
                    percentage: (cost / total) * 100,
                    cost,
                    color: COLORS[service]
                });
            }
        });

        return data;
    }, [calculatedCosts]);

    const getDisplayName = (provider, model, service) => {
        // If model has a specific name that's not "Default", use it
        if (model.name && model.name !== 'Default') {
            return model.name;
        }

        // If model name is "Default" or empty, generate name from provider and service
        const serviceDisplayName = service.toUpperCase().replace('_', ' ');
        return `${provider.name} ${serviceDisplayName}`;
    };

    const exportToExcel = () => {
        const exportData = [
            ['Service Type', 'Provider', 'Model', 'Cost per Minute'],
        ];

        Object.entries(formData).forEach(([service, data]) => {
            const provider = PROVIDERS[service]?.providers?.find(p => p.id === data.provider);
            const model = provider?.models.find(m => m.id === data.model);
            if (provider && model) {
                exportData.push([
                    service.toUpperCase().replace('_', ' '),
                    provider.name,
                    getDisplayName(provider, model, service),
                    `$${calculatedCosts[service]?.toFixed(4) || 0}/min`
                ]);
            }
        });

        exportData.push([], ['Total:', '', '', `$${calculatedCosts.total.toFixed(4)}/min`]);

        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pricing Calculator');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'agora-pricing-calculator.xlsx');
    };

    // Return null - all UI has been removed, but all logic is preserved
    return null;
};

export default PricingCalculator;