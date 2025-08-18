import { type Challenge } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Camera, Calendar, Target } from 'lucide-react'

interface ChallengeHeaderProps {
  challenge: Challenge
  currentDay: number
}

export function ChallengeHeader({ challenge, currentDay }: ChallengeHeaderProps) {
  const progressPercentage = (currentDay / challenge.total_days) * 100
  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  
  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{challenge.name}</h1>
          <p className="text-muted-foreground">{challenge.description}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">
            Day {currentDay}
          </div>
          <div className="text-sm text-muted-foreground">
            of {challenge.total_days}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <div>
              <div className="font-medium">Started</div>
              <div className="text-muted-foreground">
                {startDate.toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <div>
              <div className="font-medium">Ends</div>
              <div className="text-muted-foreground">
                {endDate.toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <div>
              <div className="font-medium">Days Left</div>
              <div className="text-muted-foreground">
                {challenge.total_days - currentDay + 1}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
