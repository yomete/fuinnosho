'use client'

import { type ChallengePrompt } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, MapPin, Film, CheckCircle, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { updateChallengeProgress } from '@/app/actions/challenges'
import { toast } from 'sonner'

interface TodaysPromptProps {
  prompt: ChallengePrompt
  currentDay: number
  challengeId?: string
}

export function TodaysPrompt({ prompt, currentDay }: TodaysPromptProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [notes, setNotes] = useState('')
  const [photosTaken, setPhotosTaken] = useState(0)
  const [framesUsed, setFramesUsed] = useState<number | undefined>()
  const [reflection, setReflection] = useState('')

  const handleComplete = async () => {
    if (isCompleting) return
    
    setIsCompleting(true)
    try {
      await updateChallengeProgress(prompt.id, {
        completed: true,
        completion_date: new Date().toISOString().split('T')[0],
        notes,
        photos_taken: photosTaken,
        frames_used: framesUsed,
        reflection,
      })
      
      toast.success('Day completed!')
    } catch (error) {
      toast.error('Failed to save progress')
      console.error(error)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Day {currentDay}: {prompt.title}
          </CardTitle>
          
          <div className="flex gap-2">
            {prompt.location_context && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {prompt.location_context}
              </Badge>
            )}
            {prompt.film_suggestion && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Film className="h-3 w-3" />
                {prompt.film_suggestion}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="h-4 w-4 mt-1 text-primary" />
            <span className="font-medium text-sm">Today&apos;s Prompt</span>
          </div>
          <p className="text-sm leading-relaxed">{prompt.prompt_text}</p>
          
          {prompt.frame_range && (
            <div className="mt-3 text-xs text-muted-foreground">
              📸 {prompt.frame_range}
            </div>
          )}
          
          {prompt.special_notes && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs">
              💡 {prompt.special_notes}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="photos-taken">Photos Taken</Label>
              <Input
                id="photos-taken"
                type="number"
                min="0"
                value={photosTaken}
                onChange={(e) => setPhotosTaken(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="frames-used">Frames Used (optional)</Label>
              <Input
                id="frames-used"
                type="number"
                min="0"
                value={framesUsed || ''}
                onChange={(e) => setFramesUsed(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 3"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="notes">Quick Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Location, settings, observations..."
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="reflection">Reflection</Label>
              <Textarea
                id="reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What did you learn today?"
                rows={2}
              />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleComplete}
          disabled={isCompleting}
          className="w-full"
          size="lg"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isCompleting ? 'Completing...' : 'Complete Day'}
        </Button>
      </CardContent>
    </Card>
  )
}
