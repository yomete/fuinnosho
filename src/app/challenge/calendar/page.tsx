'use client'

import { useState, useEffect } from 'react'
import { getChallenges, getChallengePrompts, getChallengeProgress, getCurrentDay } from '@/app/actions/challenges'
import { ChallengeCalendar } from '@/components/challenge/challenge-calendar'
import { ChallengeHeader } from '@/components/challenge/challenge-header'
import { ChallengeSetup } from '@/components/challenge/challenge-setup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Challenge, ChallengePrompt, ChallengeProgress } from '@/lib/utils'

export default function ChallengeCalendarPage() {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null)
  const [prompts, setPrompts] = useState<ChallengePrompt[]>([])
  const [progress, setProgress] = useState<ChallengeProgress[]>([])
  const [currentDay, setCurrentDay] = useState(1)
  const [selectedPrompt, setSelectedPrompt] = useState<ChallengePrompt | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const challenges = await getChallenges()
        const challenge = challenges[0]
        
        if (challenge) {
          setActiveChallenge(challenge)
          const [challengePrompts, challengeProgress, currentDayNum] = await Promise.all([
            getChallengePrompts(challenge.id),
            getChallengeProgress(challenge.id),
            getCurrentDay(challenge)
          ])
          
          setPrompts(challengePrompts)
          setProgress(challengeProgress)
          setCurrentDay(currentDayNum)
        }
      } catch (error) {
        console.error('Failed to load challenge data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleDayClick = (day: number, prompt: ChallengePrompt) => {
    setSelectedDay(day)
    setSelectedPrompt(prompt)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="mt-6 h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!activeChallenge) {
    return <ChallengeSetup />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ChallengeHeader 
        challenge={activeChallenge} 
        currentDay={currentDay} 
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChallengeCalendar 
            challenge={activeChallenge}
            prompts={prompts}
            progress={progress}
            onDayClick={handleDayClick}
          />
        </div>
        
        <div className="space-y-4">
          {selectedPrompt && selectedDay ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Day {selectedDay}</CardTitle>
                  <Badge variant="outline">
                    {selectedPrompt.phase || 'Challenge'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base mb-2">{selectedPrompt.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedPrompt.prompt_text}
                  </p>
                </div>
                
                {selectedPrompt.film_suggestion && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Film Suggestion</h4>
                    <p className="text-sm text-muted-foreground">{selectedPrompt.film_suggestion}</p>
                  </div>
                )}
                
                {selectedPrompt.frame_range && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Frame Range</h4>
                    <p className="text-sm text-muted-foreground">{selectedPrompt.frame_range}</p>
                  </div>
                )}
                
                {selectedPrompt.location_context && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Location Context</h4>
                    <p className="text-sm text-muted-foreground">{selectedPrompt.location_context}</p>
                  </div>
                )}
                
                {selectedPrompt.special_notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Special Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedPrompt.special_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <p className="text-sm">Click on a challenge day in the calendar to view the prompt details.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}