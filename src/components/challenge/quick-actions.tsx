'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Film, Settings, Calendar, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getChallengeFilmRolls } from '@/app/actions/challenges'
import { type ChallengeFilmRoll } from '@/lib/utils'
import Link from 'next/link'

interface QuickActionsProps {
  challengeId: string
  currentDay: number
}

export function QuickActions({ challengeId, currentDay }: QuickActionsProps) {
  const [activeRoll, setActiveRoll] = useState<ChallengeFilmRoll | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveRoll = async () => {
      try {
        const rolls = await getChallengeFilmRolls(challengeId)
        const active = rolls.find(r => r.status === 'active') || rolls.find(r => r.status === 'loaded')
        setActiveRoll(active || null)
      } catch (error) {
        console.error('Failed to fetch film rolls:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveRoll()
  }, [challengeId])

  const framesRemaining = activeRoll 
    ? activeRoll.frames_total - activeRoll.frames_used 
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Film Roll */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Roll</span>
            {activeRoll && (
              <Badge variant={framesRemaining > 6 ? 'default' : 'destructive'}>
                {framesRemaining} left
              </Badge>
            )}
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ) : activeRoll ? (
            <div>
              <div className="font-medium text-sm">
                Roll #{activeRoll.roll_number}
              </div>
              <div className="text-xs text-muted-foreground">
                {activeRoll.frames_used}/{activeRoll.frames_total} frames used
              </div>
              <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ 
                    width: `${(activeRoll.frames_used / activeRoll.frames_total) * 100}%` 
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No active roll loaded
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/films" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Manage Film Rolls
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/challenge/timeline`} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              View Timeline
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/challenge/calendar`} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/challenge/prompts`} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Prompts
            </Link>
          </Button>
        </div>

        {/* Today's Quick Stats */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Challenge Stats</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{currentDay}</div>
              <div className="text-xs text-muted-foreground">Current</div>
            </div>
            <div>
              <div className="text-lg font-bold">{Math.max(0, currentDay - 1)}</div>
              <div className="text-xs text-muted-foreground">Behind</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Math.round(((currentDay - 1) / 100) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
