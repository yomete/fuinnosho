import { getChallenge, getChallengePrompts } from '@/app/actions/challenges'
import { PromptsManager } from '@/components/challenges/prompts-manager'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChallengePromptsPage({ params }: Props) {
  const { id } = await params
  const challenge = await getChallenge(id)
  
  if (!challenge) {
    notFound()
  }
  
  const prompts = await getChallengePrompts(id)
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/challenges">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Challenges
          </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{challenge.name} - Prompts</h1>
          <p className="text-muted-foreground">
            Edit daily prompts for this challenge
          </p>
        </div>
      </div>
      
      <PromptsManager 
        challenge={challenge} 
        prompts={prompts}
      />
    </div>
  )
}