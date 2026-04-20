'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Navbar } from '@/components/shared/Navbar'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState('domains')
  const [platforms, setPlatforms] = useState<any[]>([])
  const [socialChannels, setSocialChannels] = useState<any[]>([])
  const [aiModels, setAiModels] = useState<any[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'platforms':
          setPlatforms(await api.getPlatforms())
          break
        case 'social':
          setSocialChannels(await api.getSocialChannels())
          break
        case 'ai-models':
          setAiModels(await api.getAIModels())
          break
        case 'prompts':
          setPrompts(await api.getPrompts())
          break
      }
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'domains', label: 'Domains' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'social', label: 'Social' },
    { id: 'ai-models', label: 'AI Models' },
    { id: 'prompts', label: 'Prompts' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {activeTab === 'domains' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground">Manage your product domains</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Domain management coming soon
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'platforms' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground">Configure selling platforms</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Platform
                  </Button>
                </div>
                <div className="space-y-3">
                  {platforms.map((platform) => (
                    <Card key={platform.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <h3 className="font-semibold">{platform.name}</h3>
                          <p className="text-sm text-muted-foreground">{platform.url || 'No URL'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground">Configure social media channels</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Channel
                  </Button>
                </div>
                <div className="space-y-3">
                  {socialChannels.map((channel) => (
                    <Card key={channel.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <h3 className="font-semibold">{channel.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {channel.caption_max_chars ? `${channel.caption_max_chars} chars` : 'No limit'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ai-models' && (
              <div>
                <p className="text-muted-foreground mb-4">Manage AI models and providers</p>
                <div className="space-y-3">
                  {aiModels.map((model) => (
                    <Card key={model.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <h3 className="font-semibold">{model.name}</h3>
                          <p className="text-sm text-muted-foreground">{model.provider}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            model.status === 'active' ? 'bg-green-100 text-green-700' :
                            model.status === 'rate_limited' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {model.status || 'unknown'}
                          </span>
                          {model.priority && (
                            <span className="text-xs text-muted-foreground">Priority: {model.priority}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'prompts' && (
              <div>
                <p className="text-muted-foreground mb-4">Manage AI prompt templates</p>
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <Card key={prompt.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{prompt.name}</h3>
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                                {prompt.layer}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {prompt.prompt_text?.substring(0, 150)}...
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
