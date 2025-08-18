'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getChallengeProgress } from '@/app/actions/challenges'
import { type ChallengeProgress } from '@/lib/utils'
import { Trophy, Flame, TrendingUp } from 'lucide-react'

interface ProgressOverviewProps {
  challengeId: string
  totalDays?: number
  currentDay: number
}

export function ProgressOverview({ challengeId, currentDay }: ProgressOverviewProps) {
  const [progress, setProgress] = useState<ChallengeProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await getChallengeProgress(challengeId)
        setProgress(data)
      } catch (error) {
        console.error('Failed to fetch progress:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [challengeId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completedDays = progress.filter(p => p.completed).length
  const completionRate = (completedDays / currentDay) * 100
  const totalPhotos = progress.reduce((sum, p) => sum + p.photos_taken, 0)
  
  // Calculate streak
  const sortedProgress = progress
    .filter(p => p.completed && p.completion_date)
    .sort((a, b) => new Date(b.completion_date!).getTime() - new Date(a.completion_date!).getTime())
  
  let currentStreak = 0
  let checkDate = new Date()
  
  for (const p of sortedProgress) {
    const completionDate = new Date(p.completion_date!)
    const daysDiff = Math.floor((checkDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= currentStreak + 1) {
      currentStreak++
      checkDate = completionDate
    } else {
      break
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-primary">{completedDays}</span>
            </div>
            <div className="text-xs text-muted-foreground">Days Completed</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{currentStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Completion Rate</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Photos</span>
            <div className="font-medium">{totalPhotos}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Avg per Day</span>
            <div className="font-medium">
              {completedDays > 0 ? (totalPhotos / completedDays).toFixed(1) : '0'}
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: Math.min(currentDay, 21) }, (_, i) => {
              const dayNum = currentDay - 20 + i
              if (dayNum < 1) return null
              
              const dayProgress = progress.find(p => 
                p.completion_date === 
                new Date(Date.now() + (dayNum - currentDay) * 24 * 60 * 60 * 1000)
                  .toISOString().split('T')[0]
              )
              
              return (
                <div
                  key={dayNum}
                  className={`
                    h-6 w-6 rounded text-xs flex items-center justify-center font-medium
                    ${dayProgress?.completed 
                      ? 'bg-primary text-primary-foreground' 
                      : dayNum === currentDay
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                  title={`Day ${dayNum}`}
                >
                  {dayNum}
                </div>
              )
            })}
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Last 21 days
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
