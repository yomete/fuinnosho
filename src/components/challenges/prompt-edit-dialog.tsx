'use client'

import { useState } from 'react'
import { type ChallengePrompt } from '@/lib/utils'
import { updateChallengePrompt } from '@/app/actions/challenges'
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
import { Loader2 } from 'lucide-react'

interface PromptEditDialogProps {
  prompt: ChallengePrompt
  challengeId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function PromptEditDialog({ 
  prompt, 
  open, 
  onOpenChange, 
  onSave 
}: PromptEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: prompt.title || '',
    prompt_text: prompt.prompt_text || '',
    film_suggestion: prompt.film_suggestion || '',
    location_context: prompt.location_context || '',
    frame_range: prompt.frame_range || '',
    special_notes: prompt.special_notes || '',
    phase: prompt.phase || '',
  })
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await updateChallengePrompt(prompt.id, formData)
      console.log('Prompt updated successfully')
      onSave()
    } catch (error) {
      console.error('Failed to update prompt:', error)
      alert('Failed to update the prompt. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Day {prompt.day_number} Prompt</DialogTitle>
          <DialogDescription>
            Update the details for this challenge prompt
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter prompt title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt_text">Prompt Text</Label>
            <Textarea
              id="prompt_text"
              value={formData.prompt_text}
              onChange={(e) => handleChange('prompt_text', e.target.value)}
              placeholder="Describe the photography challenge for this day"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="film_suggestion">Film Suggestion</Label>
            <Input
              id="film_suggestion"
              value={formData.film_suggestion}
              onChange={(e) => handleChange('film_suggestion', e.target.value)}
              placeholder="e.g., Kodak Portra 400, Ilford HP5+"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location_context">Location Context</Label>
            <Input
              id="location_context"
              value={formData.location_context}
              onChange={(e) => handleChange('location_context', e.target.value)}
              placeholder="e.g., Urban environment, Nature, Studio"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frame_range">Frame Range</Label>
            <Input
              id="frame_range"
              value={formData.frame_range}
              onChange={(e) => handleChange('frame_range', e.target.value)}
              placeholder="e.g., 3-5 frames, 1 roll, 10-15 shots"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phase">Phase</Label>
            <Input
              id="phase"
              value={formData.phase}
              onChange={(e) => handleChange('phase', e.target.value)}
              placeholder="e.g., Week 1, Foundation, Advanced"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="special_notes">Special Notes</Label>
            <Textarea
              id="special_notes"
              value={formData.special_notes}
              onChange={(e) => handleChange('special_notes', e.target.value)}
              placeholder="Any additional notes or tips for this prompt"
              className="min-h-[80px]"
            />
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}