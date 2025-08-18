// Import the complete challenge data
import { challenge100Days as importedChallenge } from './challenge-data-complete'

export const challenge100Days = importedChallenge

// Helper function to create challenge with prompts
export async function createChallenge100Days(userId: string) {
  return {
    challenge: {
      user_id: userId,
      ...challenge100Days
    },
    prompts: challenge100Days.prompts.map(prompt => ({
      ...prompt,
      challenge_id: '', // Will be filled when challenge is created
    }))
  }
}
