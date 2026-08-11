import { useStore } from '@/AppStore'
import { HotkeyScopeBoundary } from '@/components/HotkeyScopeBoundary'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HOTKEY_SCOPES } from '@/hooks/hotkeys/scopes'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'
import { daemonClient } from '@/lib/daemon'
import { ConfigStatus, Session } from '@/lib/daemon/types'
import { POSTHOG_EVENTS } from '@/lib/telemetry/events'
import {
  getMiniMaxBaseUrl,
  isMiniMaxBaseUrl,
  MINIMAX_DEFAULT_MODEL,
  MINIMAX_ENDPOINTS,
  MINIMAX_MODELS,
  MINIMAX_STORAGE_KEYS,
  type ModelProvider,
} from '@/lib/model-providers'
import { AlertCircle, CheckCircle, Eye, EyeOff, GitBranch, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'

interface ModelSelectorProps {
  session: Session
  onModelChange?: (config: {
    model?: string
    proxyEnabled: boolean
    proxyBaseUrl?: string
    proxyModelOverride?: string
    provider: ModelProvider
  }) => void
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function ModelSelectorContent({
  session,
  onModelChange,
  onClose,
}: Omit<ModelSelectorProps, 'className'> & { onClose: () => void }) {
  const fetchActiveSessionDetail = useStore(state => state.fetchActiveSessionDetail)
  const userSettings = useStore(state => state.userSettings)
  const { trackEvent } = usePostHogTracking()

  const isAdvancedProvidersEnabled = userSettings?.advancedProviders ?? false

  // Parse provider and model from current session
  const getProviderAndModel = () => {
    // Check if the session uses a proxy provider.
    if (session.proxyEnabled && session.proxyModelOverride) {
      // Determine provider based on proxy base URL
      if (isMiniMaxBaseUrl(session.proxyBaseUrl)) {
        return {
          provider: 'minimax' as const,
          model: session.proxyModelOverride,
        }
      } else if (session.proxyBaseUrl && session.proxyBaseUrl.includes('baseten.co')) {
        return {
          provider: 'baseten' as const,
          model: session.proxyModelOverride,
        }
      } else {
        return {
          provider: 'openrouter' as const,
          model: session.proxyModelOverride,
        }
      }
    }

    // Otherwise using Anthropic
    return {
      provider: 'anthropic' as const,
      model: session.model || 'default',
    }
  }

  const initial = getProviderAndModel()
  const [provider, setProvider] = useState<ModelProvider>(initial.provider)
  const [model, setModel] = useState(
    initial.provider === 'anthropic' ? initial.model || 'default' : 'default',
  )
  const [customModel, setCustomModel] = useState(
    initial.provider === 'openrouter'
      ? initial.model
      : initial.provider === 'minimax'
        ? initial.model || MINIMAX_DEFAULT_MODEL
        : '',
  )
  const [miniMaxBaseUrl, setMiniMaxBaseUrl] = useState(
    getMiniMaxBaseUrl(initial.provider === 'minimax' ? session.proxyBaseUrl : undefined),
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)
  const [isCheckingConfig, setIsCheckingConfig] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKey, setApiKey] = useState(() => {
    // Load saved API key from localStorage based on initial provider
    if (initial.provider === 'baseten') {
      return localStorage.getItem('humanlayer-baseten-api-key') || ''
    } else if (initial.provider === 'minimax') {
      return localStorage.getItem(MINIMAX_STORAGE_KEYS.apiKey) || ''
    }
    return localStorage.getItem('humanlayer-openrouter-api-key') || ''
  })
  const [showPassword, setShowPassword] = useState(false)

  // Focus management
  const focusTrapRef = useFocusTrap(true, {
    allowTabNavigation: false,
  })

  // Update local state when session changes
  useEffect(() => {
    const current = getProviderAndModel()
    setProvider(current.provider)
    if (current.provider === 'anthropic') {
      setModel(current.model || 'default')
      setCustomModel('')
    } else {
      setModel('default')
      setCustomModel(
        current.provider === 'minimax' ? current.model || MINIMAX_DEFAULT_MODEL : current.model,
      )
    }

    // Update API key when provider changes
    if (current.provider === 'baseten') {
      setApiKey(localStorage.getItem('humanlayer-baseten-api-key') || '')
    } else if (current.provider === 'openrouter') {
      setApiKey(localStorage.getItem('humanlayer-openrouter-api-key') || '')
    } else if (current.provider === 'minimax') {
      setMiniMaxBaseUrl(getMiniMaxBaseUrl(session.proxyBaseUrl))
      setApiKey(localStorage.getItem(MINIMAX_STORAGE_KEYS.apiKey) || '')
    }
  }, [session.model, session.proxyEnabled, session.proxyModelOverride, session.proxyBaseUrl])

  // Check config status when a proxy provider changes
  useEffect(() => {
    if (provider === 'openrouter' || provider === 'baseten' || provider === 'minimax') {
      setIsCheckingConfig(true)
      daemonClient
        .getConfigStatus()
        .then(setConfigStatus)
        .catch(err => {
          console.error('Failed to check config:', err)
          toast.error('Failed to check configuration')
        })
        .finally(() => setIsCheckingConfig(false))
    }
  }, [provider])

  const handleProviderChange = (newProvider: ModelProvider) => {
    setProvider(newProvider)
    setHasChanges(true)

    // Clear model when switching providers
    if (newProvider === 'anthropic') {
      setModel('default')
      setCustomModel('')
    } else if (newProvider === 'minimax') {
      setCustomModel(MINIMAX_DEFAULT_MODEL)
      setMiniMaxBaseUrl(getMiniMaxBaseUrl(localStorage.getItem(MINIMAX_STORAGE_KEYS.baseUrl)))
      setModel('default')
    } else {
      setCustomModel('')
      setModel('default')
    }

    // Update API key when switching providers
    if (newProvider === 'baseten') {
      setApiKey(localStorage.getItem('humanlayer-baseten-api-key') || '')
    } else if (newProvider === 'openrouter') {
      setApiKey(localStorage.getItem('humanlayer-openrouter-api-key') || '')
    } else if (newProvider === 'minimax') {
      setApiKey(localStorage.getItem(MINIMAX_STORAGE_KEYS.apiKey) || '')
    } else {
      setApiKey('')
    }
  }

  const handleModelChange = (newModel: string) => {
    setModel(newModel)
    setHasChanges(true)
  }

  const handleCustomModelChange = (value: string) => {
    setCustomModel(value)
    setHasChanges(true)
  }

  const canApplyOpenRouter =
    provider !== 'openrouter' ||
    (configStatus?.openrouter?.api_key_configured ?? false) ||
    apiKey.length > 0

  const canApplyBaseten =
    provider !== 'baseten' || (configStatus?.baseten?.api_key_configured ?? false) || apiKey.length > 0

  const canApplyMiniMax =
    provider !== 'minimax' || (configStatus?.minimax?.api_key_configured ?? false) || apiKey.length > 0

  const selectedProviderName =
    provider === 'baseten' ? 'Baseten' : provider === 'minimax' ? 'MiniMax' : 'OpenRouter'

  const canApplySelectedProvider =
    provider === 'baseten'
      ? canApplyBaseten
      : provider === 'minimax'
        ? canApplyMiniMax
        : canApplyOpenRouter

  const handleApply = async () => {
    if (
      (provider === 'openrouter' || provider === 'baseten' || provider === 'minimax') &&
      !customModel.trim()
    ) {
      toast.error(`Model name is required for ${selectedProviderName}`)
      return
    }

    if (!canApplyOpenRouter) {
      toast.error('OpenRouter API key is required')
      return
    }

    if (!canApplyBaseten) {
      toast.error('Baseten API key is required')
      return
    }

    if (!canApplyMiniMax) {
      toast.error('MiniMax API key is required')
      return
    }

    setIsUpdating(true)
    try {
      // Capture previous values for tracking
      const previousProvider = initial.provider
      const previousModel = initial.model

      // Determine provider and model
      let modelValue = ''
      let proxyConfig: any = {}

      if (provider === 'anthropic') {
        modelValue = model === 'default' ? '' : model
        // Clear proxy configuration when switching to Anthropic
        proxyConfig = {
          proxyEnabled: false,
          proxyBaseUrl: undefined,
          proxyModelOverride: undefined,
          proxyApiKey: undefined,
        }
      } else if (provider === 'openrouter') {
        // For OpenRouter, set proxy configuration
        proxyConfig = {
          proxyEnabled: true,
          proxyBaseUrl: 'https://openrouter.ai/api/v1',
          proxyModelOverride: customModel || '',
          // Include API key if user provided one, otherwise backend will use env var
          proxyApiKey: apiKey || undefined,
        }
        modelValue = '' // Clear Anthropic model when using proxy
      } else if (provider === 'baseten') {
        // For Baseten, set proxy configuration
        proxyConfig = {
          proxyEnabled: true,
          proxyBaseUrl: 'https://inference.baseten.co/v1',
          proxyModelOverride: customModel || '',
          // Include API key if user provided one, otherwise backend will use env var
          proxyApiKey: apiKey || undefined,
        }
        modelValue = '' // Clear Anthropic model when using proxy
      } else if (provider === 'minimax') {
        proxyConfig = {
          proxyEnabled: true,
          proxyBaseUrl: miniMaxBaseUrl,
          proxyModelOverride: customModel || MINIMAX_DEFAULT_MODEL,
          proxyApiKey: apiKey || '',
        }
        modelValue = ''
      }

      // Update session with model and proxy configuration (only if session exists)
      if (session.id) {
        await daemonClient.updateSession(session.id, {
          model: modelValue || undefined,
          ...proxyConfig,
        })
      }

      // Save API key to localStorage if provided
      if (apiKey && provider === 'openrouter') {
        localStorage.setItem('humanlayer-openrouter-api-key', apiKey)
      } else if (apiKey && provider === 'baseten') {
        localStorage.setItem('humanlayer-baseten-api-key', apiKey)
      } else if (apiKey && provider === 'minimax') {
        localStorage.setItem(MINIMAX_STORAGE_KEYS.apiKey, apiKey)
      }
      if (provider === 'minimax') {
        localStorage.setItem(MINIMAX_STORAGE_KEYS.baseUrl, miniMaxBaseUrl)
        localStorage.setItem(MINIMAX_STORAGE_KEYS.model, customModel || MINIMAX_DEFAULT_MODEL)
      }

      // Notify parent component with full configuration
      if (onModelChange) {
        onModelChange({
          model: modelValue || undefined,
          proxyEnabled: provider !== 'anthropic',
          proxyBaseUrl: proxyConfig.proxyBaseUrl,
          proxyModelOverride: proxyConfig.proxyModelOverride,
          provider: provider,
        })
      }

      // Track model selection event
      const newModel = provider === 'anthropic' ? modelValue || 'default' : customModel
      trackEvent(POSTHOG_EVENTS.MODEL_SELECTED, {
        model: newModel,
        provider: provider,
        previous_model: previousModel,
        previous_provider: previousProvider,
      })

      // Show appropriate message based on session status and existence
      if (!session.id) {
        toast.success('Model selection saved for new draft')
      } else if (session.status === 'running' || session.status === 'starting') {
        toast.success('Model change will apply at next message')
      } else {
        toast.success('Model updated')
      }

      setHasChanges(false)
      setShowApiKeyInput(false)
      // Don't clear the API key from state - keep it for display
      // setApiKey('') // Clear API key from state after saving

      // Refresh the session data to update the status bar (only if session exists)
      if (session.id) {
        await fetchActiveSessionDetail(session.id)
      }

      // Close modal immediately after successful update
      onClose()
    } catch (error) {
      console.error('Failed to update model:', error)
      toast.error('Failed to update model')
    } finally {
      setIsUpdating(false)
    }
  }

  // Register CMD+ENTER to apply changes
  useHotkeys(
    'mod+enter',
    e => {
      e.preventDefault()
      e.stopPropagation()
      if (
        hasChanges &&
        !isUpdating &&
        (provider !== 'openrouter' || canApplyOpenRouter) &&
        (provider !== 'baseten' || canApplyBaseten) &&
        (provider !== 'minimax' || canApplyMiniMax) &&
        (provider === 'anthropic' || customModel.trim())
      ) {
        handleApply()
      }
    },
    {
      scopes: [HOTKEY_SCOPES.SELECT_MODEL_MODAL],
      enableOnFormTags: true,
    },
  )

  return (
    <div ref={focusTrapRef}>
      <DialogHeader>
        <DialogTitle>Model Configuration</DialogTitle>
        {isAdvancedProvidersEnabled && (
          <DialogDescription>
            Configure the model provider and specific model for this session
          </DialogDescription>
        )}
      </DialogHeader>

      <div className="mt-6 space-y-4">
        {/* Provider Selection */}
        {isAdvancedProvidersEnabled && (
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={provider}
              onValueChange={value => handleProviderChange(value as ModelProvider)}
              disabled={isUpdating}
            >
              <SelectTrigger id="provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="baseten">Baseten</SelectItem>
                <SelectItem value="minimax">MiniMax</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          {provider === 'minimax' ? (
            <Select
              value={customModel || MINIMAX_DEFAULT_MODEL}
              onValueChange={handleCustomModelChange}
              disabled={isUpdating}
            >
              <SelectTrigger id="model" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINIMAX_MODELS.map(miniMaxModel => (
                  <SelectItem key={miniMaxModel} value={miniMaxModel}>
                    {miniMaxModel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : provider === 'openrouter' ? (
            <Input
              id="model"
              type="text"
              value={customModel}
              onChange={e => handleCustomModelChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApply()
                }
              }}
              placeholder="e.g., openai/gpt-oss-120b"
              disabled={isUpdating}
              className="w-full"
            />
          ) : provider === 'baseten' ? (
            <Input
              id="model"
              type="text"
              value={customModel}
              onChange={e => handleCustomModelChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApply()
                }
              }}
              placeholder="e.g., deepseek-ai/DeepSeek-V3.1"
              disabled={isUpdating}
              className="w-full"
            />
          ) : (
            <Select value={model || 'default'} onValueChange={handleModelChange} disabled={isUpdating}>
              <SelectTrigger id="model" className="w-full">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">System Default</SelectItem>
                <SelectItem value="sonnet">Sonnet</SelectItem>
                <SelectItem value="opus">Opus</SelectItem>
                <SelectItem value="haiku">Haiku</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {provider === 'minimax' && (
          <div className="space-y-2">
            <Label htmlFor="minimax-region">Region</Label>
            <Select
              value={miniMaxBaseUrl}
              onValueChange={value => {
                setMiniMaxBaseUrl(getMiniMaxBaseUrl(value))
                setHasChanges(true)
              }}
              disabled={isUpdating}
            >
              <SelectTrigger id="minimax-region" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINIMAX_ENDPOINTS.map(endpoint => (
                  <SelectItem key={endpoint.region} value={endpoint.baseUrl}>
                    {endpoint.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Help Text */}
        {provider === 'anthropic' && isAdvancedProvidersEnabled && (
          <div className="text-muted-foreground">
            <p>Select a model or use the system default</p>
          </div>
        )}

        {/* API Key Status */}
        {(provider === 'openrouter' || provider === 'baseten' || provider === 'minimax') && (
          <div className="space-y-2">
            {!showApiKeyInput ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCheckingConfig ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : canApplySelectedProvider ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span
                    className={canApplySelectedProvider ? 'text-muted-foreground' : 'text-destructive'}
                  >
                    {isCheckingConfig
                      ? `Checking ${selectedProviderName} configuration...`
                      : canApplySelectedProvider
                        ? `${selectedProviderName} API key is configured`
                        : `${selectedProviderName} API key required`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="api-key">{selectedProviderName} API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showPassword ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => {
                        setApiKey(e.target.value)
                        setHasChanges(true)
                      }}
                      placeholder={
                        provider === 'openrouter'
                          ? 'sk-or-...'
                          : `Enter ${selectedProviderName} API key...`
                      }
                      className="h-8 pr-10"
                    />
                    {apiKey && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  {apiKey ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => {
                        setShowApiKeyInput(false)
                        setShowPassword(false)
                        // API key will be saved when Apply is clicked
                      }}
                      type="button"
                    >
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => {
                        setShowApiKeyInput(false)
                        setApiKey('')
                        setShowPassword(false)
                      }}
                      type="button"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground">Your API key will be stored with this session</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} disabled={isUpdating} variant="secondary" size="sm">
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              !hasChanges ||
              isUpdating ||
              (provider === 'openrouter' && !canApplyOpenRouter) ||
              (provider === 'baseten' && !canApplyBaseten) ||
              (provider === 'minimax' && !canApplyMiniMax) ||
              ((provider === 'openrouter' || provider === 'baseten' || provider === 'minimax') &&
                !customModel.trim())
            }
            size="sm"
          >
            {isUpdating ? 'Applying...' : 'Apply'}
            {!isUpdating && (
              <kbd className="ml-1 px-1 py-0.5 text-xs bg-muted/50 rounded">
                {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+ENTER
              </kbd>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main component that handles the dialog
export function ModelSelector({
  session,
  onModelChange,
  className,
  open,
  onOpenChange,
}: ModelSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  return (
    <HotkeyScopeBoundary
      scope={HOTKEY_SCOPES.SELECT_MODEL_MODAL}
      isActive={isOpen}
      rootScopeDisabled={true}
      componentName="ModelSelector"
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* Only show trigger if not controlled externally */}
        {!open && !onOpenChange && (
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${className}`}
              title="Model Configuration"
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        )}

        <DialogContent
          className="max-w-md"
          onInteractOutside={e => {
            // Prevent closing when clicking outside if there are unsaved changes
            e.preventDefault()
          }}
          onEscapeKeyDown={e => {
            // Let the dialog handle escape
            e.stopPropagation()
          }}
        >
          {isOpen && (
            <ModelSelectorContent
              session={session}
              onModelChange={onModelChange}
              onClose={() => setIsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </HotkeyScopeBoundary>
  )
}
