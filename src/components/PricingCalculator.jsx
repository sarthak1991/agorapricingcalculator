import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const COLORS = {
    agent_session: { name: 'Coral Red', hex: '#FF6B6B' },
    human_voice: { name: 'Turquoise', hex: '#4ECDC4' },
    ains: { name: 'Sunny Yellow', hex: '#FFE66D' },
    asr: { name: 'Mint Green', hex: '#95E1D3' },
    llm: { name: 'Salmon Pink', hex: '#F38181' },
    tts: { name: 'Soft Purple', hex: '#AA96DA' },
    ai_avatar: { name: 'Golden Orange', hex: '#FCBF49' }
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
                        name: 'Audio Basic Task AGENT VOICE',
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
            },
            {
                id: 'openai-beta-asr',
                name: 'OpenAI (Beta)',
                models: [
                    {
                        id: 'whisper-legacy',
                        name: 'Whisper (legacy / whisper-1)',
                        pricingUnit: 'per min',
                        unitPrice: 0.006,
                        notes: 'Standard transcription rate for the OpenAI Whisper ASR model'
                    },
                    {
                        id: 'gpt-4o-transcribe',
                        name: 'GPT-4o Transcribe',
                        pricingUnit: 'per min',
                        unitPrice: 0.006,
                        notes: 'Newer transcription model with improved accuracy'
                    },
                    {
                        id: 'gpt-4o-transcribe-diarization',
                        name: 'GPT-4o Transcribe with Diarization',
                        pricingUnit: 'per min',
                        unitPrice: 0.006,
                        notes: 'Includes speaker identification'
                    },
                    {
                        id: 'gpt-4o-mini-transcribe',
                        name: 'GPT-4o Mini Transcribe',
                        pricingUnit: 'per min',
                        unitPrice: 0.003,
                        notes: 'Lower-cost, budget-friendly ASR option'
                    }
                ]
            },
            {
                id: 'amazon-transcribe-asr',
                name: 'Amazon Transcribe',
                models: [
                    {
                        id: 'standard-batch',
                        name: 'Standard Batch',
                        pricingUnit: 'per min',
                        unitPrice: 0.024,
                        notes: 'Standard batch transcription pricing'
                    },
                    {
                        id: 'standard-streaming',
                        name: 'Standard Streaming',
                        pricingUnit: 'per min',
                        unitPrice: 0.024,
                        notes: 'Standard real-time streaming transcription'
                    },
                    {
                        id: 'medical',
                        name: 'Medical',
                        pricingUnit: 'per min',
                        unitPrice: 0.075,
                        notes: 'Medical dictation and conversation transcription'
                    },
                    {
                        id: 'pii-redaction-batch',
                        name: 'PII Redaction Batch',
                        pricingUnit: 'per min',
                        unitPrice: 0.0264,
                        notes: 'Batch transcription with PII redaction (10% surcharge)'
                    },
                    {
                        id: 'pii-redaction-streaming',
                        name: 'PII Redaction Streaming',
                        pricingUnit: 'per min',
                        unitPrice: 0.0264,
                        notes: 'Streaming transcription with PII redaction (10% surcharge)'
                    },
                    {
                        id: 'clm-batch',
                        name: 'CLM Batch',
                        pricingUnit: 'per min',
                        unitPrice: 0.006,
                        notes: 'Call analytics LM batch processing'
                    },
                    {
                        id: 'clm-streaming',
                        name: 'CLM Streaming',
                        pricingUnit: 'per min',
                        unitPrice: 0.006,
                        notes: 'Call analytics LM streaming'
                    }
                ]
            },
            {
                id: 'assemblyai-asr',
                name: 'AssemblyAI',
                models: [
                    {
                        id: 'universal',
                        name: 'Universal',
                        pricingUnit: 'per min',
                        unitPrice: 0.0025,
                        notes: 'General-purpose speech-to-text model'
                    },
                    {
                        id: 'universal-streaming',
                        name: 'Universal-Streaming',
                        pricingUnit: 'per min',
                        unitPrice: 0.0025,
                        notes: 'Real-time streaming transcription'
                    },
                    {
                        id: 'universal-streaming-multilingual',
                        name: 'Universal-Streaming Multilingual',
                        pricingUnit: 'per min',
                        unitPrice: 0.0025,
                        notes: 'Multilingual streaming transcription support'
                    },
                    {
                        id: 'slam-1',
                        name: 'Slam-1',
                        pricingUnit: 'per min',
                        unitPrice: 0.0045,
                        notes: 'SLAM audio language model'
                    }
                ]
            },
            {
                id: 'google-cloud-asr',
                name: 'Google Cloud',
                models: [
                    {
                        id: 'v2-standard',
                        name: 'V2 Standard',
                        pricingUnit: 'per min',
                        unitPrice: 0.016,
                        notes: 'Google Speech-to-Text V2 standard model'
                    },
                    {
                        id: 'v2-dynamic-batch',
                        name: 'V2 Dynamic Batch',
                        pricingUnit: 'per min',
                        unitPrice: 0.003,
                        notes: 'Dynamic batch processing with lower rates'
                    },
                    {
                        id: 'v1-standard-with-logging',
                        name: 'V1 Standard (with data logging)',
                        pricingUnit: 'per min',
                        unitPrice: 0.016,
                        notes: 'V1 standard model with data logging enabled'
                    },
                    {
                        id: 'v1-standard-without-logging',
                        name: 'V1 Standard (without data logging)',
                        pricingUnit: 'per min',
                        unitPrice: 0.024,
                        notes: 'V1 standard model without data logging'
                    },
                    {
                        id: 'medical-dictation',
                        name: 'Medical Dictation',
                        pricingUnit: 'per min',
                        unitPrice: 0.078,
                        notes: 'Medical dictation transcription'
                    },
                    {
                        id: 'medical-conversation',
                        name: 'Medical Conversation',
                        pricingUnit: 'per min',
                        unitPrice: 0.078,
                        notes: 'Medical conversation transcription'
                    }
                ]
            },
            {
                id: 'speechmatics-asr',
                name: 'Speechmatics',
                models: [
                    {
                        id: 'standard-accuracy',
                        name: 'Standard Accuracy',
                        pricingUnit: 'per min',
                        unitPrice: 0.004,
                        notes: 'Standard accuracy speech recognition'
                    },
                    {
                        id: 'enhanced-accuracy',
                        name: 'Enhanced Accuracy',
                        pricingUnit: 'per min',
                        unitPrice: 0.004,
                        notes: 'Enhanced accuracy model for improved transcription'
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
            },
            {
                id: 'openai-speech-to-speech',
                name: 'OpenAI speech to speech',
                models: [
                    {
                        id: 'gpt-4o-realtime',
                        name: 'gpt-4o (via Realtime API)',
                        pricingUnit: 'per min',
                        unitPrice: 0.30,
                        notes: 'Speech-to-speech via OpenAI Realtime API'
                    }
                ]
            },
            {
                id: 'gemini-speech-to-speech',
                name: 'Gemini speech to speech',
                models: [
                    {
                        id: 'gemini-2.0-flash-live',
                        name: 'gemini-2.0-flash-live',
                        pricingUnit: 'per min',
                        unitPrice: 0.17,
                        notes: 'Speech-to-speech via Gemini Live API'
                    }
                ]
            },
            {
                id: 'groq',
                name: 'Groq',
                models: [
                    {
                        id: 'llama-3.3-70b-versatile',
                        name: 'Llama 3.3 70B Versatile',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.59,
                        outputPrice: 0.79,
                        notes: 'Meta Llama 3.3 70B on Groq'
                    },
                    {
                        id: 'llama-3.1-70b-versatile',
                        name: 'Llama 3.1 70B Versatile',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.59,
                        outputPrice: 0.79,
                        notes: 'Meta Llama 3.1 70B on Groq'
                    },
                    {
                        id: 'llama-3-70b-versatile',
                        name: 'Llama 3 70B Versatile',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.59,
                        outputPrice: 0.79,
                        notes: 'Meta Llama 3 70B on Groq'
                    },
                    {
                        id: 'llama-3.3-8b-instant',
                        name: 'Llama 3.3 8B Instant',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.05,
                        outputPrice: 0.08,
                        notes: 'Meta Llama 3.3 8B on Groq'
                    },
                    {
                        id: 'llama-3.1-8b-instant',
                        name: 'Llama 3.1 8B Instant',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.05,
                        outputPrice: 0.08,
                        notes: 'Meta Llama 3.1 8B on Groq'
                    },
                    {
                        id: 'gemma2-9b-it',
                        name: 'Gemma2 9B IT',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.20,
                        outputPrice: 0.20,
                        notes: 'Google Gemma2 9B on Groq'
                    },
                    {
                        id: 'mixtral-8x7b-32768',
                        name: 'Mixtral 8x7B-32768',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.24,
                        outputPrice: 0.24,
                        notes: 'Mistral AI Mixtral 8x7B on Groq'
                    },
                    {
                        id: 'mistral-7b-instruct-v0.3',
                        name: 'Mistral 7B Instruct v0.3',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.07,
                        outputPrice: 0.07,
                        notes: 'Mistral AI 7B Instruct on Groq'
                    },
                    {
                        id: 'distil-whisper-large-v3-en',
                        name: 'Distil Whisper Large v3 en',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.07,
                        outputPrice: 0.07,
                        notes: 'Distil Whisper ASR model'
                    }
                ]
            },
            {
                id: 'amazon-bedrock',
                name: 'Amazon Bedrock',
                models: [
                    {
                        id: 'anthropic-claude-3.5-sonnet',
                        name: 'Anthropic Claude 3.5 Sonnet',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 3,
                        outputPrice: 15,
                        notes: 'Via Amazon Bedrock'
                    },
                    {
                        id: 'anthropic-claude-3-haiku',
                        name: 'Anthropic Claude 3 Haiku',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.25,
                        outputPrice: 1.25,
                        notes: 'Via Amazon Bedrock'
                    },
                    {
                        id: 'anthropic-claude-3-opus',
                        name: 'Anthropic Claude 3 Opus',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 15,
                        outputPrice: 75,
                        notes: 'Via Amazon Bedrock'
                    },
                    {
                        id: 'meta-llama-3.1-405b-instruct',
                        name: 'Meta Llama 3.1 405B Instruct',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 2.80,
                        outputPrice: 2.80,
                        notes: 'Via Amazon Bedrock On-Demand'
                    },
                    {
                        id: 'meta-llama-3.1-70b-instruct',
                        name: 'Meta Llama 3.1 70B Instruct',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.99,
                        outputPrice: 0.99,
                        notes: 'Via Amazon Bedrock On-Demand'
                    },
                    {
                        id: 'meta-llama-3.1-8b-instruct',
                        name: 'Meta Llama 3.1 8B Instruct',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.30,
                        outputPrice: 0.30,
                        notes: 'Via Amazon Bedrock On-Demand'
                    },
                    {
                        id: 'meta-llama-3-70b-instruct',
                        name: 'Meta Llama 3 70B Instruct',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 2.65,
                        outputPrice: 2.65,
                        notes: 'Via Amazon Bedrock On-Demand'
                    },
                    {
                        id: 'mistral-ai-mistral-large',
                        name: 'Mistral AI Mistral Large',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 4.00,
                        outputPrice: 12.00,
                        notes: 'Via Amazon Bedrock (Latest: mistral.mistral-large-2407)'
                    },
                    {
                        id: 'mistral-ai-mixtral-8x7b',
                        name: 'Mistral AI Mixtral 8x7B',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.55,
                        outputPrice: 0.55,
                        notes: 'Via Amazon Bedrock On-Demand'
                    },
                    {
                        id: 'mistral-ai-mistral-7b',
                        name: 'Mistral AI Mistral 7B',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.15,
                        outputPrice: 0.15,
                        notes: 'Via Amazon Bedrock On-Demand'
                    },
                    {
                        id: 'amazon-titan-text-premier',
                        name: 'Amazon Titan Text Premier',
                        pricingUnit: 'per 1M tokens',
                        inputPrice: 0.30,
                        outputPrice: 0.40,
                        notes: 'Via Amazon Bedrock On-Demand'
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
    },
    human_voice: {
        providers: [
            {
                id: 'audio-rtc',
                name: 'Audio RTC',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per min',
                        unitPrice: 0.00099,
                        notes: 'Audio RTC pricing'
                    }
                ]
            }
        ]
    },
    ains: {
        providers: [
            {
                id: 'agora-ai-noise-suppression',
                name: 'Agora AI Noise Suppression',
                models: [
                    {
                        id: 'default',
                        name: 'Default',
                        pricingUnit: 'per min',
                        unitPrice: 0.00059,
                        notes: 'AI Noise Suppression pricing'
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
        ai_avatar: { provider: 'akool', model: 'default' },
        human_voice: { provider: 'audio-rtc', model: 'default' },
        ains: { provider: 'agora-ai-noise-suppression', model: 'default' }
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
            ai_avatar: 0,
            human_voice: 0,
            ains: 0
        };

        // Agent voice
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
                if (model.unitPrice) {
                    // Speech-to-speech models use per-minute pricing
                    costs.llm = model.unitPrice;
                } else {
                    // Traditional LLM models use token-based pricing
                    const tokens = calculateLLMTokens();
                    const inputCost = (tokens.inputTokens / 1000000) * model.inputPrice;
                    const outputCost = (tokens.outputTokens / 1000000) * model.outputPrice;
                    costs.llm = inputCost + outputCost;
                }
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

        // Human Voice
        if (formData.human_voice.provider && formData.human_voice.model) {
            const provider = PROVIDERS.human_voice.providers.find(p => p.id === formData.human_voice.provider);
            const model = provider?.models.find(m => m.id === formData.human_voice.model);
            if (model) {
                costs.human_voice = model.unitPrice;
            }
        }

        // AINS
        if (formData.ains.provider && formData.ains.model) {
            const provider = PROVIDERS.ains.providers.find(p => p.id === formData.ains.provider);
            const model = provider?.models.find(m => m.id === formData.ains.model);
            if (model) {
                costs.ains = model.unitPrice;
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
                    `$${calculatedCosts[service]?.toFixed(5) || 0}/min`
                ]);
            }
        });

        exportData.push([], ['Total:', '', '', `$${calculatedCosts.total.toFixed(5)}/min`]);

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