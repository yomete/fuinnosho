'use client'

import { type ChallengePrompt, type ChallengeProgress } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Circle, Search, Filter, MapPin, Film, Camera } from 'lucide-react'
import { useState, useMemo } from 'react'

interface AllPromptsProps {
  prompts: ChallengePrompt[]
  progress: ChallengeProgress[]
  currentDay: number
  challengeId: string
}

const phases = [
  "All Phases",
  "Foundation Building",
  "Corfu Offsite", 
  "Post-Corfu Integration",
  "Montenegro Wedding",
  "Post-Wedding Reflection",
  "Cinematic Experiments",
  "First HP5 Week",
  "Malta Offsite",
  "Malta Integration",
  "Japan Honeymoon",
  "Japan Integration",
  "Documentary Project",
  "Experimental Week",
  "Final Portfolio"
]

export function AllPrompts({ prompts, progress, currentDay }: AllPromptsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhase, setSelectedPhase] = useState('All Phases')
  const [statusFilter, setStatusFilter] = useState('All')

  const getProgressForPrompt = (promptId: string) => {
    return progress.find(p => p.prompt_id === promptId)
  }

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.film_suggestion?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Phase filter
      const matchesPhase = selectedPhase === 'All Phases' || 
        prompt.phase === selectedPhase
      
      // Status filter
      const promptProgress = getProgressForPrompt(prompt.id)
      const isCompleted = promptProgress?.completed || false
      const isCurrent = prompt.day_number === currentDay
      const isPast = prompt.day_number < currentDay
      
      let matchesStatus = true
      if (statusFilter === 'Completed') matchesStatus = isCompleted
      else if (statusFilter === 'Current') matchesStatus = isCurrent
      else if (statusFilter === 'Upcoming') matchesStatus = !isPast && !isCurrent
      else if (statusFilter === 'Incomplete') matchesStatus = isPast && !isCompleted
      
      return matchesSearch && matchesPhase && matchesStatus
    })
  }, [prompts, searchTerm, selectedPhase, statusFilter, progress, currentDay])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger>
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map(phase => (
                  <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Current">Current Day</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Incomplete">Past Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredPrompts.length} of {prompts.length} prompts
        </div>
        <div className="text-sm text-muted-foreground">
          Day {currentDay} of 100
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="grid gap-4">
        {filteredPrompts.map((prompt) => {
          const promptProgress = getProgressForPrompt(prompt.id)
          const isCompleted = promptProgress?.completed || false
          const isCurrent = prompt.day_number === currentDay
          const isPast = prompt.day_number < currentDay
          
          return (
            <Card 
              key={prompt.id}
              className={`
                transition-all hover:shadow-md
                ${isCurrent ? 'border-primary ring-1 ring-primary/20' : ''}
                ${isCompleted ? 'bg-green-50/50 dark:bg-green-950/10' : ''}
              `}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    
                    <div>
                      <CardTitle className={`text-lg ${isCurrent ? 'text-primary' : ''}`}>
                        Day {prompt.day_number}: {prompt.title}
                      </CardTitle>
                      {prompt.phase && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {prompt.phase}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    {isCurrent && (
                      <Badge variant="default">Today</Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    )}
                    {isPast && !isCompleted && (
                      <Badge variant="destructive">Missed</Badge>
                    )}
                    {prompt.location_context && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {prompt.location_context}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
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
                    <span className="font-medium">Your Notes:</span> {promptProgress.notes}
                  </div>
                )}
                
                {promptProgress?.reflection && (
                  <div className="p-2 bg-muted rounded text-xs">
                    <span className="font-medium">Reflection:</span> {promptProgress.reflection}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No prompts match your current filters
          </div>
        </div>
      )}
    </div>
  )
}
