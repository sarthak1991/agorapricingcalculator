import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './PricingCalculator.css';

const COLORS = {
    agent_session: { name: 'cyan', hex: '#00d9ff' },
    llm: { name: 'yellow', hex: '#ffd700' },
    stt: { name: 'green', hex: '#00ff88' },
    tts: { name: 'orange', hex: '#ff6b35' },
    ai_avatar: { name: 'purple', hex: '#9333ea' }
};

const PROVIDERS = {
    conversational_ai: {
        providers: [
            {
                id: 'with-ares-asr',
                name: 'With ARES ASR',
                models: [
                    {
                        id: 'default',
                        name: '',
                        pricingUnit: 'per min',
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
                        name: '',
                        pricingUnit: 'per min',
                        unitPrice: 0.01089,
                        notes: 'BYOK (Bring Your Own Key)\nWhat\'s included: Audio RTC (user) + Conversational AI Engine Audio Basic Task\n\nTotal per min = 0.00099 + 0.0099 = 0.01089 USD/min'
                    }
                ]
            },
            {
                id: 'byok-avatar',
                name: 'BYOK + AI Avatar (720p video)',
                models: [
                    {
                        id: 'default',
                        name: '',
                        pricingUnit: 'per min',
                        unitPrice: 0.01488,
                        notes: 'BYOK + AI Avatar (720p video)\nWhat\'s included:\nVideo HD RTC for user: 0.00399\nAudio RTC for avatar: 0.00099\nConversational AI Engine Audio Basic Task: 0.0099\n\nTotal per min = 0.00399 + 0.00099 + 0.0099 = 0.01488 USD/min\n\nAvatar vendor charges (HeyGen, Akool, etc.) billed separately via BYOK.'
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
    stt: {
        providers: [
            {
                id: 'ares-agora',
                name: 'ARES(Agora)',
                models: [
                    {
                        id: 'default',
                        name: '',
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
    tts: {
        providers: [
            {
                id: 'microsoft-azure-speech',
                name: 'Microsoft Azure Speech Services',
                models: [
                    {
                        id: 'default',
                        name: '',
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
                        name: '',
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
                        name: '',
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
                        name: '',
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
                        name: '',
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
                        name: '',
                        pricingUnit: 'per minute',
                        unitPrice: 0.10,
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
                        name: '',
                        pricingUnit: 'per minute',
                        unitPrice: 0.10,
                        notes: '$99/month for 100 credits (1 credit = 1 min) (heygen.com)Interactive Avatar (Pro API Plan)'
                    }
                ]
            }
        ]
    }
};

const PricingCalculator = () => {
    const [hoveredService, setHoveredService] = useState(null);
    const [formData, setFormData] = useState({
        conversational_ai: { provider: 'with-ares-asr', model: 'default' },
        llm: { provider: 'openai', model: 'gpt-4o-mini' },
        stt: { provider: 'deepgram-asr', model: 'nova-2-streaming' },
        tts: { provider: 'cartesia', model: 'default' },
        ai_avatar: { provider: 'akool', model: 'default' }
    });

    // Check if STT should be disabled (when "With ARES ASR" is selected)
    const isSTTDisabled = formData.conversational_ai.provider === 'with-ares-asr';

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
            llm: 0,
            stt: 0,
            tts: 0,
            ai_avatar: 0
        };

        // Agent Session
        if (formData.conversational_ai.provider && formData.conversational_ai.model) {
            const provider = PROVIDERS.conversational_ai.providers.find(p => p.id === formData.conversational_ai.provider);
            const model = provider?.models.find(m => m.id === formData.conversational_ai.model);
            if (model) {
                costs.agent_session = model.unitPrice;
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

        // STT - Only calculate if not using With ARES ASR
        const isSTTIncluded = formData.conversational_ai.provider === 'with-ares-asr';
        if (!isSTTIncluded && formData.stt.provider && formData.stt.model) {
            const provider = PROVIDERS.stt.providers.find(p => p.id === formData.stt.provider);
            const model = provider?.models.find(m => m.id === formData.stt.model);
            if (model) {
                costs.stt = model.unitPrice;
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

    const exportToExcel = () => {
        const exportData = [
            ['Service Type', 'Provider', 'Model', 'Cost per Minute'],
        ];

        Object.entries(formData).forEach(([service, data]) => {
            const provider = PROVIDERS[service]?.providers?.find(p => p.id === data.provider);
            const model = provider?.models.find(m => m.id === data.model);
            if (provider && model) {
                const costKey = service === 'conversational_ai' ? 'agent_session' : service;
                exportData.push([
                    service.toUpperCase().replace('_', ' '),
                    provider.name,
                    model.name,
                    `$${calculatedCosts[costKey]?.toFixed(4) || 0}/min`
                ]);
            }
        });

        exportData.push([], ['Total:', '', '', `$${calculatedCosts.total.toFixed(4)}/min`]);

        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pricing Calculator');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'agora-convoai-pricing-calculator.xlsx');
    };

    return (
        <div className="pricing-calculator">
            <div className="calculator-container">
                <div className="calculator-card">
                    <div className="calculator-header">
                        <h2 className="calculator-title">
                            Pricing Calculator
                        </h2>
                        <p className="calculator-subtitle">
                            Estimate costs for AI voice and video agents
                        </p>
                    </div>

                    {/* Services Section */}
                    <div className="services-section">
                        {/* Agent Session */}
                        <div className={`service-card ${hoveredService && hoveredService !== 'agent_session' ? 'dimmed' : ''}`}>
                            <div className="service-card-header">
                                <div className="service-icon-wrapper">
                                    <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                                    </svg>
                                </div>
                                <div className="service-info">
                                    <h3 className="service-title">Agent Session</h3>
                                    <p className="service-description">Core infrastructure for agent deployment</p>
                                </div>
                                <div className="service-badge">BILLED BY AGORA</div>
                            </div>
                            <div className="service-card-content">
                                <select
                                    value={`${formData.conversational_ai.provider}|${formData.conversational_ai.model}`}
                                    onChange={(e) => handleModelChange('conversational_ai', e.target.value)}
                                    className="service-select"
                                >
                                    {PROVIDERS.conversational_ai.providers.map(provider => (
                                        provider.models.map(model => (
                                            <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                {provider.name}{model.name && ` ${model.name}`}
                                            </option>
                                        ))
                                    ))}
                                </select>
                                <div className="service-cost">${calculatedCosts.agent_session.toFixed(4)}/min</div>
                            </div>
                        </div>

                        {/* LLM */}
                        <div className={`service-card ${hoveredService && hoveredService !== 'llm' ? 'dimmed' : ''}`}>
                            <div className="service-card-header">
                                <div className="service-icon-wrapper">
                                    <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4"/>
                                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c.39 0 .78.02 1.17.06"/>
                                    </svg>
                                </div>
                                <div className="service-info">
                                    <h3 className="service-title">LLM</h3>
                                    <p className="service-description">Large Language Model</p>
                                </div>
                            </div>
                            <div className="service-card-content">
                                <select
                                    value={`${formData.llm.provider}|${formData.llm.model}`}
                                    onChange={(e) => handleModelChange('llm', e.target.value)}
                                    className="service-select"
                                >
                                    <option value="|">Choose a model</option>
                                    {PROVIDERS.llm.providers.map(provider => (
                                        provider.models.map(model => (
                                            <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                {provider.name}{model.name && ` ${model.name}`}
                                            </option>
                                        ))
                                    ))}
                                </select>
                                <div className="service-cost">${calculatedCosts.llm.toFixed(4)}/min</div>
                            </div>
                        </div>

                        {/* STT */}
                        <div className={`service-card ${isSTTDisabled ? 'disabled' : ''} ${hoveredService && hoveredService !== 'stt' ? 'dimmed' : ''}`}>
                            <div className="service-card-header">
                                <div className="service-icon-wrapper">
                                    <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                        <line x1="12" y1="19" x2="12" y2="23"/>
                                        <line x1="8" y1="23" x2="16" y2="23"/>
                                    </svg>
                                </div>
                                <div className="service-info">
                                    <h3 className="service-title">STT</h3>
                                    <p className="service-description">Speech-to-Text</p>
                                </div>
                            </div>
                            <div className="service-card-content">
                                <select
                                    value={`${formData.stt.provider}|${formData.stt.model}`}
                                    onChange={(e) => handleModelChange('stt', e.target.value)}
                                    className="service-select"
                                    disabled={isSTTDisabled}
                                >
                                    <option value="|">{isSTTDisabled ? 'Included in Agent Session' : 'Choose a model'}</option>
                                    {PROVIDERS.stt.providers.map(provider => (
                                        provider.models.map(model => (
                                            <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                {provider.name}{model.name && ` ${model.name}`}
                                            </option>
                                        ))
                                    ))}
                                </select>
                                <div className="service-cost">${isSTTDisabled ? '0.0000' : calculatedCosts.stt.toFixed(4)}/min</div>
                            </div>
                        </div>

                        {/* TTS */}
                        <div className={`service-card ${hoveredService && hoveredService !== 'tts' ? 'dimmed' : ''}`}>
                            <div className="service-card-header">
                                <div className="service-icon-wrapper">
                                    <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                    </svg>
                                </div>
                                <div className="service-info">
                                    <h3 className="service-title">TTS</h3>
                                    <p className="service-description">Text-to-Speech</p>
                                </div>
                            </div>
                            <div className="service-card-content">
                                <select
                                    value={`${formData.tts.provider}|${formData.tts.model}`}
                                    onChange={(e) => handleModelChange('tts', e.target.value)}
                                    className="service-select"
                                >
                                    <option value="|">Choose a model</option>
                                    {PROVIDERS.tts.providers.map(provider => (
                                        provider.models.map(model => (
                                            <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                {provider.name}{model.name && ` ${model.name}`}
                                            </option>
                                        ))
                                    ))}
                                </select>
                                <div className="service-cost">${calculatedCosts.tts.toFixed(4)}/min</div>
                            </div>
                        </div>

                        {/* AI Avatar */}
                        <div className={`service-card ${hoveredService && hoveredService !== 'ai_avatar' ? 'dimmed' : ''}`}>
                            <div className="service-card-header">
                                <div className="service-icon-wrapper">
                                    <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                </div>
                                <div className="service-info">
                                    <h3 className="service-title">AI Avatar</h3>
                                    <p className="service-description">Digital Human</p>
                                </div>
                            </div>
                            <div className="service-card-content">
                                <select
                                    value={`${formData.ai_avatar.provider}|${formData.ai_avatar.model}`}
                                    onChange={(e) => handleModelChange('ai_avatar', e.target.value)}
                                    className="service-select"
                                >
                                    <option value="|">Choose a model</option>
                                    {PROVIDERS.ai_avatar.providers.map(provider => (
                                        provider.models.map(model => (
                                            <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                {provider.name}{model.name && ` ${model.name}`}
                                            </option>
                                        ))
                                    ))}
                                </select>
                                <div className="service-cost">${calculatedCosts.ai_avatar.toFixed(4)}/min</div>
                            </div>
                        </div>
                    </div>

                    {/* Cost Breakdown Chart */}
                    <div className="cost-breakdown">
                        <div className="chart-container">
                            <div className="circular-chart">
                                <svg viewBox="0 0 100 100" className="progress-ring">
                                    {barChartData.map((segment, index) => {
                                        const radius = 45;
                                        const circumference = 2 * Math.PI * radius;
                                        const startOffset = index === 0 ? 0 :
                                            barChartData.slice(0, index).reduce((sum, s) => sum + (s.percentage / 100) * circumference, 0);
                                        const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;

                                        return (
                                            <circle
                                                key={segment.service}
                                                cx="50"
                                                cy="50"
                                                r={radius}
                                                fill="none"
                                                stroke={segment.color.hex}
                                                strokeWidth="6"
                                                strokeDasharray={strokeDasharray}
                                                strokeDashoffset={-startOffset}
                                                className="chart-segment"
                                                onMouseEnter={() => setHoveredService(segment.service)}
                                                onMouseLeave={() => setHoveredService(null)}
                                            />
                                        );
                                    })}
                                </svg>
                                <div className="chart-center">
                                    <div className="total-cost">${calculatedCosts.total.toFixed(4)}/min</div>
                                    <div className="total-label">Total Cost</div>
                                </div>
                            </div>

                            <div className="chart-legend">
                                {barChartData.map((segment) => (
                                    <div
                                        key={segment.service}
                                        className={`legend-item ${hoveredService === segment.service ? 'highlighted' : ''}`}
                                        onMouseEnter={() => setHoveredService(segment.service)}
                                        onMouseLeave={() => setHoveredService(null)}
                                    >
                                        <div
                                            className="legend-color"
                                            style={{ backgroundColor: segment.color.hex }}
                                        ></div>
                                        <span className="legend-label">
                                            {segment.service.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className="legend-value">${segment.cost.toFixed(4)}/min</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Export Button */}
                    <div className="export-section">
                        <button className="export-btn" onClick={exportToExcel}>
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Export as Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingCalculator;
