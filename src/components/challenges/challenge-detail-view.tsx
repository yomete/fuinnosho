'use client'

import { type Challenge, type ChallengePrompt, type ChallengeProgress } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, CheckCircle, Circle, Edit, Eye, Target, TrendingUp, Camera, Film } from 'lucide-react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'

interface ChallengeDetailViewProps {
  challenge: Challenge
  prompts: ChallengePrompt[]
  progress: ChallengeProgress[]
  currentDay: number
}

export function ChallengeDetailView({ challenge, prompts, progress, currentDay }: ChallengeDetailViewProps) {
  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  const today = new Date()
  
  const progressMap = new Map(progress.map(p => [p.prompt_id, p]))
  const completedPrompts = progress.filter(p => p.completed).length
  const totalPhotos = progress.reduce((sum, p) => sum + p.photos_taken, 0)
  const totalFrames = progress.reduce((sum, p) => sum + (p.frames_used || 0), 0)
  
  const progressPercentage = prompts.length > 0 ? (completedPrompts / prompts.length) * 100 : 0
  const dayProgressPercentage = (currentDay / challenge.total_days) * 100
  
  const getChallengeStatus = () => {
    if (today < startDate) {
      const daysUntilStart = differenceInDays(startDate, today)
      return { 
        status: 'upcoming' as const, 
        label: 'Upcoming', 
        color: 'bg-blue-500',
        detail: `Starts in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}`
      }
    } else if (today <= endDate) {
      const daysRemaining = differenceInDays(endDate, today)
      return { 
        status: 'active' as const, 
        label: 'Active', 
        color: 'bg-green-500',
        detail: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`
      }
    } else {
      return { 
        status: 'completed' as const, 
        label: 'Completed', 
        color: 'bg-gray-500',
        detail: 'Challenge finished'
      }
    }
  }
  
  const status = getChallengeStatus()
  
  // Get today's prompt if challenge is active
  const todaysPrompt = status.status === 'active' 
    ? prompts.find(p => p.day_number === currentDay)
    : null
  
  const todaysProgress = todaysPrompt 
    ? progressMap.get(todaysPrompt.id)
    : null

  return (
    <div className="space-y-6">
      {/* Challenge Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className={`text-white ${status.color}`}>
                {status.label}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {status.detail}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPrompts}/{prompts.length}</div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(0)}% completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos Taken</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPhotos}</div>
            <p className="text-xs text-muted-foreground">
              Total photographs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frames Used</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFrames}</div>
            <p className="text-xs text-muted-foreground">
              Total frames shot
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Prompt (if active) */}
      {todaysPrompt && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">Day {currentDay}</Badge>
                  {todaysPrompt.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  Today&apos;s Challenge
                </CardDescription>
              </div>
              {todaysProgress?.completed ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{todaysPrompt.prompt_text}</p>
            
            {todaysPrompt.film_suggestion && (
              <div className="text-sm">
                <span className="font-medium">Film suggestion:</span> {todaysPrompt.film_suggestion}
              </div>
            )}
            
            {todaysPrompt.frame_range && (
              <div className="text-sm">
                <span className="font-medium">Frame range:</span> {todaysPrompt.frame_range}
              </div>
            )}
            
            {todaysProgress && (
              <div className="pt-2 border-t text-sm">
                <p><span className="font-medium">Status:</span> {todaysProgress.completed ? 'Completed' : 'In Progress'}</p>
                {todaysProgress.photos_taken > 0 && (
                  <p><span className="font-medium">Photos taken:</span> {todaysProgress.photos_taken}</p>
                )}
                {todaysProgress.notes && (
                  <p className="text-muted-foreground mt-1">{todaysProgress.notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Challenge Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Challenge Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Duration:</span>
                <span className="ml-2">{challenge.total_days} days</span>
              </div>
              
              <div className="flex items-center text-sm">
                <span className="font-medium">Start:</span>
                <span className="ml-2">{format(startDate, 'PPP')}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <span className="font-medium">End:</span>
                <span className="ml-2">{format(endDate, 'PPP')}</span>
              </div>
            </div>
            
            {status.status === 'active' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Day Progress:</span>
                  <span>{currentDay} / {challenge.total_days}</span>
                </div>
                <Progress value={dayProgressPercentage} className="h-2" />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Completion:</span>
                <span>{completedPrompts} / {prompts.length}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href={`/challenges/${challenge.id}/progress`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                View & Edit Progress
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/challenges/${challenge.id}/prompts`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Prompts
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/challenge`}>
                <Eye className="mr-2 h-4 w-4" />
                View Active Challenge
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Progress */}
      {progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Progress</CardTitle>
            <CardDescription>
              Your latest challenge activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progress
                .filter(p => p.completed)
                .slice(0, 5)
                .map(p => {
                  const prompt = prompts.find(pr => pr.id === p.prompt_id)
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">Day {prompt?.day_number}: {prompt?.title}</p>
                          {p.completion_date && (
                            <p className="text-xs text-muted-foreground">
                              Completed {format(new Date(p.completion_date), 'MMM d')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {p.photos_taken > 0 && <div>{p.photos_taken} photos</div>}
                      </div>
                    </div>
                  )
                })}
              
              {progress.filter(p => p.completed).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No completed prompts yet. Start your challenge today!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}