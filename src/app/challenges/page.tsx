import { getChallenges } from '@/app/actions/challenges'
import { ChallengesList } from '@/components/challenges/challenges-list'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default async function ChallengesPage() {
  const challenges = await getChallenges()
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Photography Challenges</h1>
          <p className="text-muted-foreground">
            Manage your photography challenges and track your progress
          </p>
        </div>
        
        <Button asChild>
          <Link href="/challenges/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Challenge
          </Link>
        </Button>
      </div>
      
      <ChallengesList challenges={challenges} />
    </div>
  )
}