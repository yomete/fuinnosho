'use client'

import { useState } from 'react'
import { type ChallengePrompt, type ChallengeProgress } from '@/lib/utils'
import { updateChallengeProgress } from '@/app/actions/challenges'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface ProgressEditDialogProps {
  prompt: ChallengePrompt
  progress: ChallengeProgress | null
  challengeId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function ProgressEditDialog({ 
  prompt, 
  progress, 
  open, 
  onOpenChange, 
  onSave 
}: ProgressEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    completed: progress?.completed || false,
    photos_taken: progress?.photos_taken || 0,
    frames_used: progress?.frames_used || 0,
    notes: progress?.notes || '',
    reflection: progress?.reflection || '',
    completion_date: progress?.completion_date 
      ? format(new Date(progress.completion_date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
  })
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const updateData = {
        ...formData,
        completion_date: formData.completed ? formData.completion_date : undefined,
      }
      
      await updateChallengeProgress(prompt.id, updateData)
      
      console.log('Progress updated successfully')
      onSave()
    } catch (error) {
      console.error('Failed to update progress:', error)
      alert('Failed to update progress. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Progress - Day {prompt.day_number}</DialogTitle>
          <DialogDescription>
            Update your progress for &ldquo;{prompt.title}&rdquo;
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="completed"
              checked={formData.completed}
              onCheckedChange={(checked) => handleChange('completed', !!checked)}
            />
            <Label htmlFor="completed" className="text-sm font-medium">
              Mark as completed
            </Label>
          </div>
          
          {formData.completed && (
            <div className="space-y-2">
              <Label htmlFor="completion_date">Completion Date</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => handleChange('completion_date', e.target.value)}
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="photos_taken">Photos Taken</Label>
              <Input
                id="photos_taken"
                type="number"
                min="0"
                value={formData.photos_taken}
                onChange={(e) => handleChange('photos_taken', parseInt(e.target.value) || 0)}
                placeholder="Number of photos"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="frames_used">Frames Used</Label>
              <Input
                id="frames_used"
                type="number"
                min="0"
                value={formData.frames_used}
                onChange={(e) => handleChange('frames_used', parseInt(e.target.value) || 0)}
                placeholder="Number of frames"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any notes about your session (location, settings, etc.)"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reflection">Reflection</Label>
            <Textarea
              id="reflection"
              value={formData.reflection}
              onChange={(e) => handleChange('reflection', e.target.value)}
              placeholder="What did you learn? How did it go? What would you do differently?"
              className="min-h-[100px]"
            />
          </div>
          
          {/* Show prompt details for reference */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium">Prompt Details</h4>
            <p className="text-sm text-muted-foreground">{prompt.prompt_text}</p>
            {prompt.film_suggestion && (
              <p className="text-xs text-muted-foreground">
                <strong>Film:</strong> {prompt.film_suggestion}
              </p>
            )}
            {prompt.frame_range && (
              <p className="text-xs text-muted-foreground">
                <strong>Frames:</strong> {prompt.frame_range}
              </p>
            )}
          </div>
        </form>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}