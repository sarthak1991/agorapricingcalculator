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
    conversational_ai: [
        { id: 'byok', name: 'Audio Basic Task (BYOK)', costPerMinute: 0.0099 },
        { id: 'byok-ares', name: 'Audio Basic Task + ARES ASR', costPerMinute: 0.0265 }
    ],
    asr: [
        { id: 'ares', name: 'ARES ASR Task', costPerMinute: 0.0166 },
        { id: 'deepgram', name: 'Deepgram Nova-2', costPerMinute: 0.0225 },
        { id: 'google', name: 'Google Cloud Speech-to-Text', costPerMinute: 0.006 },
        { id: 'aws', name: 'AWS Transcribe', costPerMinute: 0.015 }
    ],
    llm_input: [
        { id: 'gpt4-turbo', name: 'GPT-4 Turbo (OpenAI)', costPer1kTokens: 0.01 },
        { id: 'anthropic-claude', name: 'Anthropic Claude', costPer1kTokens: 0.01 },
        { id: 'openai', name: 'OpenAI GPT-4', costPer1kTokens: 0.03 },
        { id: 'google', name: 'Google Gemini Pro', costPer1kTokens: 0.00125 },
        { id: 'anthropic', name: 'Anthropic Claude 3', costPer1kTokens: 0.015 }
    ],
    llm_output: [
        { id: 'gpt4-turbo', name: 'GPT-4 Turbo (OpenAI)', costPer1kTokens: 0.03 },
        { id: 'anthropic-claude', name: 'Anthropic Claude', costPer1kTokens: 0.03 },
        { id: 'openai', name: 'OpenAI GPT-4', costPer1kTokens: 0.06 },
        { id: 'google', name: 'Google Gemini Pro', costPer1kTokens: 0.005 },
        { id: 'anthropic', name: 'Anthropic Claude 3', costPer1kTokens: 0.075 }
    ],
    tts: [
        { id: 'openai-tts', name: 'OpenAI TTS - Standard Neural', costPer1kChars: 0.016 },
        { id: 'elevenlabs', name: 'ElevenLabs', costPer1kChars: 0.24 },
        { id: 'google', name: 'Google Cloud Text-to-Speech', costPer1kChars: 0.016 },
        { id: 'aws', name: 'Amazon Polly', costPer1kChars: 0.004 }
    ],
    ai_avatar: [
        { id: 'akool', name: 'Akool - Standard Avatar', costPerMinute: 0.05 },
        { id: 'synthesia', name: 'Synthesia', costPerMinute: 0.15 },
        { id: 'hourone', name: 'Hour One', costPerMinute: 0.20 },
        { id: 'did', name: 'D-ID', costPerMinute: 0.25 }
    ],
    voice_cloning: [
        { id: 'resemble', name: 'Resemble.ai', costPerVoice: 100 },
        { id: 'elevenlabs', name: 'ElevenLabs Voice Lab', costPerVoice: 200 },
        { id: 'descript', name: 'Descript', costPerVoice: 150 }
    ],
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
        conversational_ai: { provider: '', minutes: 60 },
        asr: { provider: '', minutes: 60 },
        llm_input: { provider: '', tokens: 4628 },
        llm_output: { provider: '', tokens: 9256 },
        tts: { provider: '', characters: 30082 },
        ai_avatar: { provider: '', minutes: 60 },
        voice_cloning: { provider: '', voices: 5 },
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
        const tabs = ['conversational_ai', 'asr', 'llm_input', 'llm_output', 'tts', 'ai_avatar', 'voice_cloning', 'rtc'];
        const tabNames = {
            'conversational_ai': 'Conversational AI Engine',
            'asr': 'ASR',
            'llm_input': 'LLM Input',
            'llm_output': 'LLM Output',
            'tts': 'TTS',
            'ai_avatar': 'AI-Avatar',
            'voice_cloning': 'Voice Cloning',
            'rtc': 'RTC'
        };

        tabs.forEach(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasUsage = tabFormData.minutes > 0 || tabFormData.tokens > 0 || tabFormData.characters > 0 || tabFormData.voices > 0;
            
            if (hasProvider && hasUsage) {
                const provider = PROVIDERS[tab].find(p => p.id === tabFormData.provider);
                let cost = 0;
                let usage = 0;
                let unit = '';

                switch (tab) {
                    case 'conversational_ai':
                        cost = tabFormData.minutes * provider.costPerMinute;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                    case 'asr':
                        cost = tabFormData.minutes * provider.costPerMinute;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                    case 'llm_input':
                    case 'llm_output':
                        cost = (tabFormData.tokens / 1000) * provider.costPer1kTokens;
                        usage = tabFormData.tokens;
                        unit = 'tokens';
                        break;
                    case 'tts':
                        cost = (tabFormData.characters / 1000) * provider.costPer1kChars;
                        usage = tabFormData.characters;
                        unit = 'characters';
                        break;
                    case 'ai_avatar':
                        cost = tabFormData.minutes * provider.costPerMinute;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                    case 'voice_cloning':
                        cost = tabFormData.voices * provider.costPerVoice;
                        usage = tabFormData.voices;
                        unit = 'voices';
                        break;
                    case 'rtc':
                        cost = (tabFormData.minutes / 1000) * provider.costPer1kMinutes;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                    case 'rtc':
                        cost = (tabFormData.minutes / 1000) * provider.costPer1kMinutes;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                }

                allData.push({
                    name: tabNames[tab],
                    cost: cost,
                    usage: usage,
                    provider: provider.name,
                    unit: unit,
                    color: COLORS[tabs.indexOf(tab) % COLORS.length]
                });
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
            const unitCost = item.usage > 0 ? (item.cost / item.usage).toFixed(6) : '0';
            const unitCostDisplay = item.unit === 'tokens' || item.unit === 'characters' || (item.unit === 'minutes' && item.name === 'RTC')
                ? `$${(parseFloat(unitCost) * 1000).toFixed(6)}/1k ${item.unit}`
                : `$${unitCost}/${item.unit}`;

            exportData.push([
                item.name,
                item.provider,
                item.usage,
                unitCostDisplay,
                `$${item.cost.toFixed(2)}`
            ]);
        });

        const missingServices = [];
        const tabs = ['conversational_ai', 'asr', 'llm_input', 'llm_output', 'tts', 'ai_avatar', 'voice_cloning', 'rtc'];
        const tabNames = {
            'conversational_ai': 'Conversational AI Engine',
            'asr': 'ASR',
            'llm_input': 'LLM Input',
            'llm_output': 'LLM Output',
            'tts': 'TTS',
            'ai_avatar': 'AI-Avatar',
            'voice_cloning': 'Voice Cloning',
            'rtc': 'RTC'
        };

        tabs.forEach(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasUsage = tabFormData.minutes > 0 || tabFormData.tokens > 0 || tabFormData.characters > 0 || tabFormData.voices > 0;
            
            if (!hasProvider || !hasUsage) {
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

        const tabs = ['asr', 'llm_input', 'llm_output', 'tts', 'ai_avatar', 'voice_cloning', 'rtc'];
        const tabNames = {
            'conversational_ai': 'Conversational AI Engine',
            'asr': 'ASR',
            'llm_input': 'LLM Input',
            'llm_output': 'LLM Output',
            'tts': 'TTS',
            'ai_avatar': 'AI-Avatar',
            'voice_cloning': 'Voice Cloning',
            'rtc': 'RTC'
        };

        const allTabsStatus = tabs.map(tab => {
            const tabFormData = formData[tab];
            const hasProvider = tabFormData.provider !== '';
            const hasUsage = tabFormData.minutes > 0 || tabFormData.tokens > 0 || tabFormData.characters > 0 || tabFormData.voices > 0;
            
            if (hasProvider && hasUsage) {
                const provider = PROVIDERS[tab].find(p => p.id === tabFormData.provider);
                let cost = 0;
                let usage = 0;
                let unit = '';

                switch (tab) {
                    case 'conversational_ai':
                        cost = tabFormData.minutes * provider.costPerMinute;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                    case 'asr':
                        cost = tabFormData.minutes * provider.costPerMinute;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                    case 'llm_input':
                    case 'llm_output':
                        cost = (tabFormData.tokens / 1000) * provider.costPer1kTokens;
                        usage = tabFormData.tokens;
                        unit = 'tokens';
                        break;
                    case 'tts':
                        cost = (tabFormData.characters / 1000) * provider.costPer1kChars;
                        usage = tabFormData.characters;
                        unit = 'characters';
                        break;
                    case 'ai_avatar':
                        cost = tabFormData.minutes * provider.costPerMinute;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                    case 'voice_cloning':
                        cost = tabFormData.voices * provider.costPerVoice;
                        usage = tabFormData.voices;
                        unit = 'voices';
                        break;
                    case 'rtc':
                        cost = (tabFormData.minutes / 1000) * provider.costPer1kMinutes;
                        usage = tabFormData.minutes;
                        unit = 'minutes';
                        break;
                }

                return {
                    name: tabNames[tab],
                    status: 'configured',
                    cost: cost,
                    usage: usage,
                    provider: provider.name,
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
                                    <li style={{ marginBottom: '0.25rem' }}>• Cost per {item.unit === 'tokens' || item.unit === 'characters' || (item.unit === 'minutes' && item.name === 'RTC') ? '1k ' + item.unit : item.unit}: ${
                                        item.unit === 'tokens' || item.unit === 'characters' || (item.unit === 'minutes' && item.name === 'RTC')
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
        switch (activeTab) {
            case 'conversational_ai':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label htmlFor="conversational-ai-provider">Conversational AI Engine Provider</label>
                            <select 
                                id="conversational-ai-provider"
                                value={formData.conversational_ai.provider}
                                onChange={(e) => handleInputChange('conversational_ai', 'provider', e.target.value)}
                            >
                                <option value="">Select Conversational AI Provider</option>
                                {PROVIDERS.conversational_ai.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                            <label htmlFor="asr-provider">ASR Provider</label>
                            <select 
                                id="asr-provider"
                                value={formData.asr.provider}
                                onChange={(e) => handleInputChange('asr', 'provider', e.target.value)}
                            >
                                <option value="">Select ASR Provider</option>
                                {PROVIDERS.asr.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
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
            case 'llm_input':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label htmlFor="llm-input-provider">LLM Input Provider</label>
                            <select 
                                id="llm-input-provider"
                                value={formData.llm_input.provider}
                                onChange={(e) => handleInputChange('llm_input', 'provider', e.target.value)}
                            >
                                <option value="">Select LLM Input Provider</option>
                                {PROVIDERS.llm_input.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="llm-input-tokens">Tokens per month</label>
                            <input
                                id="llm-input-tokens"
                                type="number"
                                min="0"
                                placeholder="e.g., 5000000"
                                value={formData.llm_input.tokens}
                                onChange={(e) => handleInputChange('llm_input', 'tokens', Number(e.target.value))}
                            />
                        </div>
                    </div>
                );
            case 'llm_output':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label htmlFor="llm-output-provider">LLM Output Provider</label>
                            <select 
                                id="llm-output-provider"
                                value={formData.llm_output.provider}
                                onChange={(e) => handleInputChange('llm_output', 'provider', e.target.value)}
                            >
                                <option value="">Select LLM Output Provider</option>
                                {PROVIDERS.llm_output.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="llm-output-tokens">Tokens per month</label>
                            <input
                                id="llm-output-tokens"
                                type="number"
                                min="0"
                                placeholder="e.g., 5000000"
                                value={formData.llm_output.tokens}
                                onChange={(e) => handleInputChange('llm_output', 'tokens', Number(e.target.value))}
                            />
                        </div>
                    </div>
                );
            case 'tts':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label htmlFor="tts-provider">TTS Provider</label>
                            <select 
                                id="tts-provider"
                                value={formData.tts.provider}
                                onChange={(e) => handleInputChange('tts', 'provider', e.target.value)}
                            >
                                <option value="">Select TTS Provider</option>
                                {PROVIDERS.tts.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                            <label htmlFor="avatar-provider">AI-Avatar Provider</label>
                            <select 
                                id="avatar-provider"
                                value={formData.ai_avatar.provider}
                                onChange={(e) => handleInputChange('ai_avatar', 'provider', e.target.value)}
                            >
                                <option value="">Select AI-Avatar Provider</option>
                                {PROVIDERS.ai_avatar.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
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
            case 'voice_cloning':
                return (
                    <div className="tab-content active">
                        <div className="form-group">
                            <label htmlFor="cloning-provider">Voice Cloning Provider</label>
                            <select 
                                id="cloning-provider"
                                value={formData.voice_cloning.provider}
                                onChange={(e) => handleInputChange('voice_cloning', 'provider', e.target.value)}
                            >
                                <option value="">Select Voice Cloning Provider</option>
                                {PROVIDERS.voice_cloning.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="cloning-voices">Number of voices</label>
                            <input
                                id="cloning-voices"
                                type="number"
                                min="0"
                                placeholder="e.g., 5"
                                value={formData.voice_cloning.voices}
                                onChange={(e) => handleInputChange('voice_cloning', 'voices', Number(e.target.value))}
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
                                { key: 'conversational_ai', label: 'Conversational AI' },
                                { key: 'asr', label: 'ASR' },
                                { key: 'llm_input', label: 'LLM Input' },
                                { key: 'llm_output', label: 'LLM Output' },
                                { key: 'tts', label: 'TTS' },
                                { key: 'ai_avatar', label: 'AI-Avatar' },
                                { key: 'voice_cloning', label: 'Voice Cloning' },
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