import React, { useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './PricingCalculator.css';

const COLORS = [
    '#3b82f6', // primary-500
    '#60a5fa', // light blue
    '#93c5fd', // lighter blue
    '#bfdbfe', // primary-200
    '#dbeafe', // primary-100
    '#e2e8f0'  // neutral-300
];

const PROVIDERS = {
    conversational_ai: {
        providers: [
            {
                id: 'with-ares-asr',
                name: 'With ARES ASR',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per minute',
                        unitPrice: 0.02749,
                        notes: 'With ARES ASR\nIncludes: Audio RTC (0.00099/min) + Conversational AI Engine Audio Basic Task (0.0099/min) + ARES ASR Task (0.0166/min)\nTotal: 0.02749 USD/min'
                    }
                ]
            },
            {
                id: 'byok',
                name: 'BYOK',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per minute',
                        unitPrice: 0.01089,
                        notes: 'BYOK (Bring Your Own Key)\nIncludes: Audio RTC (0.00099/min) + Conversational AI Engine Audio Basic Task (0.0099/min)\nTotal: 0.01089 USD/min'
                    }
                ]
            },
            {
                id: 'byok-avatar',
                name: 'BYOK + AI Avatar (720p video)',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per minute',
                        unitPrice: 0.01488,
                        notes: 'BYOK + AI Avatar (720p video)\nIncludes: Video HD RTC (0.00399/min) + Audio RTC (0.00099/min) + Conversational AI Engine Audio Basic Task (0.0099/min)\nTotal: 0.01488 USD/min\nNote: Avatar vendor charges (HeyGen, Akool, etc.) billed separately via BYOK.'
                    }
                ]
            }
        ]
    },
    asr: {
        providers: [
            {
                id: 'ares',
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
                id: 'microsoft-azure',
                name: 'Microsoft Azure ASR',
                models: [
                    {
                        id: 'standard',
                        name: 'Standard (Pay-as-you-go)',
                        pricingUnit: 'per min',
                        unitPrice: 0.013,
                        notes: 'Approx. $0.96-$0.78/hour = $0.016-$0.013 per minute'
                    }
                ]
            },
            {
                id: 'deepgram',
                name: 'Deepgram ASR',
                models: [
                    {
                        id: 'nova-2',
                        name: 'Nova-2 (Streaming)',
                        pricingUnit: 'per min',
                        unitPrice: 0.0058,
                        notes: 'Entry-level Nova model'
                    },
                    {
                        id: 'nova-3',
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
                        id: 'gpt-4-turbo',
                        name: 'GPT-4 Turbo (1106)',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 10,
                        outputPrice: 30,
                        notes: 'Previous gen GPT-4 Turbo'
                    },
                    {
                        id: 'gpt-3.5-turbo',
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
                id: 'microsoft-azure',
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
                id: 'openai',
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
                        unitPrice: 0.05,
                        notes: '$3 for 60 minutes (akool.com) [Standard Avatar]'
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
                        unitPrice: 1.00,
                        notes: '$99/month for 100 credits (1 credit = 1 min) (heygen.com)Interactive Avatar (Pro API Plan)'
                    }
                ]
            }
        ]
    },
    rtc: [
        { id: 'agora-audio', name: 'Audio minute', costPer1kMinutes: 0.99 },
        { id: 'agora-hd', name: 'Video HD', costPer1kMinutes: 3.99 },
        { id: 'agora-fullhd', name: 'Video Full HD', costPer1kMinutes: 8.99 },
        { id: 'agora-2k', name: 'Video 2K', costPer1kMinutes: 15.99 },
        { id: 'agora-2k-plus', name: 'Video 2K+', costPer1kMinutes: 35.99 },
        { id: 'agora-broadcast-audio', name: 'Broadcast Streaming Audience Audio', costPer1kMinutes: 0.59 },
        { id: 'agora-broadcast-hd', name: 'Broadcast Streaming Audience Video HD', costPer1kMinutes: 1.99 },
        { id: 'agora-broadcast-fullhd', name: 'Broadcast Streaming Audience Video Full HD', costPer1kMinutes: 4.59 },
        { id: 'agora-broadcast-2k', name: 'Broadcast Streaming Audience Video 2K', costPer1kMinutes: 7.99 },
        { id: 'agora-broadcast-2k-plus', name: 'Broadcast Streaming Audience Video 2K+', costPer1kMinutes: 17.99 }
    ]
};

