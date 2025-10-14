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
                        name: 'Default',
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
                        name: 'Default',
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
                        name: 'Default',
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
    }
};

const PricingCalculator = () => {
    const [connectionType, setConnectionType] = useState('web-mobile');
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

    const formatModelPrice = (service, provider, model) => {
        if (service === 'conversational_ai') {
            const unit = model.pricingUnit === 'per minute' ? 'minute' : 'min';
            return `$${model.unitPrice.toFixed(4)}/${unit}`;
        } else if (service === 'llm') {
            const tokens = calculateLLMTokens();
            const inputCost = (tokens.inputTokens / 1000000) * model.inputPrice;
            const outputCost = (tokens.outputTokens / 1000000) * model.outputPrice;
            const totalCost = inputCost + outputCost;
            return `$${totalCost.toFixed(4)}/min`;
        } else if (service === 'stt') {
            const unit = model.pricingUnit === 'per minute' ? 'minute' : 'min';
            return `$${model.unitPrice.toFixed(4)}/${unit}`;
        } else if (service === 'tts') {
            const characters = calculateTTSCharacters();
            const cost = (characters / 1000000) * model.unitPrice;
            return `$${cost.toFixed(4)}/min`;
        } else if (service === 'ai_avatar') {
            const unit = model.pricingUnit === 'per minute' ? 'minute' : 'min';
            return `$${model.unitPrice.toFixed(4)}/${unit}`;
        }
        return '';
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
            <div className="main-content">
                {/* Left Hero Section */}
                <div className="hero-section">
                    <div className="label">PRICING CALCULATOR</div>
                    <h1>
                        Estimate costs for<br />
                        <span className="highlight">AI voice and video agents</span>
                    </h1>
                    <p className="description">
                        Select how your users will connect to agents and the AI models you intend to use to calculate your per-minute cost. Agora's plans include monthly allotments for agent session minutes and inference credits to call the most popular models. For the full list of supported AI providers and models, see <a href="https://docs.agora.io/en/conversational-ai/overview/product-overview" target="_blank" rel="noopener noreferrer">Documentation</a>.
                    </p>
                </div>

                {/* Right Calculator Card */}
                <div className="calculator-card">
                    {/* Connection Type Tabs - Hidden for now */}
                    <div className="connection-tabs" style={{ display: 'none' }}>
                        <span className="connection-tabs-label">How users connect to your agent</span>
                        <button
                            className={`tab-button ${connectionType === 'web-mobile' ? 'active' : ''}`}
                            onClick={() => setConnectionType('web-mobile')}
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                            </svg>
                            Web/mobile
                        </button>
                    </div>

                    {/* Services Section */}
                    <div className="services-section">
                        {/* Agent Session */}
                        <div className={`service-row ${hoveredService && hoveredService !== 'agent_session' ? 'dimmed' : ''}`}>
                            <div className="service-header">
                                <div className={`service-indicator ${COLORS.agent_session.name}`}></div>
                                <div className="service-label-section">
                                    <span className="service-label">
                                        AGENT SESSION
                                        <span className="service-sublabel"></span>
                                    </span>
                                    <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span className="service-badge">BILLED BY AGORA</span>
                                </div>
                                <div></div>
                                <div className="service-content">
                                    <select
                                        value={`${formData.conversational_ai.provider}|${formData.conversational_ai.model}`}
                                        onChange={(e) => handleModelChange('conversational_ai', e.target.value)}
                                    >
                                        {PROVIDERS.conversational_ai.providers.map(provider => (
                                            provider.models.map(model => (
                                                <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                    {provider.name}    -    {formatModelPrice('conversational_ai', provider, model)}
                                                </option>
                                            ))
                                        ))}
                                    </select>
                                </div>
                                <span className="service-cost">${calculatedCosts.agent_session.toFixed(4)}/min</span>
                            </div>
                            <div className="service-description">
                                Estimated cost to deploy an agent and stream media between an agent and a user over an Agora Channel.
                            </div>
                        </div>

                        {/* LLM */}
                        <div className={`service-row ${hoveredService && hoveredService !== 'llm' ? 'dimmed' : ''}`}>
                            <div className="service-header">
                                <div className={`service-indicator ${COLORS.llm.name}`}></div>
                                <div className="service-label-section">
                                    <span className="service-label">
                                        LLM
                                        <span className="service-sublabel">(LARGE LANGUAGE MODEL)</span>
                                    </span>
                                    <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div></div>
                                <div className="service-content">
                                    <select
                                        value={`${formData.llm.provider}|${formData.llm.model}`}
                                        onChange={(e) => handleModelChange('llm', e.target.value)}
                                    >
                                        <option value="|">Choose a model</option>
                                        {PROVIDERS.llm.providers.map(provider => (
                                            provider.models.map(model => (
                                                <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                    {provider.name} {model.name}    -    {formatModelPrice('llm', provider, model)}
                                                </option>
                                            ))
                                        ))}
                                    </select>
                                </div>
                                <span className="service-cost">${calculatedCosts.llm.toFixed(4)}/min</span>
                            </div>
                        </div>

                        {/* STT */}
                        <div className={`service-row ${isSTTDisabled ? 'disabled' : ''} ${hoveredService && hoveredService !== 'stt' ? 'dimmed' : ''}`}>
                            <div className="service-header">
                                <div className={`service-indicator ${COLORS.stt.name}`}></div>
                                <div className="service-label-section">
                                    <span className="service-label">
                                        STT
                                        <span className="service-sublabel">(SPEECH-TO-TEXT)</span>
                                    </span>
                                    <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div></div>
                                <div className="service-content">
                                    <select
                                        value={`${formData.stt.provider}|${formData.stt.model}`}
                                        onChange={(e) => handleModelChange('stt', e.target.value)}
                                        disabled={isSTTDisabled}
                                    >
                                        <option value="|">{isSTTDisabled ? 'Included in Agent Session' : 'Choose a model'}</option>
                                        {PROVIDERS.stt.providers.map(provider => (
                                            provider.models.map(model => (
                                                <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                    {provider.name} {model.name}    -    {formatModelPrice('stt', provider, model)}
                                                </option>
                                            ))
                                        ))}
                                    </select>
                                </div>
                                <span className="service-cost">${isSTTDisabled ? '0.0000' : calculatedCosts.stt.toFixed(4)}/min</span>
                            </div>
                        </div>

                        {/* TTS */}
                        <div className={`service-row ${hoveredService && hoveredService !== 'tts' ? 'dimmed' : ''}`}>
                            <div className="service-header">
                                <div className={`service-indicator ${COLORS.tts.name}`}></div>
                                <div className="service-label-section">
                                    <span className="service-label">
                                        TTS
                                        <span className="service-sublabel">(TEXT-TO-SPEECH)</span>
                                    </span>
                                    <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div></div>
                                <div className="service-content">
                                    <select
                                        value={`${formData.tts.provider}|${formData.tts.model}`}
                                        onChange={(e) => handleModelChange('tts', e.target.value)}
                                    >
                                        <option value="|">Choose a model</option>
                                        {PROVIDERS.tts.providers.map(provider => (
                                            provider.models.map(model => (
                                                <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                    {provider.name} {model.name}    -    {formatModelPrice('tts', provider, model)}
                                                </option>
                                            ))
                                        ))}
                                    </select>
                                </div>
                                <span className="service-cost">${calculatedCosts.tts.toFixed(4)}/min</span>
                            </div>
                        </div>

                        {/* AI Avatar */}
                        <div className={`service-row ${hoveredService && hoveredService !== 'ai_avatar' ? 'dimmed' : ''}`}>
                            <div className="service-header">
                                <div className={`service-indicator ${COLORS.ai_avatar.name}`}></div>
                                <div className="service-label-section">
                                    <span className="service-label">
                                        AI Avatar
                                        <span className="service-sublabel">(DIGITAL HUMAN)</span>
                                    </span>
                                    <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div></div>
                                <div className="service-content">
                                    <select
                                        value={`${formData.ai_avatar.provider}|${formData.ai_avatar.model}`}
                                        onChange={(e) => handleModelChange('ai_avatar', e.target.value)}
                                    >
                                        <option value="|">Choose a model</option>
                                        {PROVIDERS.ai_avatar.providers.map(provider => (
                                            provider.models.map(model => (
                                                <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                                                    {provider.name} {model.name}    -    {formatModelPrice('ai_avatar', provider, model)}
                                                </option>
                                            ))
                                        ))}
                                    </select>
                                </div>
                                <span className="service-cost">${calculatedCosts.ai_avatar.toFixed(4)}/min</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Section */}
                    <div className="total-section">
                        <div className="total-label">
                            TOTAL ESTIMATED COST
                            <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="total-cost">${calculatedCosts.total.toFixed(4)}/min</div>
                    </div>

                    {/* Bar Chart */}
                    <div className="bar-chart-container">
                        <div className="bar-chart">
                            {barChartData.map((segment) => (
                                <div
                                    key={segment.service}
                                    className={`bar-segment ${segment.color.name}`}
                                    style={{ width: `${segment.percentage}%` }}
                                    onMouseEnter={() => setHoveredService(segment.service)}
                                    onMouseLeave={() => setHoveredService(null)}
                                />
                            ))}
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
