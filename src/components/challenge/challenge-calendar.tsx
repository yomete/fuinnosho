'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, Circle } from 'lucide-react'
import type { Challenge, ChallengePrompt, ChallengeProgress } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ChallengeCalendarProps {
  challenge: Challenge
  prompts: ChallengePrompt[]
  progress?: ChallengeProgress[]
  onDayClick?: (day: number, prompt: ChallengePrompt) => void
}

export function ChallengeCalendar({ challenge, prompts, progress, onDayClick }: ChallengeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(challenge.start_date))
  
  const startDate = useMemo(() => new Date(challenge.start_date), [challenge.start_date])
  const endDate = useMemo(() => new Date(challenge.end_date), [challenge.end_date])
  
  // Get progress status for a given day
  const getProgressStatus = useCallback((dayNumber: number) => {
    const prompt = prompts.find(p => p.day_number === dayNumber)
    if (!prompt) return null
    
    const dayProgress = progress?.find(p => p.prompt_id === prompt.id)
    return dayProgress?.completed ? 'completed' : 'pending'
  }, [prompts, progress])
  
  // Generate calendar days for the current month
  const generateCalendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate()
    
    const days = []
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push(date)
    }
    
    return days
  }, [currentMonth])
  
  // Get challenge day number for a given date
  const getChallengeDay = useCallback((date: Date) => {
    if (date < startDate || date > endDate) return null
    
    const diffTime = date.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1
  }, [startDate, endDate])
  
  // Get prompt for a given date
  const getPromptForDate = useCallback((date: Date) => {
    const dayNumber = getChallengeDay(date)
    if (!dayNumber) return null
    
    return prompts.find(p => p.day_number === dayNumber)
  }, [getChallengeDay, prompts])
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const calendarDays = generateCalendarDays
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Challenge Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={index} className="aspect-square" />
            }
            
            const dayNumber = getChallengeDay(date)
            const prompt = getPromptForDate(date)
            const progressStatus = dayNumber ? getProgressStatus(dayNumber) : null
            const isToday = date.toDateString() === new Date().toDateString()
            const isInChallenge = dayNumber !== null
            
            return (
              <Button
                key={date.toISOString()}
                variant="ghost"
                className={cn(
                  "aspect-square p-1 h-auto flex flex-col items-center justify-center relative",
                  isToday && "ring-2 ring-primary ring-offset-1",
                  isInChallenge && "hover:bg-accent",
                  !isInChallenge && "text-muted-foreground hover:bg-transparent cursor-default"
                )}
                onClick={() => {
                  if (prompt && dayNumber && onDayClick) {
                    onDayClick(dayNumber, prompt)
                  }
                }}
                disabled={!isInChallenge}
              >
                <span className="text-sm font-medium">
                  {date.getDate()}
                </span>
                
                {isInChallenge && (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs text-muted-foreground">
                      Day {dayNumber}
                    </span>
                    
                    {progressStatus && (
                      <div className="w-3 h-3">
                        {progressStatus === 'completed' ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Circle className="w-3 h-3 text-orange-500" />
                        )}
                      </div>
                    )}
                    
                    {prompt && (
                      <div className="w-2 h-2 bg-primary rounded-full opacity-60" />
                    )}
                  </div>
                )}
              </Button>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="w-3 h-3 text-orange-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full opacity-60" />
            <span>Challenge day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 ring-2 ring-primary rounded" />
            <span>Today</span>
          </div>
        </div>
        
        {/* Quick navigation to challenge start/end */}
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(challenge.start_date))}
            className="text-xs"
          >
            Go to Start ({startDate.toLocaleDateString()})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(challenge.end_date))}
            className="text-xs"
          >
            Go to End ({endDate.toLocaleDateString()})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}