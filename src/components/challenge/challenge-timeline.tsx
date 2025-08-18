'use client'

import { type ChallengePrompt, type ChallengeProgress } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, MapPin, Film, Camera } from 'lucide-react'
import { useState } from 'react'

interface ChallengeTimelineProps {
  prompts: ChallengePrompt[]
  progress: ChallengeProgress[]
  currentDay: number
  challengeId?: string
}

// Group prompts by week/phase
const timelinePhases = [
  { name: "Foundation Building", start: 1, end: 10, color: "blue" },
  { name: "Corfu Offsite", start: 11, end: 17, color: "green" },
  { name: "Post-Corfu Integration", start: 18, end: 21, color: "blue" },
  { name: "Montenegro Wedding", start: 22, end: 24, color: "purple" },
  { name: "Post-Wedding Reflection", start: 25, end: 28, color: "blue" },
  { name: "Cinematic Experiments", start: 29, end: 35, color: "orange" },
  { name: "First HP5 Week", start: 36, end: 42, color: "gray" },
  { name: "Malta Offsite", start: 43, end: 45, color: "green" },
  { name: "Pre-Japan Preparation", start: 46, end: 50, color: "blue" },
  { name: "Japan Honeymoon", start: 51, end: 71, color: "red" },
  { name: "Japan Integration", start: 72, end: 78, color: "blue" },
  { name: "Documentary Project", start: 79, end: 85, color: "teal" },
  { name: "Experimental Week", start: 86, end: 92, color: "violet" },
  { name: "Final Portfolio", start: 93, end: 100, color: "gold" }
]

export function ChallengeTimeline({ prompts, progress, currentDay }: ChallengeTimelineProps) {
  const [expandedPhases, setExpandedPhases] = useState<number[]>([
    // Auto-expand current phase and next phase
    timelinePhases.findIndex(phase => currentDay >= phase.start && currentDay <= phase.end),
    timelinePhases.findIndex(phase => currentDay >= phase.start && currentDay <= phase.end) + 1
  ].filter(i => i >= 0))

  const togglePhase = (index: number) => {
    setExpandedPhases(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const getProgressForPrompt = (promptId: string) => {
    return progress.find(p => p.prompt_id === promptId)
  }

  return (
    <div className="space-y-4">
      {timelinePhases.map((phase, phaseIndex) => {
        const phasePrompts = prompts.filter(p => 
          p.day_number >= phase.start && p.day_number <= phase.end
        )
        const completedInPhase = phasePrompts.filter(p => 
          getProgressForPrompt(p.id)?.completed
        ).length
        const isCurrentPhase = currentDay >= phase.start && currentDay <= phase.end
        const isExpanded = expandedPhases.includes(phaseIndex)
        
        return (
          <Card key={phase.name} className={isCurrentPhase ? 'border-primary' : ''}>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => togglePhase(phaseIndex)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div>
                        <CardTitle className="text-lg">{phase.name}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          Days {phase.start}-{phase.end} • {completedInPhase}/{phasePrompts.length} completed
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isCurrentPhase && (
                        <Badge variant="default">Current</Badge>
                      )}
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round((completedInPhase / phasePrompts.length) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {phasePrompts.map((prompt) => {
                      const promptProgress = getProgressForPrompt(prompt.id)
                      const isCompleted = promptProgress?.completed || false
                      const isCurrent = prompt.day_number === currentDay
                      
                      
                      return (
                        <div 
                          key={prompt.id}
                          className={`
                            p-4 rounded-lg border transition-all
                            ${isCurrent ? 'border-primary bg-primary/5' : 'border-muted'}
                            ${isCompleted ? 'bg-green-50 dark:bg-green-950/20' : ''}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Circle className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                              )}
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                                  Day {prompt.day_number}: {prompt.title}
                                </span>
                                
                                {isCurrent && (
                                  <Badge variant="default" className="text-xs">Today</Badge>
                                )}
                                
                                {prompt.location_context && (
                                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {prompt.location_context}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {prompt.prompt_text}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {prompt.film_suggestion && (
                                  <div className="flex items-center gap-1">
                                    <Film className="h-3 w-3" />
                                    {prompt.film_suggestion}
                                  </div>
                                )}
                                
                                {prompt.frame_range && (
                                  <div className="flex items-center gap-1">
                                    <Camera className="h-3 w-3" />
                                    {prompt.frame_range}
                                  </div>
                                )}
                              </div>
                              
                              {prompt.special_notes && (
                                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs">
                                  💡 {prompt.special_notes}
                                </div>
                              )}
                              
                              {promptProgress?.notes && (
                                <div className="p-2 bg-muted rounded text-xs">
                                  <span className="font-medium">Notes:</span> {promptProgress.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}
    </div>
  )
}
