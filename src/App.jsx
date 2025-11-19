import React, { useState, useEffect } from 'react'
import PricingCalculator from './components/PricingCalculator'
import './App.css'

// Updated PROVIDERS data from CSV
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

function App() {
  const [selectedService, setSelectedService] = useState('agent_session');
  const [selectedProviders, setSelectedProviders] = useState({});
  const [selectedModels, setSelectedModels] = useState({});
  const [selectedProviderForModels, setSelectedProviderForModels] = useState(null);
  const [totalPricing, setTotalPricing] = useState({
    byService: {},
    grandTotal: 0,
    serviceCount: 0,
    providerCount: 0
  });

  const handleServiceClick = (serviceId) => {
    setSelectedService(serviceId);
  };

  const handleProviderClick = (provider, serviceId) => {
    setSelectedProviders(prev => {
      const serviceProviders = prev[serviceId] || [];
      const providerExists = serviceProviders.find(p => p.id === provider.id);

      let updatedProviders;
      if (providerExists) {
        // Remove provider if already selected
        updatedProviders = [];
        // Clear selected provider for models if it was this provider
        if (selectedProviderForModels?.id === provider.id) {
          setSelectedProviderForModels(null);
        }
        // Also clear selected model for this service
        setSelectedModels(prevModels => ({
          ...prevModels,
          [serviceId]: null
        }));
      } else {
        // Replace any existing provider with the new one (single selection)
        updatedProviders = [provider];

        // Auto-select model if provider has only one model
        if (provider.models.length === 1) {
          setSelectedModels(prevModels => ({
            ...prevModels,
            [serviceId]: provider.models[0].id
          }));
        } else {
          // Clear previous model selection for this service
          setSelectedModels(prevModels => ({
            ...prevModels,
            [serviceId]: null
          }));
        }

        // Auto-open this provider for model selection
        setSelectedProviderForModels(provider);
      }

      const newSelectedProviders = {
        ...prev,
        [serviceId]: updatedProviders
      };

      
      // Calculate total pricing
      calculateTotalPricing(newSelectedProviders);
      return newSelectedProviders;
    });
  };

  const handleProviderForModelsClick = (provider) => {
    setSelectedProviderForModels(prev =>
      prev?.id === provider.id ? null : provider
    );
  };

  const handleModelSelect = (provider, model) => {
    // Find which service this provider belongs to
    let serviceId = null;
    Object.entries(PROVIDERS).forEach(([sId, serviceData]) => {
      if (serviceData.providers.some(p => p.id === provider.id)) {
        serviceId = sId;
      }
    });

    if (serviceId) {
      setSelectedModels(prev => ({
        ...prev,
        [serviceId]: model.id
      }));
    }
  };

  const isProviderSelected = (providerId, serviceId) => {
    return selectedProviders[serviceId]?.some(p => p.id === providerId) || false;
  };

  useEffect(() => {
    calculateTotalPricing(selectedProviders);
  }, [selectedModels]);

  const calculateProviderCost = (provider) => {
    let totalCost = 0;

    provider.models.forEach(model => {
      let modelCost = 0;

      if (model.unitPrice && !model.pricingUnit?.includes('chars') && !model.inputPrice) {
        // For services with simple unit pricing (ASR, AI Avatar, AI Engine)
        modelCost = model.unitPrice;
      } else if (model.inputPrice && model.outputPrice) {
        // For LLM services with input/output pricing
        const inputTokensPerMinute = 77.13;
        const outputTokensPerMinute = 154.27;
        const inputCost = (inputTokensPerMinute / 1000000) * model.inputPrice;
        const outputCost = (outputTokensPerMinute / 1000000) * model.outputPrice;
        modelCost = inputCost + outputCost;
      } else if (model.pricingUnit?.includes('chars')) {
        // For TTS services (per character pricing)
        const charactersPerMinute = 30082 / 60;
        modelCost = (charactersPerMinute / 1000000) * model.unitPrice;
      }

      totalCost += modelCost;
    });

    return totalCost;
  };

  const calculateTotalPricing = (providers) => {
    const byService = {};
    let grandTotal = 0;
    let serviceCount = 0;
    let providerCount = 0;

    Object.entries(providers).forEach(([serviceId, selectedProviders]) => {
      if (selectedProviders.length > 0) {
        serviceCount++;
        providerCount += selectedProviders.length;

        let serviceTotal = 0;
        selectedProviders.forEach(provider => {
          // Check if there's a specific model selected for this provider/service
          const selectedModelId = selectedModels[serviceId];
          if (selectedModelId) {
            const selectedModel = provider.models.find(m => m.id === selectedModelId);
            if (selectedModel) {
              serviceTotal += calculateSingleModelPrice(selectedModel);
            }
          } else {
            // If no model selected, use default (first model or sum based on your logic)
            serviceTotal += calculateSingleModelPrice(provider.models[0]);
          }
        });

        byService[serviceId] = {
          total: serviceTotal,
          providerCount: selectedProviders.length,
          providers: selectedProviders
        };
        grandTotal += serviceTotal;
      }
    });

    setTotalPricing({
      byService,
      grandTotal,
      serviceCount,
      providerCount
    });
  };

  const calculateSingleModelPrice = (model) => {
    let price = 0;

    if (model.unitPrice && !model.pricingUnit?.includes('chars') && !model.inputPrice) {
      // For services with simple unit pricing (ASR, AI Avatar, AI Engine)
      price = model.unitPrice;
    } else if (model.inputPrice && model.outputPrice) {
      // For LLM services with input/output pricing
      const inputTokensPerMinute = 77.13;
      const outputTokensPerMinute = 154.27;
      const inputCost = (inputTokensPerMinute / 1000000) * model.inputPrice;
      const outputCost = (outputTokensPerMinute / 1000000) * model.outputPrice;
      price = inputCost + outputCost;
    } else if (model.pricingUnit?.includes('chars')) {
      // For TTS services (per character pricing)
      const charactersPerMinute = 30082 / 60;
      price = (charactersPerMinute / 1000000) * model.unitPrice;
    }

    return price;
  };

  const getDisplayName = (provider, model, serviceId) => {
    // If model has a specific name that's not "Default", use it
    if (model.name && model.name !== 'Default') {
      return model.name;
    }

    // Special case for AINS - model name should just be "AINS"
    if (serviceId === 'ains') {
      return 'AINS';
    }

    // If model name is "Default" or empty, generate name from provider and service
    const serviceDisplayName = serviceId.toUpperCase().replace('_', ' ');
    return `${provider.name} ${serviceDisplayName}`;
  };

  const getDisplayPrice = (price) => {
    // Format price to 5 decimal places for consistency
    return price.toFixed(5);
  };

  const groupModelsIntoColumns = (models) => {
    const columns = [];
    for (let i = 0; i < models.length; i += 2) {
      columns.push(models.slice(i, i + 2));
    }
    return columns;
  };

  return (
    <div className="App">
      <div className="flex-container">
        <div className="row row-1">
          <div className="div-label">row1</div>
          Estimate Your Costs
        </div>
        <div className="row row-2">
          <div className="div-label">row2</div>
          <div className="placeholder-box" id="div1">
            <div className="div2">
              <div className="div-label">div2</div>
              <div className="div4">
                <div className="div-label">div4</div>
                <div className="section-heading">Select Service</div>

                {/* Services selection */}
                <div className="services-row">
                  <div className={`service-box ${selectedService === 'agent_session' ? 'selected' : ''}`} onClick={() => handleServiceClick('agent_session')}>
                    Agent Voice
                  </div>
                  <div className={`service-box ${selectedService === 'human_voice' ? 'selected' : ''}`} onClick={() => handleServiceClick('human_voice')}>
                    Human Voice
                  </div>
                  <div className={`service-box ${selectedService === 'ains' ? 'selected' : ''}`} onClick={() => handleServiceClick('ains')}>
                    AINS
                  </div>
                  <div
                    className={`service-box ${selectedService === 'asr' ? 'selected' : ''}`}
                    onClick={() => handleServiceClick('asr')}
                  >
                    ASR
                  </div>
                  <div className={`service-box ${selectedService === 'llm' ? 'selected' : ''}`} onClick={() => handleServiceClick('llm')}>
                    LLM
                  </div>
                  <div className={`service-box ${selectedService === 'tts' ? 'selected' : ''}`} onClick={() => handleServiceClick('tts')}>
                    TTS
                  </div>
                  <div className={`service-box ${selectedService === 'ai_avatar' ? 'selected' : ''}`} onClick={() => handleServiceClick('ai_avatar')}>
                    AI Avatar
                  </div>
                </div>
              </div>
              <div className="div5">
                <div className="div-label">div5</div>
                <div className="section-heading">Select Provider</div>

                {/* Providers selection */}
                <div className="providers-row">
                  {PROVIDERS[selectedService]?.providers?.map((provider) => (
                    <div
                      key={provider.id}
                      className={`provider-box ${isProviderSelected(provider.id, selectedService) ? 'selected' : ''}`}
                      onClick={() => handleProviderClick(provider, selectedService)}
                    >
                      {provider.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="div6">
                <div className="div-label">div6</div>
                <div className="section-heading">Select Model</div>
                <div className="models-selection-display">
                  {selectedProviderForModels ? (
                    <div className="models-columns-container">
                        {groupModelsIntoColumns(selectedProviderForModels.models).map((column, columnIndex) => (
                          <div key={columnIndex} className="models-column">
                            {column.map((model) => {
                              // Check if this model is currently selected
                              const isModelSelected = selectedModels[selectedService] === model.id;
                              return (
                                <label key={model.id} className="model-radio-item">
                                  <input
                                    type="radio"
                                    name={`provider-${selectedProviderForModels.id}-model`}
                                    value={model.id}
                                    className="model-radio"
                                    checked={isModelSelected}
                                    onChange={() => handleModelSelect(selectedProviderForModels, model)}
                                  />
                                  <div className="model-radio-content">
                                    <div className="model-radio-name">{getDisplayName(selectedProviderForModels, model, selectedService)}</div>
                                    <div className="model-radio-price-container">
                                      <div className="model-radio-price">${getDisplayPrice(calculateSingleModelPrice(model))}/minute</div>
                                      <div className="model-radio-unit">{model.pricingUnit}</div>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                  ) : (
                    <div className="no-models-selected">
                      <div className="no-models-text">Select a provider to view models</div>
                      <div className="no-models-hint">Click on a selected provider below to see their available models</div>

                      {/* Show selected providers for clicking */}
                      {Object.values(selectedProviders).flat().length > 0 && (
                        <div className="selected-providers-list">
                          <div className="selected-providers-title">Selected Providers:</div>
                          <div className="selected-providers-grid">
                            {Object.entries(selectedProviders).map(([serviceId, providers]) => (
                              providers.map((provider) => {
                                const selectedModelId = selectedModels[serviceId];
                                const selectedModel = provider.models.find(m => m.id === selectedModelId);
                                return (
                                  <div
                                    key={provider.id}
                                    className="selected-provider-item"
                                    onClick={() => handleProviderForModelsClick(provider)}
                                  >
                                    {provider.name}
                                    <div className="provider-service">{serviceId.toUpperCase().replace('_', ' ')}</div>
                                    {selectedModel && (
                                      <div className="provider-model">{getDisplayName(provider, selectedModel, serviceId)}</div>
                                    )}
                                  </div>
                                );
                              })
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="div3">
              <div className="div-label">div3</div>
              <div className="total-pricing-display">
                <div className="total-pricing-header">Total Pricing</div>

                {totalPricing.serviceCount > 0 ? (
                  <>
                    <div className="grand-total-container">
                      <div className="grand-total-label">Grand Total</div>
                      <div className="grand-total-amount">${getDisplayPrice(totalPricing.grandTotal)}</div>
                      <div className="grand-total-unit">per minute</div>
                    </div>

                    <div className="selection-summary">
                      <div className="summary-stats">
                        <div className="stat-item">
                          <div className="stat-number">{totalPricing.serviceCount}</div>
                          <div className="stat-label">Services</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{totalPricing.providerCount}</div>
                          <div className="stat-label">Providers</div>
                        </div>
                      </div>
                    </div>

                    <div className="service-breakdown">
                      <div className="breakdown-header">Service Breakdown</div>
                      {Object.entries(totalPricing.byService).map(([serviceId, serviceData]) => (
                        <div key={serviceId} className={`service-item ${serviceId}`}>
                          <div className="service-info">
                            <div className="service-name">{serviceId.toUpperCase().replace('_', ' ')}</div>
                            <div className="service-providers">{serviceData.providerCount} provider{serviceData.providerCount !== 1 ? 's' : ''}</div>
                          </div>
                          <div className="service-total">${getDisplayPrice(serviceData.total)}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="no-selections">
                    <div className="no-selection-text">Select providers to calculate total pricing</div>
                    <div className="selection-hint">Click providers across different services to build your configuration</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PricingCalculator />
    </div>
  )
}

export default App
