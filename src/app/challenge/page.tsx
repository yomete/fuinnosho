import { getChallenges, getTodaysPrompt, getCurrentDay } from '@/app/actions/challenges'
import { ChallengeHeader } from '@/components/challenge/challenge-header'
import { TodaysPrompt } from '@/components/challenge/todays-prompt'
import { ProgressOverview } from '@/components/challenge/progress-overview'
import { QuickActions } from '@/components/challenge/quick-actions'
import { ChallengeSetup } from '@/components/challenge/challenge-setup'

export default async function ChallengePage() {
  const challenges = await getChallenges()
  
  // For now, we'll focus on the first/main challenge
  const activeChallenge = challenges[0]
  
  if (!activeChallenge) {
    return <ChallengeSetup />
  }
  
  const currentDay = await getCurrentDay(activeChallenge)
  const todaysPrompt = await getTodaysPrompt(activeChallenge.id)
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ChallengeHeader 
        challenge={activeChallenge} 
        currentDay={currentDay} 
      />
      
      {todaysPrompt && (
        <TodaysPrompt 
          prompt={todaysPrompt}
          currentDay={currentDay}
          challengeId={activeChallenge.id}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressOverview 
          challengeId={activeChallenge.id}
          totalDays={activeChallenge.total_days}
          currentDay={currentDay}
        />
        
        <QuickActions 
          challengeId={activeChallenge.id}
          currentDay={currentDay}
        />
      </div>
    </div>
  )
}
