'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wand2, Zap, Calendar } from 'lucide-react'
import { TemplateManager } from './template-manager'
import type { ChallengeTemplate } from '@/lib/challenge-templates'

export function ChallengeSetup() {
  const [isCreating, setIsCreating] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')

  const getDefaultStartDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const calculateEndDate = (startDate: string, totalDays: number) => {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + totalDays - 1)
    return end.toISOString().split('T')[0]
  }

  const handleImportTemplate = async (template: ChallengeTemplate) => {
    setIsCreating(true)
    try {
      const { createChallenge, createChallengePrompts } = await import('@/app/actions/challenges')
      
      // Use custom start date or default to today
      const startDate = customStartDate || getDefaultStartDate()
      const endDate = calculateEndDate(startDate, template.total_days)
      
      // Create the challenge
      const challengeId = await createChallenge({
        name: template.name,
        description: template.description,
        start_date: startDate,
        end_date: endDate,
        total_days: template.total_days,
      })
      
      // Create the prompts
      const promptsWithChallengeId = template.prompts.map(prompt => ({
        ...prompt,
        challenge_id: challengeId
      }))
      
      await createChallengePrompts(promptsWithChallengeId)
      
      // Redirect to challenge page
      window.location.href = '/challenge'
    } catch (error) {
      console.error('Failed to import template:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreate100Days = async () => {
    setIsCreating(true)
    try {
      const { createChallenge, createChallengePrompts } = await import('@/app/actions/challenges')
      const { challenge100Days } = await import('@/lib/challenge-data')
      
      // Use custom start date or default to today
      const startDate = customStartDate || getDefaultStartDate()
      const endDate = calculateEndDate(startDate, challenge100Days.total_days)
      
      // Create the challenge
      const challengeId = await createChallenge({
        name: challenge100Days.name,
        description: challenge100Days.description,
        start_date: startDate,
        end_date: endDate,
        total_days: challenge100Days.total_days,
      })
      
      // Create the prompts
      const promptsWithChallengeId = challenge100Days.prompts.map(prompt => ({
        ...prompt,
        challenge_id: challengeId
      }))
      
      await createChallengePrompts(promptsWithChallengeId)
      
      // Redirect to challenge page
      window.location.href = '/challenge'
    } catch (error) {
      console.error('Failed to create challenge:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Setup Your Photography Challenge</CardTitle>
          <p className="text-muted-foreground">
            Get started with your 100-day film photography journey
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="flex flex-col items-center gap-4">
                <Wand2 className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">100 Days Film Challenge</h3>
                <p className="text-sm text-muted-foreground max-w-sm text-center">
                  Import your pre-designed 100-day challenge with daily prompts, 
                  film recommendations, and travel planning.
                </p>
                
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      Challenge Start Date
                    </Label>
                  </div>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full"
                    placeholder={getDefaultStartDate()}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Leave blank to start today ({getDefaultStartDate()})
                  </p>
                </div>
                
                <Button 
                  onClick={handleCreate100Days}
                  disabled={isCreating}
                  size="lg"
                  className="mt-2"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isCreating ? 'Creating...' : 'Import 100-Day Challenge'}
                </Button>
              </div>
            </div>
            
          </div>
          
          {/* Template Manager */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Import Custom Template</h3>
            <TemplateManager onImport={handleImportTemplate} />
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What you&apos;ll get:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 100 unique daily photography prompts</li>
              <li>• Film roll and frame tracking</li>
              <li>• Travel-aware prompts for your trips</li>
              <li>• Progress tracking and streaks</li>
              <li>• Integration with your film inventory</li>
              <li>• Portfolio building tools</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
