'use client'

import { useState } from 'react'
import { type Challenge, type ChallengePrompt, type ChallengeProgress } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, CheckCircle, Circle, Calendar, Camera, Film } from 'lucide-react'
import { ProgressEditDialog } from './progress-edit-dialog'
import { format } from 'date-fns'

interface ProgressManagerProps {
  challenge: Challenge
  prompts: ChallengePrompt[]
  progress: ChallengeProgress[]
}

export function ProgressManager({ challenge, prompts, progress }: ProgressManagerProps) {
  const [editingProgress, setEditingProgress] = useState<{
    prompt: ChallengePrompt
    progress: ChallengeProgress | null
  } | null>(null)
  
  // Create a map of progress by prompt_id for quick lookup
  const progressMap = new Map(progress.map(p => [p.prompt_id, p]))
  
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
  
  const handleEditProgress = (prompt: ChallengePrompt) => {
    const promptProgress = progressMap.get(prompt.id) || null
    setEditingProgress({ prompt, progress: promptProgress })
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prompts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.filter(p => p.completed).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos Taken</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.reduce((sum, p) => sum + p.photos_taken, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frames Used</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.reduce((sum, p) => sum + (p.frames_used || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => {
          const status = getPromptStatus(prompt.day_number)
          const promptProgress = progressMap.get(prompt.id)
          const isCompleted = promptProgress?.completed || false
          
          return (
            <Card 
              key={prompt.id} 
              className={`relative ${status.status === 'current' ? 'ring-2 ring-green-500' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
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
                    onClick={() => handleEditProgress(prompt)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {prompt.prompt_text}
                  </p>
                </div>
                
                {promptProgress && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={isCompleted ? "default" : "secondary"}>
                        {isCompleted ? "Completed" : "Not Started"}
                      </Badge>
                    </div>
                    
                    {promptProgress.photos_taken > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Photos:</span>
                        <span className="font-medium">{promptProgress.photos_taken}</span>
                      </div>
                    )}
                    
                    {promptProgress.frames_used && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Frames:</span>
                        <span className="font-medium">{promptProgress.frames_used}</span>
                      </div>
                    )}
                    
                    {promptProgress.completion_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="font-medium">
                          {format(new Date(promptProgress.completion_date), 'MMM d')}
                        </span>
                      </div>
                    )}
                    
                    {promptProgress.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {promptProgress.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {!promptProgress && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      No progress recorded yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {editingProgress && (
        <ProgressEditDialog
          prompt={editingProgress.prompt}
          progress={editingProgress.progress}
          challengeId={challenge.id}
          open={true}
          onOpenChange={(open) => !open && setEditingProgress(null)}
          onSave={() => {
            setEditingProgress(null)
            // Refresh the page to show updated data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}