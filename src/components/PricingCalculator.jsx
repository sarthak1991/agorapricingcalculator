import React, { useState, useMemo } from 'react';
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
                id: 'byok',
                name: 'BYOK',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per minute',
                        unitPrice: 0.01089,
                        notes: 'BYOK (Bring Your Own Key)\nWhat\'s included: Audio RTC (user) + Conversational AI Engine Audio Basic Task\nTotal per min = 0.00099 + 0.0099 = 0.01089 USD/min'
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
                        notes: 'BYOK + AI Avatar (720p video)\nWhat\'s included:\nVideo HD RTC for user: 0.00399\nAudio RTC for avatar: 0.00099\nConversational AI Engine Audio Basic Task: 0.0099\nTotal per min = 0.00399 + 0.00099 + 0.0099 = 0.01488 USD/min\nAvatar vendor charges (HeyGen, Akool, etc.) billed separately via BYOK.'
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
        llm: { provider: '', model: '', inputTokens: 4628, outputTokens: 9256 },
        tts: { provider: '', model: '', characters: 30082 },
        ai_avatar: { provider: '', model: '', minutes: 60 },
        rtc: { provider: '', minutes: 1000 }
    });

    const handleInputChange = (tab, field, value) => {
        // Prevent negative values for numeric fields
        if (typeof value === 'number' && value < 0) {
            value = 0;
        }
        
        setFormData(prev => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                [field]: value
            }
        }));
    };

    const getAllTabData = () => {
        const allData = [];
        const tabs = ['conversational_ai', 'asr', 'llm', 'tts', 'ai_avatar', 'rtc'];
        const tabNames = {
            'conversational_ai': 'AI_Engine',
            'asr': 'ASR',
            'llm': 'LLM',
            'tts': 'TTS',
            'ai_avatar': 'AI_Avatar',
            'rtc': 'RTC'
        };

        tabs.forEach(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasModel = tab === 'rtc' || tabFormData.model !== '';
            const hasUsage = tabFormData.minutes > 0 || tabFormData.inputTokens > 0 || tabFormData.outputTokens > 0 || tabFormData.characters > 0;
            
            if (hasProvider && hasModel && hasUsage) {
                let cost = 0;
                let usage = 0;
                let unit = '';
                let providerName = '';
                let modelName = '';

                if (tab === 'rtc') {
                    // RTC uses the old structure
                    const provider = PROVIDERS[tab].find(p => p.id === tabFormData.provider);
                    if (provider) {
                        cost = (tabFormData.minutes / 1000) * provider.costPer1kMinutes;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        providerName = provider.name;
                    }
                } else {
                    // New structure with providers and models
                    const provider = PROVIDERS[tab]?.providers?.find(p => p.id === tabFormData.provider);
                    if (provider) {
                        const model = provider.models.find(m => m.id === tabFormData.model);
                        if (model) {
                            providerName = provider.name;
                            modelName = model.name;
                            
                            switch (tab) {
                                case 'conversational_ai':
                                case 'asr':
                                case 'ai_avatar':
                                    cost = tabFormData.minutes * model.unitPrice;
                                    usage = tabFormData.minutes;
                                    unit = 'minutes';
                                    break;
                                case 'llm':
                                    const inputCost = (tabFormData.inputTokens / 1000000) * model.inputPrice;
                                    const outputCost = (tabFormData.outputTokens / 1000000) * model.outputPrice;
                                    cost = inputCost + outputCost;
                                    usage = tabFormData.inputTokens + tabFormData.outputTokens;
                                    unit = 'tokens';
                                    break;
                                case 'tts':
                                    cost = (tabFormData.characters / 1000000) * model.unitPrice;
                                    usage = tabFormData.characters;
                                    unit = 'characters';
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
    };

    const calculatedData = useMemo(() => {
        const allData = getAllTabData();
        const totalCost = allData.reduce((sum, item) => sum + item.cost, 0);
        return { 
            data: allData, 
            totalCost: totalCost,
            allData: allData 
        };
    }, [formData]);

    const exportToExcel = () => {
        const exportData = [
            ['Service Type', 'Provider', 'Usage', 'Unit Cost', 'Total Cost'],
        ];

        calculatedData.allData.forEach(item => {
            let unitCostDisplay;
            if (item.unit === 'tokens' || item.unit === 'characters') {
                unitCostDisplay = `$${((item.cost / item.usage) * 1000000).toFixed(6)}/1M ${item.unit}`;
            } else if (item.unit === 'minutes' && item.name === 'RTC') {
                unitCostDisplay = `$${((item.cost / item.usage) * 1000).toFixed(6)}/1k ${item.unit}`;
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
        const tabs = ['conversational_ai', 'asr', 'llm', 'tts', 'ai_avatar', 'rtc'];
        const tabNames = {
            'conversational_ai': 'AI_Engine',
            'asr': 'ASR',
            'llm': 'LLM',
            'tts': 'TTS',
            'ai_avatar': 'AI_Avatar',
            'rtc': 'RTC'
        };

        tabs.forEach(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasModel = tab === 'rtc' || tabFormData.model !== '';
            const hasUsage = tabFormData.minutes > 0 || tabFormData.inputTokens > 0 || tabFormData.outputTokens > 0 || tabFormData.characters > 0;
            
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

    const renderDetailedBreakdown = () => {
        if (!showDetailedBreakdown) return null;

        const tabs = ['conversational_ai', 'asr', 'llm', 'tts', 'ai_avatar', 'rtc'];
        const tabNames = {
            'conversational_ai': 'AI_Engine',
            'asr': 'ASR',
            'llm': 'LLM',
            'tts': 'TTS',
            'ai_avatar': 'AI_Avatar',
            'rtc': 'RTC'
        };

        const allTabsStatus = tabs.map(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasModel = tab === 'rtc' || tabFormData.model !== '';
            const hasUsage = tabFormData.minutes > 0 || tabFormData.inputTokens > 0 || tabFormData.outputTokens > 0 || tabFormData.characters > 0;
            
            if (hasProvider && hasModel && hasUsage) {
                let cost = 0;
                let usage = 0;
                let unit = '';
                let providerName = '';
                let modelName = '';

                if (tab === 'rtc') {
                    // RTC uses the old structure
                    const provider = PROVIDERS[tab].find(p => p.id === tabFormData.provider);
                    if (provider) {
                        cost = (tabFormData.minutes / 1000) * provider.costPer1kMinutes;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        providerName = provider.name;
                    }
                } else {
                    // New structure with providers and models
                    const provider = PROVIDERS[tab]?.providers?.find(p => p.id === tabFormData.provider);
                    if (provider) {
                        const model = provider.models.find(m => m.id === tabFormData.model);
                        if (model) {
                            providerName = provider.name;
                            modelName = model.name;
                            
                            switch (tab) {
                                case 'conversational_ai':
                                case 'asr':
                                case 'ai_avatar':
                                    cost = tabFormData.minutes * model.unitPrice;
                                    usage = tabFormData.minutes;
                                    unit = 'minutes';
                                    break;
                                case 'llm':
                                    const inputCost = (tabFormData.inputTokens / 1000000) * model.inputPrice;
                                    const outputCost = (tabFormData.outputTokens / 1000000) * model.outputPrice;
                                    cost = inputCost + outputCost;
                                    usage = tabFormData.inputTokens + tabFormData.outputTokens;
                                    unit = 'tokens';
                                    break;
                                case 'tts':
                                    cost = (tabFormData.characters / 1000000) * model.unitPrice;
                                    usage = tabFormData.characters;
                                    unit = 'characters';
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
                
                {allTabsStatus.map((item, index) => (
                    <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: 'white', borderRadius: '0.375rem' }}>
                        {item.status === 'configured' ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: item.color }} />
                                    <strong style={{ color: 'var(--neutral-900)' }}>{item.name}: ${item.cost.toFixed(2)}</strong>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    <li style={{ marginBottom: '0.25rem' }}>• Provider: {item.provider}</li>
                                    <li style={{ marginBottom: '0.25rem' }}>• Usage: {item.usage.toLocaleString()} {item.unit}</li>
                                    <li style={{ marginBottom: '0.25rem' }}>• Cost per {item.unit === 'tokens' || item.unit === 'characters' ? '1M ' + item.unit : (item.unit === 'minutes' && item.name === 'RTC') ? '1k ' + item.unit : item.unit}: ${
                                        item.unit === 'tokens' || item.unit === 'characters' 
                                            ? ((item.cost / item.usage) * 1000000).toFixed(6)
                                            : (item.unit === 'minutes' && item.name === 'RTC')
                                            ? ((item.cost / item.usage) * 1000).toFixed(6)
                                            : (item.cost / item.usage).toFixed(6)
                                    }</li>
                                </ul>
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
                ))}

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

        const handleProviderChange = (tab, providerId) => {
            handleInputChange(tab, 'provider', providerId);
            // Reset model when provider changes
            handleInputChange(tab, 'model', '');
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
                        <div className="form-group">
                            <label>Model</label>
                            <select 
                                value={formData.conversational_ai.model}
                                onChange={(e) => handleInputChange('conversational_ai', 'model', e.target.value)}
                                disabled={!formData.conversational_ai.provider}
                            >
                                <option value="">Select Model</option>
                                {formData.conversational_ai.provider && PROVIDERS.conversational_ai.providers
                                    .find(p => p.id === formData.conversational_ai.provider)?.models.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        {formData.conversational_ai.model && (
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
                        <div className="form-group">
                            <label>Model</label>
                            <select 
                                value={formData.asr.model}
                                onChange={(e) => handleInputChange('asr', 'model', e.target.value)}
                                disabled={!formData.asr.provider}
                            >
                                <option value="">Select Model</option>
                                {formData.asr.provider && PROVIDERS.asr.providers
                                    .find(p => p.id === formData.asr.provider)?.models.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        {formData.asr.model && (
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
                            <label htmlFor="llm-input-tokens">Input Tokens per month</label>
                            <input
                                id="llm-input-tokens"
                                type="number"
                                min="0"
                                placeholder="e.g., 5000000"
                                value={formData.llm.inputTokens}
                                onChange={(e) => handleInputChange('llm', 'inputTokens', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="llm-output-tokens">Output Tokens per month</label>
                            <input
                                id="llm-output-tokens"
                                type="number"
                                min="0"
                                placeholder="e.g., 5000000"
                                value={formData.llm.outputTokens}
                                onChange={(e) => handleInputChange('llm', 'outputTokens', Number(e.target.value))}
                            />
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
                        <div className="form-group">
                            <label>Model</label>
                            <select 
                                value={formData.tts.model}
                                onChange={(e) => handleInputChange('tts', 'model', e.target.value)}
                                disabled={!formData.tts.provider}
                            >
                                <option value="">Select Model</option>
                                {formData.tts.provider && PROVIDERS.tts.providers
                                    .find(p => p.id === formData.tts.provider)?.models.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        {formData.tts.model && (
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
                            <label htmlFor="tts-characters">Characters per month</label>
                            <input
                                id="tts-characters"
                                type="number"
                                min="0"
                                placeholder="e.g., 1000000"
                                value={formData.tts.characters}
                                onChange={(e) => handleInputChange('tts', 'characters', Number(e.target.value))}
                            />
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
                        <div className="form-group">
                            <label>Model</label>
                            <select 
                                value={formData.ai_avatar.model}
                                onChange={(e) => handleInputChange('ai_avatar', 'model', e.target.value)}
                                disabled={!formData.ai_avatar.provider}
                            >
                                <option value="">Select Model</option>
                                {formData.ai_avatar.provider && PROVIDERS.ai_avatar.providers
                                    .find(p => p.id === formData.ai_avatar.provider)?.models.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        {formData.ai_avatar.model && (
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
            case 'rtc':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label htmlFor="rtc-provider">RTC Provider</label>
                            <select 
                                id="rtc-provider"
                                value={formData.rtc.provider}
                                onChange={(e) => handleInputChange('rtc', 'provider', e.target.value)}
                            >
                                <option value="">Select RTC Provider</option>
                                {PROVIDERS.rtc.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="rtc-minutes">Minutes per month</label>
                            <input
                                id="rtc-minutes"
                                type="number"
                                min="0"
                                placeholder="e.g., 10000"
                                value={formData.rtc.minutes}
                                onChange={(e) => handleInputChange('rtc', 'minutes', Number(e.target.value))}
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
                        <p>Estimate your ConvoAI SDK costs based on your chosen providers and usage.</p>
                    </div>

                    <div className="tabs-section">
                        <div className="tabs">
                            {[
                                { key: 'conversational_ai', label: 'AI_Engine' },
                                { key: 'asr', label: 'ASR' },
                                { key: 'llm', label: 'LLM' },
                                { key: 'tts', label: 'TTS' },
                                { key: 'ai_avatar', label: 'AI_Avatar' },
                                { key: 'rtc', label: 'RTC' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
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
                                {calculatedData.totalCost > 0 ? `$${(calculatedData.totalCost / 1000).toFixed(1)}k` : '$0'}
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