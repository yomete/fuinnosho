'use client'

import { useState } from 'react'
import { type Challenge, type ChallengePrompt } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit } from 'lucide-react'
import { PromptEditDialog } from './prompt-edit-dialog'

interface PromptsManagerProps {
  challenge: Challenge
  prompts: ChallengePrompt[]
}

export function PromptsManager({ challenge, prompts }: PromptsManagerProps) {
  const [editingPrompt, setEditingPrompt] = useState<ChallengePrompt | null>(null)
  
  // Calculate current day
  const getCurrentDay = () => {
    const today = new Date()
    const startDate = new Date(challenge.start_date)
    const diffTime = today.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(diffDays, challenge.total_days))
  }
  
  const currentDay = getCurrentDay()
  
  const getPromptStatus = (dayNumber: number) => {
    if (dayNumber < currentDay) return { status: 'past', label: 'Past', color: 'bg-gray-500' }
    if (dayNumber === currentDay) return { status: 'current', label: 'Today', color: 'bg-green-500' }
    return { status: 'future', label: 'Upcoming', color: 'bg-blue-500' }
  }
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => {
          const status = getPromptStatus(prompt.day_number)
          
          return (
            <Card key={prompt.id} className={`relative ${status.status === 'current' ? 'ring-2 ring-green-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Day {prompt.day_number}
                      <Badge className={`text-white ${status.color}`}>
                        {status.label}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="font-medium">
                      {prompt.title}
                    </CardDescription>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPrompt(prompt)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Prompt</h4>
                  <p className="text-sm text-muted-foreground">
                    {prompt.prompt_text}
                  </p>
                </div>
                
                {prompt.film_suggestion && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Film Suggestion</h4>
                    <p className="text-sm text-muted-foreground">
                      {prompt.film_suggestion}
                    </p>
                  </div>
                )}
                
                {prompt.location_context && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Location Context</h4>
                    <p className="text-sm text-muted-foreground">
                      {prompt.location_context}
                    </p>
                  </div>
                )}
                
                {prompt.frame_range && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Frame Range</h4>
                    <p className="text-sm text-muted-foreground">
                      {prompt.frame_range}
                    </p>
                  </div>
                )}
                
                {prompt.special_notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Special Notes</h4>
                    <p className="text-sm text-muted-foreground">
                      {prompt.special_notes}
                    </p>
                  </div>
                )}
                
                {prompt.phase && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Phase</h4>
                    <Badge variant="outline">{prompt.phase}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {editingPrompt && (
        <PromptEditDialog
          prompt={editingPrompt}
          challengeId={challenge.id}
          open={true}
          onOpenChange={(open) => !open && setEditingPrompt(null)}
          onSave={() => {
            setEditingPrompt(null)
            // Refresh the page to show updated data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}