'use client'

import { type Challenge } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChallengesListProps {
  challenges: Challenge[]
}

function getChallengeStatus(challenge: Challenge): {
  status: 'upcoming' | 'active' | 'completed' | 'past'
  label: string
  color: string
} {
  const now = new Date()
  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  
  if (now < startDate) {
    return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-500' }
  } else if (now <= endDate) {
    return { status: 'active', label: 'Active', color: 'bg-green-500' }
  } else {
    return { status: 'completed', label: 'Completed', color: 'bg-gray-500' }
  }
}

function getCurrentDay(challenge: Challenge): number {
  const today = new Date()
  const startDate = new Date(challenge.start_date)
  const diffTime = today.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, Math.min(diffDays, challenge.total_days))
}

export function ChallengesList({ challenges }: ChallengesListProps) {
  if (challenges.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No challenges yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Start your photography journey by creating your first challenge
          </p>
          <Button asChild>
            <Link href="/challenges/new">Create Challenge</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {challenges.map((challenge) => {
        const status = getChallengeStatus(challenge)
        const currentDay = getCurrentDay(challenge)
        const progressPercentage = (currentDay / challenge.total_days) * 100
        
        return (
          <Card key={challenge.id} className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
              <div className="flex-1">
                <CardTitle className="text-lg">{challenge.name}</CardTitle>
                <CardDescription className="mt-2">
                  {challenge.description || 'No description provided'}
                </CardDescription>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/challenges/${challenge.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/challenges/${challenge.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Challenge
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/challenges/${challenge.id}/prompts`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Prompts
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/challenges/${challenge.id}/progress`}>
                      Progress
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Challenge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Badge 
                  className={`text-white ${status.color}`}
                >
                  {status.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {challenge.total_days} days
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                </div>
                
                {status.status === 'active' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{currentDay} / {challenge.total_days} days</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/challenges/${challenge.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/challenges/${challenge.id}/progress`}>
                    Progress
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}