import { getChallenges, getChallengePrompts, getChallengeProgress, getCurrentDay } from '@/app/actions/challenges'
import { ChallengeTimeline } from '@/components/challenge/challenge-timeline'

export default async function TimelinePage() {
  const challenges = await getChallenges()
  const activeChallenge = challenges[0]
  
  if (!activeChallenge) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">No Active Challenge</h1>
        <p className="text-muted-foreground">
          Return to the main challenge page to set up your 100-day journey.
        </p>
      </div>
    )
  }
  
  const [prompts, progress, currentDay] = await Promise.all([
    getChallengePrompts(activeChallenge.id),
    getChallengeProgress(activeChallenge.id),
    getCurrentDay(activeChallenge)
  ])
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Challenge Timeline</h1>
        <p className="text-muted-foreground">
          Your 100-day journey through film photography
        </p>
      </div>
      
      <ChallengeTimeline 
        prompts={prompts}
        progress={progress}
        currentDay={currentDay}
        challengeId={activeChallenge.id}
      />
    </div>
  )
}