const PricingCalculator = () => {
    const [activeTab, setActiveTab] = useState('conversational_ai');
    const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
    const [formData, setFormData] = useState({
        conversational_ai: { provider: '', model: '', minutes: 60 },
        asr: { provider: '', model: '', minutes: 60 },
        llm: { provider: '', model: '', minutes: 60 },
        tts: { provider: '', model: '', minutes: 60 },
        ai_avatar: { provider: '', model: '', minutes: 60 }
    });

    const isASRTabDisabled = formData.conversational_ai.provider === 'with-ares-asr';

    const handleInputChange = (tab, field, value) => {
        // Prevent negative values for numeric fields
        if (typeof value === 'number' && value < 0) {
            value = 0;
        }
        
        setFormData(prev => {
            const newData = {
                ...prev,
                [tab]: {
                    ...prev[tab],
                    [field]: value
                }
            };
            
            // If minutes field is changed, update minutes for all tabs
            if (field === 'minutes') {
                Object.keys(newData).forEach(key => {
                    if (key !== tab && Object.prototype.hasOwnProperty.call(newData[key], 'minutes')) {
                        newData[key].minutes = value;
                    }
                });
            }
            
            // Auto-select default model when provider changes for single-model providers
            if (field === 'provider') {
                const provider = PROVIDERS[tab]?.providers?.find(p => p.id === value);
                if (provider && provider.models.length === 1) {
                    newData[tab].model = provider.models[0].id;
                }
                
                // If switching from "with-ares-asr" to another provider and ASR tab is active, switch to conversational_ai
                if (tab === 'conversational_ai' && prev[tab].provider === 'with-ares-asr' && value !== 'with-ares-asr' && activeTab === 'asr') {
                    setTimeout(() => setActiveTab('conversational_ai'), 0);
                }
            }
            
            return newData;
        });
    };

    const calculateTTSCharacters = (minutes) => {
        // Based on the requirement: 30082 characters = 60 minutes
        const charactersPerMinute = 30082 / 60; // ~501.37 characters per minute
        return Math.round(minutes * charactersPerMinute);
    };

    const calculateLLMTokens = (minutes) => {
        // Based on the example: 60 minutes = 4628 input tokens, 9256 output tokens
        const inputTokensPerMinute = 4628 / 60; // ~77.13 input tokens per minute
        const outputTokensPerMinute = 9256 / 60; // ~154.27 output tokens per minute
        
        return {
            inputTokens: Math.round(minutes * inputTokensPerMinute),
            outputTokens: Math.round(minutes * outputTokensPerMinute)
        };
    };

    const getAllTabData = useCallback(() => {
        const allData = [];
        const tabs = ['conversational_ai', 'asr', 'llm', 'tts', 'ai_avatar'];
        const tabNames = {
            'conversational_ai': 'Conversational_AI_Engine',
            'asr': 'ASR',
            'llm': 'LLM',
            'tts': 'TTS',
            'ai_avatar': 'AI_Avatar'
        };

        // Process regular tabs
        tabs.forEach(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasModel = tabFormData.model !== '';
            const hasUsage = tabFormData.minutes > 0;
            
            if (hasProvider && hasModel && hasUsage) {
                let cost = 0;
                let usage = 0;
                let unit = '';
                let providerName = '';
                let modelName = '';

                const provider = PROVIDERS[tab]?.providers?.find(p => p.id === tabFormData.provider);
                if (provider) {
                    const model = provider.models.find(m => m.id === tabFormData.model);
                    if (model) {
                        providerName = provider.name;
                        modelName = model.name;
                        
                        switch (tab) {
                            case 'conversational_ai':
                            case 'asr':
                            case 'ai_avatar': {
                                cost = tabFormData.minutes * model.unitPrice;
                                usage = tabFormData.minutes;
                                unit = 'minutes';
                                break;
                            }
                            case 'llm': {
                                const llmTokens = calculateLLMTokens(tabFormData.minutes);
                                const inputCost = (llmTokens.inputTokens / 1000000) * model.inputPrice;
                                const outputCost = (llmTokens.outputTokens / 1000000) * model.outputPrice;
                                cost = inputCost + outputCost;
                                usage = tabFormData.minutes;
                                unit = 'minutes';
                                break;
                            }
                            case 'tts': {
                                const characters = calculateTTSCharacters(tabFormData.minutes);
                                cost = (characters / 1000000) * model.unitPrice;
                                usage = tabFormData.minutes;
                                unit = 'minutes';
                                break;
                            }
                        }
                    }
                }

                if (cost > 0) {
                    allData.push({
                        name: tabNames[tab],
                        cost: cost,
                        usage: usage,
                        provider: modelName ? `${providerName} - ${modelName}` : providerName,
                        unit: unit,
                        color: COLORS[tabs.indexOf(tab) % COLORS.length]
                    });
                }
            }
        });

        return allData;
    }, [formData]);

    const calculatedData = useMemo(() => {
        const allData = getAllTabData();
        const totalCost = allData.reduce((sum, item) => sum + item.cost, 0);
        return { 
            data: allData, 
            totalCost: totalCost,
            allData: allData 
        };
    }, [getAllTabData]);

    const exportToExcel = () => {
        const exportData = [
            ['Service Type', 'Provider', 'Usage', 'Unit Cost', 'Total Cost'],
        ];

        calculatedData.allData.forEach(item => {
            let unitCostDisplay;
            if (item.unit === 'tokens') {
                unitCostDisplay = `$${((item.cost / item.usage) * 1000000).toFixed(6)}/1M ${item.unit}`;
            } else if (item.unit === 'minutes' && item.name === 'RTC') {
                unitCostDisplay = `$${((item.cost / item.usage) * 1000).toFixed(6)}/1k ${item.unit}`;
            } else if (item.unit === 'minutes' && item.name === 'TTS') {
                const characters = calculateTTSCharacters(item.usage);
                unitCostDisplay = `$${((item.cost / characters) * 1000000).toFixed(6)}/1M characters`;
            } else {
                unitCostDisplay = `$${(item.cost / item.usage).toFixed(6)}/${item.unit}`;
            }

            exportData.push([
                item.name,
                item.provider,
                item.usage,
                unitCostDisplay,
                `$${item.cost.toFixed(2)}`
            ]);
        });

        const missingServices = [];
        const tabs = ['conversational_ai', 'asr', 'llm', 'tts', 'ai_avatar'];
        const tabNames = {
            'conversational_ai': 'Conversational_AI_Engine',
            'asr': 'ASR',
            'llm': 'LLM',
            'tts': 'TTS',
            'ai_avatar': 'AI_Avatar'
        };

        tabs.forEach(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasModel = tabFormData.model !== '';
            const hasUsage = tabFormData.minutes > 0;
            
            if (!hasProvider || !hasModel || !hasUsage) {
                missingServices.push(tabNames[tab]);
            }
        });

        if (missingServices.length > 0) {
            exportData.push([], ['Missing services:', ...missingServices]);
        }

        exportData.push([], ['Total:', '', '', '', `$${calculatedData.totalCost.toFixed(2)}`]);

        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pricing Calculator');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'agora-convoai-pricing-calculator.xlsx');
    };

    const getAICostBreakdown = () => {
        const aiEngineData = formData.conversational_ai;
        if (!aiEngineData.provider || !aiEngineData.model || aiEngineData.minutes <= 0) {
            return null;
        }

        const provider = PROVIDERS.conversational_ai.providers.find(p => p.id === aiEngineData.provider);
        if (!provider) return null;

        const model = provider.models.find(m => m.id === aiEngineData.model);
        if (!model) return null;

        // Calculate component costs based on provider type
        if (aiEngineData.provider === 'with-ares-asr') {
            // With ARES ASR: Audio RTC (0.00099) + AI Engine (0.0099) + ARES ASR (0.0166) = 0.02749
            const audioRtcCost = aiEngineData.minutes * 0.00099;
            const aiEngineCost = aiEngineData.minutes * 0.0099;
            const aresAsrCost = aiEngineData.minutes * 0.0166;
            const totalCost = aiEngineData.minutes * 0.02749;

            return {
                audioRtcCost,
                aiEngineCost,
                aresAsrCost,
                totalCost,
                minutes: aiEngineData.minutes,
                audioRtcUnitPrice: 0.00099,
                aiEngineUnitPrice: 0.0099,
                aresAsrUnitPrice: 0.0166,
                totalUnitPrice: 0.02749
            };
        } else if (aiEngineData.provider === 'byok') {
            // BYOK: Audio RTC (0.00099) + AI Engine (0.0099) = 0.01089
            const audioRtcCost = aiEngineData.minutes * 0.00099;
            const aiEngineCost = aiEngineData.minutes * 0.0099;
            const totalCost = aiEngineData.minutes * 0.01089;

            return {
                audioRtcCost,
                aiEngineCost,
                totalCost,
                minutes: aiEngineData.minutes,
                audioRtcUnitPrice: 0.00099,
                aiEngineUnitPrice: 0.0099,
                totalUnitPrice: 0.01089
            };
        } else if (aiEngineData.provider === 'byok-avatar') {
            // BYOK + Avatar: Video HD RTC (0.00399) + Audio RTC (0.00099) + AI Engine (0.0099) = 0.01488
            const videoRtcCost = aiEngineData.minutes * 0.00399;
            const audioRtcCost = aiEngineData.minutes * 0.00099;
            const aiEngineCost = aiEngineData.minutes * 0.0099;
            const totalCost = aiEngineData.minutes * 0.01488;

            return {
                videoRtcCost,
                audioRtcCost,
                aiEngineCost,
                totalCost,
                minutes: aiEngineData.minutes,
                videoRtcUnitPrice: 0.00399,
                audioRtcUnitPrice: 0.00099,
                aiEngineUnitPrice: 0.0099,
                totalUnitPrice: 0.01488
            };
        }

        return null;
    };

    const renderDetailedBreakdown = () => {
        if (!showDetailedBreakdown) return null;

        const tabs = ['conversational_ai', 'asr', 'llm', 'tts', 'ai_avatar'];
        const tabNames = {
            'conversational_ai': 'Conversational_AI_Engine',
            'asr': 'ASR',
            'llm': 'LLM',
            'tts': 'TTS',
            'ai_avatar': 'AI_Avatar'
        };

        // Process regular tabs
        const allTabsStatus = tabs.map(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasModel = tabFormData.model !== '';
            const hasUsage = tabFormData.minutes > 0;
            
            if (hasProvider && hasModel && hasUsage) {
                let cost = 0;
                let usage = 0;
                let unit = '';
                let providerName = '';
                let modelName = '';

                const provider = PROVIDERS[tab]?.providers?.find(p => p.id === tabFormData.provider);
                if (provider) {
                    const model = provider.models.find(m => m.id === tabFormData.model);
                    if (model) {
                        providerName = provider.name;
                        modelName = model.name;
                        
                        switch (tab) {
                            case 'conversational_ai':
                            case 'asr':
                            case 'ai_avatar': {
                                cost = tabFormData.minutes * model.unitPrice;
                                usage = tabFormData.minutes;
                                unit = 'minutes';
                                break;
                            }
                            case 'llm': {
                                const llmTokens = calculateLLMTokens(tabFormData.minutes);
                                const inputCost = (llmTokens.inputTokens / 1000000) * model.inputPrice;
                                const outputCost = (llmTokens.outputTokens / 1000000) * model.outputPrice;
                                cost = inputCost + outputCost;
                                usage = tabFormData.minutes;
                                unit = 'minutes';
                                break;
                            }
                            case 'tts': {
                                const characters = calculateTTSCharacters(tabFormData.minutes);
                                cost = (characters / 1000000) * model.unitPrice;
                                usage = tabFormData.minutes;
                                unit = 'minutes';
                                break;
                            }
                        }
                    }
                }

                return {
                    name: tabNames[tab],
                    status: 'configured',
                    cost: cost,
                    usage: usage,
                    provider: modelName ? `${providerName} - ${modelName}` : providerName,
                    unit: unit,
                    color: COLORS[tabs.indexOf(tab) % COLORS.length]
                };
            } else {
                return {
                    name: tabNames[tab],
                    status: 'not_configured',
                    message: `Please set value for ${tabNames[tab]}`
                };
            }
        });

        return (
            <div className="detailed-breakdown" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '0.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--neutral-900)' }}>Detailed Cost Breakdown - All Services</h4>
                
                {allTabsStatus.map((item, index) => {
                    const isAIEngine = item.name === 'AI_Engine' && item.status === 'configured';
                    const costBreakdown = isAIEngine ? getAICostBreakdown() : null;
                    const isLLM = item.name === 'LLM' && item.status === 'configured';
                    const llmTokenBreakdown = isLLM ? calculateLLMTokens(formData.llm.minutes) : null;
                    
                    return (
                    <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: 'white', borderRadius: '0.375rem' }}>
                        {item.status === 'configured' ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: item.color }} />
                                    <strong style={{ color: 'var(--neutral-900)' }}>{item.name}: ${item.cost.toFixed(2)}</strong>
                                    {isAIEngine && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>
                                            (Cost breakdown shown below)
                                        </span>
                                    )}
                                    {isLLM && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>
                                            (Token breakdown shown below)
                                        </span>
                                    )}
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    <li style={{ marginBottom: '0.25rem' }}>• Provider: {item.provider}</li>
                                    <li style={{ marginBottom: '0.25rem' }}>• Usage: {item.usage.toLocaleString()} {item.unit}</li>
                                    <li style={{ marginBottom: '0.25rem' }}>• Total Cost per {item.unit}: ${(item.cost / item.usage).toFixed(6)}</li>
                                </ul>
                                
                                {isAIEngine && costBreakdown && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--neutral-200)' }}>
                                        <h6 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '0.75rem' }}>
                                            Cost Breakdown ({costBreakdown.minutes.toLocaleString()} minutes):
                                        </h6>
                                        
                                        {costBreakdown.videoRtcCost !== undefined && (
                                            <div style={{ marginBottom: '0.75rem', fontSize: '0.813rem', color: 'var(--neutral-600)' }}>
                                                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Video HD RTC:</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                    <span>Unit Price:</span>
                                                    <span>${costBreakdown.videoRtcUnitPrice.toFixed(6)}/min</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                    <span>Duration:</span>
                                                    <span>{costBreakdown.minutes.toLocaleString()} minutes</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                    <span>Calculation:</span>
                                                    <span>${costBreakdown.videoRtcUnitPrice.toFixed(6)} × {costBreakdown.minutes.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, borderTop: '1px solid var(--neutral-200)', paddingTop: '0.125rem' }}>
                                                    <span>Cost:</span>
                                                    <span>${costBreakdown.videoRtcCost.toFixed(4)}</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div style={{ marginBottom: '0.75rem', fontSize: '0.813rem', color: 'var(--neutral-600)' }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Audio RTC:</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Unit Price:</span>
                                                <span>${costBreakdown.audioRtcUnitPrice.toFixed(6)}/min</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Duration:</span>
                                                <span>{costBreakdown.minutes.toLocaleString()} minutes</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Calculation:</span>
                                                <span>${costBreakdown.audioRtcUnitPrice.toFixed(6)} × {costBreakdown.minutes.toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, borderTop: '1px solid var(--neutral-200)', paddingTop: '0.125rem' }}>
                                                <span>Cost:</span>
                                                <span>${costBreakdown.audioRtcCost.toFixed(4)}</span>
                                            </div>
                                        </div>
                                        
                                        {costBreakdown.aresAsrCost !== undefined && (
                                            <div style={{ marginBottom: '0.75rem', fontSize: '0.813rem', color: 'var(--neutral-600)' }}>
                                                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>ARES ASR Task:</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                    <span>Unit Price:</span>
                                                    <span>${costBreakdown.aresAsrUnitPrice.toFixed(6)}/min</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                    <span>Duration:</span>
                                                    <span>{costBreakdown.minutes.toLocaleString()} minutes</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                    <span>Calculation:</span>
                                                    <span>${costBreakdown.aresAsrUnitPrice.toFixed(6)} × {costBreakdown.minutes.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, borderTop: '1px solid var(--neutral-200)', paddingTop: '0.125rem' }}>
                                                    <span>Cost:</span>
                                                    <span>${costBreakdown.aresAsrCost.toFixed(4)}</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div style={{ marginBottom: '0.75rem', fontSize: '0.813rem', color: 'var(--neutral-600)' }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Conversational AI Engine Audio Basic Task:</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Unit Price:</span>
                                                <span>${costBreakdown.aiEngineUnitPrice.toFixed(6)}/min</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Duration:</span>
                                                <span>{costBreakdown.minutes.toLocaleString()} minutes</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Calculation:</span>
                                                <span>${costBreakdown.aiEngineUnitPrice.toFixed(6)} × {costBreakdown.minutes.toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, borderTop: '1px solid var(--neutral-200)', paddingTop: '0.125rem' }}>
                                                <span>Cost:</span>
                                                <span>${costBreakdown.aiEngineCost.toFixed(4)}</span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ paddingTop: '0.5rem', borderTop: '1px dashed var(--neutral-300)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-800)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Total:</span>
                                                <span>${costBreakdown.totalCost.toFixed(4)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {isLLM && llmTokenBreakdown && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--neutral-200)' }}>
                                        <h6 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '0.75rem' }}>
                                            Token Breakdown ({formData.llm.minutes.toLocaleString()} minutes):
                                        </h6>
                                        
                                        <div style={{ marginBottom: '0.75rem', fontSize: '0.813rem', color: 'var(--neutral-600)' }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Input Tokens:</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Rate:</span>
                                                <span>77.13 tokens/minute</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Duration:</span>
                                                <span>{formData.llm.minutes.toLocaleString()} minutes</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Calculation:</span>
                                                <span>77.13 × {formData.llm.minutes.toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, borderTop: '1px solid var(--neutral-200)', paddingTop: '0.125rem' }}>
                                                <span>Total Input Tokens:</span>
                                                <span>{llmTokenBreakdown.inputTokens.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ marginBottom: '0.75rem', fontSize: '0.813rem', color: 'var(--neutral-600)' }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Output Tokens:</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Rate:</span>
                                                <span>154.27 tokens/minute</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Duration:</span>
                                                <span>{formData.llm.minutes.toLocaleString()} minutes</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.125rem', fontSize: '0.75rem' }}>
                                                <span>Calculation:</span>
                                                <span>154.27 × {formData.llm.minutes.toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, borderTop: '1px solid var(--neutral-200)', paddingTop: '0.125rem' }}>
                                                <span>Total Output Tokens:</span>
                                                <span>{llmTokenBreakdown.outputTokens.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ paddingTop: '0.5rem', borderTop: '1px dashed var(--neutral-300)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-800)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Total Tokens:</span>
                                                <span>{(llmTokenBreakdown.inputTokens + llmTokenBreakdown.outputTokens).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
                                    <strong style={{ color: 'var(--neutral-700)' }}>{item.name}</strong>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>
                                    {item.message}
                                </p>
                            </>
                        )}
                    </div>
                )})}

                <button 
                    onClick={() => setShowDetailedBreakdown(false)}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        background: 'var(--primary-600)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '0.375rem', 
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    Close Breakdown
                </button>
            </div>
        );
    };

    const renderTabContent = () => {
        const getSelectedModel = (tab) => {
            const tabData = formData[tab];
            if (!tabData.provider || !tabData.model) return null;
            
            const provider = PROVIDERS[tab]?.providers?.find(p => p.id === tabData.provider);
            if (!provider) return null;
            
            return provider.models.find(m => m.id === tabData.model);
        };

        const hasMultipleModels = (tab, providerId) => {
            const provider = PROVIDERS[tab]?.providers?.find(p => p.id === providerId);
            return provider && provider.models.length > 1;
        };

        const handleProviderChange = (tab, providerId) => {
            handleInputChange(tab, 'provider', providerId);
        };

        switch (activeTab) {
            case 'conversational_ai':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label>Provider</label>
                            <select 
                                value={formData.conversational_ai.provider}
                                onChange={(e) => handleProviderChange('conversational_ai', e.target.value)}
                            >
                                <option value="">Select Provider</option>
                                {PROVIDERS.conversational_ai.providers.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formData.conversational_ai.provider && hasMultipleModels('conversational_ai', formData.conversational_ai.provider) && (
                            <div className="form-group">
                                <label>Model</label>
                                <select 
                                    value={formData.conversational_ai.model}
                                    onChange={(e) => handleInputChange('conversational_ai', 'model', e.target.value)}
                                >
                                    <option value="">Select Model</option>
                                    {PROVIDERS.conversational_ai.providers
                                        .find(p => p.id === formData.conversational_ai.provider)?.models.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}
                        {formData.conversational_ai.provider && (
                            <>
                                <div className="form-group">
                                    <label>Pricing Unit</label>
                                    <div className="pricing-unit-display">
                                        {getSelectedModel('conversational_ai')?.pricingUnit}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Unit Price (USD)</label>
                                    <div className="unit-price-display">
                                        ${getSelectedModel('conversational_ai')?.unitPrice?.toFixed(6)}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="form-group">
                            <label htmlFor="conversational-ai-minutes">Minutes per month</label>
                            <input
                                id="conversational-ai-minutes"
                                type="number"
                                min="0"
                                placeholder="e.g., 60"
                                value={formData.conversational_ai.minutes}
                                onChange={(e) => handleInputChange('conversational_ai', 'minutes', Number(e.target.value))}
                            />
                        </div>
                    </div>
                );
            case 'asr':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label>Provider</label>
                            <select 
                                value={formData.asr.provider}
                                onChange={(e) => handleProviderChange('asr', e.target.value)}
                            >
                                <option value="">Select Provider</option>
                                {PROVIDERS.asr.providers.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formData.asr.provider && hasMultipleModels('asr', formData.asr.provider) && (
                            <div className="form-group">
                                <label>Model</label>
                                <select 
                                    value={formData.asr.model}
                                    onChange={(e) => handleInputChange('asr', 'model', e.target.value)}
                                >
                                    <option value="">Select Model</option>
                                    {PROVIDERS.asr.providers
                                        .find(p => p.id === formData.asr.provider)?.models.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}
                        {formData.asr.provider && (
                            <>
                                <div className="form-group">
                                    <label>Pricing Unit</label>
                                    <div className="pricing-unit-display">
                                        {getSelectedModel('asr')?.pricingUnit}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Unit Price (USD)</label>
                                    <div className="unit-price-display">
                                        ${getSelectedModel('asr')?.unitPrice?.toFixed(6)}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="form-group">
                            <label htmlFor="asr-minutes">Minutes per month</label>
                            <input
                                id="asr-minutes"
                                type="number"
                                min="0"
                                placeholder="e.g., 10000"
                                value={formData.asr.minutes}
                                onChange={(e) => handleInputChange('asr', 'minutes', Number(e.target.value))}
                            />
                        </div>
                    </div>
                );
            case 'llm':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label>Provider</label>
                            <select 
                                value={formData.llm.provider}
                                onChange={(e) => handleProviderChange('llm', e.target.value)}
                            >
                                <option value="">Select Provider</option>
                                {PROVIDERS.llm.providers.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Model</label>
                            <select 
                                value={formData.llm.model}
                                onChange={(e) => handleInputChange('llm', 'model', e.target.value)}
                                disabled={!formData.llm.provider}
                            >
                                <option value="">Select Model</option>
                                {formData.llm.provider && PROVIDERS.llm.providers
                                    .find(p => p.id === formData.llm.provider)?.models.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        {formData.llm.model && (
                            <>
                                <div className="form-group">
                                    <label>Pricing Unit</label>
                                    <div className="pricing-unit-display">
                                        {getSelectedModel('llm')?.pricingUnit}
                                    </div>
                                </div>
                                <div className="llm-price-container">
                                    <div className="form-group">
                                        <label>Input Unit Price (USD)</label>
                                        <div className="unit-price-display">
                                            ${getSelectedModel('llm')?.inputPrice?.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Output Unit Price (USD)</label>
                                        <div className="unit-price-display">
                                            ${getSelectedModel('llm')?.outputPrice?.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="form-group">
                            <label htmlFor="llm-minutes">Minutes per month</label>
                            <input
                                id="llm-minutes"
                                type="number"
                                min="0"
                                placeholder="e.g., 60"
                                value={formData.llm.minutes}
                                onChange={(e) => handleInputChange('llm', 'minutes', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Token Usage (Estimated)</label>
                            <div className="token-usage-display">
                                <div>Input: {calculateLLMTokens(formData.llm.minutes).inputTokens.toLocaleString()} tokens</div>
                                <div>Output: {calculateLLMTokens(formData.llm.minutes).outputTokens.toLocaleString()} tokens</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                                    Based on 77.13 input tokens/min and 154.27 output tokens/min
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'tts':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label>Provider</label>
                            <select 
                                value={formData.tts.provider}
                                onChange={(e) => handleProviderChange('tts', e.target.value)}
                            >
                                <option value="">Select Provider</option>
                                {PROVIDERS.tts.providers.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formData.tts.provider && hasMultipleModels('tts', formData.tts.provider) && (
                            <div className="form-group">
                                <label>Model</label>
                                <select 
                                    value={formData.tts.model}
                                    onChange={(e) => handleInputChange('tts', 'model', e.target.value)}
                                >
                                    <option value="">Select Model</option>
                                    {PROVIDERS.tts.providers
                                        .find(p => p.id === formData.tts.provider)?.models.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}
                        {formData.tts.provider && (
                            <>
                                <div className="form-group">
                                    <label>Pricing Unit</label>
                                    <div className="pricing-unit-display">
                                        {getSelectedModel('tts')?.pricingUnit}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Unit Price (USD)</label>
                                    <div className="unit-price-display">
                                        ${getSelectedModel('tts')?.unitPrice?.toFixed(2)}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="form-group">
                            <label htmlFor="tts-minutes">Minutes per month</label>
                            <input
                                id="tts-minutes"
                                type="number"
                                min="0"
                                placeholder="e.g., 60"
                                value={formData.tts.minutes}
                                onChange={(e) => handleInputChange('tts', 'minutes', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Character Usage (Estimated)</label>
                            <div className="token-usage-display">
                                <div>{calculateTTSCharacters(formData.tts.minutes).toLocaleString()} characters</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                                    Based on 501.37 characters/minute (30082 chars = 60 minutes)
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'ai_avatar':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label>Provider</label>
                            <select 
                                value={formData.ai_avatar.provider}
                                onChange={(e) => handleProviderChange('ai_avatar', e.target.value)}
                            >
                                <option value="">Select Provider</option>
                                {PROVIDERS.ai_avatar.providers.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formData.ai_avatar.provider && hasMultipleModels('ai_avatar', formData.ai_avatar.provider) && (
                            <div className="form-group">
                                <label>Model</label>
                                <select 
                                    value={formData.ai_avatar.model}
                                    onChange={(e) => handleInputChange('ai_avatar', 'model', e.target.value)}
                                >
                                    <option value="">Select Model</option>
                                    {PROVIDERS.ai_avatar.providers
                                        .find(p => p.id === formData.ai_avatar.provider)?.models.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}
                        {formData.ai_avatar.provider && (
                            <>
                                <div className="form-group">
                                    <label>Pricing Unit</label>
                                    <div className="pricing-unit-display">
                                        {getSelectedModel('ai_avatar')?.pricingUnit}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Unit Price (USD)</label>
                                    <div className="unit-price-display">
                                        ${getSelectedModel('ai_avatar')?.unitPrice?.toFixed(2)}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="form-group">
                            <label htmlFor="avatar-minutes">Minutes per month</label>
                            <input
                                id="avatar-minutes"
                                type="number"
                                min="0"
                                placeholder="e.g., 120"
                                value={formData.ai_avatar.minutes}
                                onChange={(e) => handleInputChange('ai_avatar', 'minutes', Number(e.target.value))}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="pricing-calculator">
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z" fill="currentColor" />
                        </svg>
                        <h1>ConvoAI SDK</h1>
                    </div>
                    <nav className="nav-links">
                        <a href="https://docs.agora.io/en/conversational-ai/overview/product-overview" target="_blank" rel="noopener noreferrer">Documentation</a>
                        <a href="https://docs.agora.io/en/conversational-ai/rest-api/join" target="_blank" rel="noopener noreferrer">API Reference</a>
                        <a href="#" className="active">Pricing</a>
                    </nav>
                </div>
            </header>

            <main className="main-content">
                <div className="content-left">
                    <div className="title-section">
                        <h2>Pricing Calculator</h2>
                        <p>Estimate your ConversationalAI Engine costs based on your chosen providers and usage.</p>
                    </div>

                    <div className="tabs-section">
                        <div className="tabs">
                            {[
                                { key: 'conversational_ai', label: 'Conversational AI Engine' },
                                { key: 'asr', label: 'ASR' },
                                { key: 'llm', label: 'LLM' },
                                { key: 'tts', label: 'TTS' },
                                { key: 'ai_avatar', label: 'AI_Avatar' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    className={`tab ${activeTab === tab.key ? 'active' : ''} ${tab.key === 'asr' && isASRTabDisabled ? 'disabled' : ''}`}
                                    onClick={() => {
                                        if (tab.key !== 'asr' || !isASRTabDisabled) {
                                            setActiveTab(tab.key);
                                        }
                                    }}
                                    title={tab.key === 'asr' && isASRTabDisabled ? 'ASR is already included in "With ARES ASR"' : ''}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        {renderTabContent()}
                    </div>

                    <button className="calculate-btn">
                        <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.25 5.25a.75.75 0 00-1.5 0v.105a.75.75 0 00.463.702c.101.036.188.11.237.202.05.092.075.2.075.316V8.5a.75.75 0 001.5 0V7.075a2.25 2.25 0 00-1.25-2.065.75.75 0 00-.75-.76V5.25zM10 12.25a.75.75 0 00-.75.75v1.25a.75.75 0 001.5 0v-1.25a.75.75 0 00-.75-.75z" fillRule="evenodd" />
                        </svg>
                        Calculate Costs
                    </button>
                    {renderDetailedBreakdown()}
                </div>

                <div className="content-right">
                    <div className="cost-distribution">
                        <h3>Cost Distribution</h3>
                        <div className="total-cost">
                            <span className="amount">
                                {calculatedData.totalCost > 0 
                                    ? (calculatedData.totalCost >= 1000 
                                        ? `$${(calculatedData.totalCost / 1000).toFixed(1)}k` 
                                        : `$${calculatedData.totalCost.toFixed(2)}`)
                                    : '$0'}
                            </span>
                            <span className="period">/month</span>
                        </div>
                    </div>

                    <div className="pie-chart-container">
                        {calculatedData.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={calculatedData.data}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="cost"
                                    >
                                        {calculatedData.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                                        labelFormatter={() => ''}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="pie-chart-placeholder" style={{
                                height: '250px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--neutral-500)',
                                fontSize: '0.875rem'
                            }}>
                                Configure services to see cost distribution
                            </div>
                        )}
                    </div>

                    <div className="cost-breakdown">
                        {calculatedData.data.map((item, index) => (
                            <div key={index} className="cost-item">
                                <div className="cost-item-label">
                                    <div 
                                        className="color-indicator" 
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="cost-item-name">{item.name}</span>
                                </div>
                                <span className="cost-item-value">${item.cost.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="action-buttons">
                        <button 
                            className="action-btn"
                            onClick={() => setShowDetailedBreakdown(true)}
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                            Detailed Breakdown
                        </button>
                        <button 
                            className="action-btn"
                            onClick={exportToExcel}
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.25a.75.75 0 00.75.75h4.5a.75.75 0 000-1.5h-3.75V2.75z" />
                                <path clipRule="evenodd" d="M12.5 1.75a2.25 2.25 0 00-2.25-2.25H6.5A2.25 2.25 0 004.25 1.75v16.5A2.25 2.25 0 006.5 20.5h10A2.25 2.25 0 0018.75 18.25V8.5a2.25 2.25 0 00-2.25-2.25h-4V1.75zM10 6.25a.75.75 0 00-1.5 0v8a.75.75 0 001.5 0v-8z" fillRule="evenodd" />
                            </svg>
                            Export as Excel
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PricingCalculator;