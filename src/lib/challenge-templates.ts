import type { Challenge, ChallengePrompt } from './utils'

export interface ChallengeTemplate {
  name: string
  description?: string
  total_days: number
  phases?: Array<{
    name: string
    days: string
    period: string
  }>
  prompts: Array<{
    day_number: number
    title: string
    prompt_text: string
    film_suggestion?: string
    frame_range?: string
    location_context?: string
    special_notes?: string
    phase?: string
  }>
}

export function exportChallengeToCSV(challenge: Challenge, prompts: ChallengePrompt[]): string {
  const headers = [
    'Day Number',
    'Title', 
    'Prompt Text',
    'Film Suggestion',
    'Frame Range',
    'Location Context',
    'Special Notes',
    'Phase'
  ]
  
  const csvRows = [
    headers.join(','),
    ...prompts.map(prompt => [
      prompt.day_number,
      `"${prompt.title.replace(/"/g, '""')}"`,
      `"${prompt.prompt_text.replace(/"/g, '""')}"`,
      `"${(prompt.film_suggestion || '').replace(/"/g, '""')}"`,
      `"${(prompt.frame_range || '').replace(/"/g, '""')}"`,
      `"${(prompt.location_context || '').replace(/"/g, '""')}"`,
      `"${(prompt.special_notes || '').replace(/"/g, '""')}"`,
      `"${(prompt.phase || '').replace(/"/g, '""')}"`
    ].join(','))
  ]
  
  return csvRows.join('\n')
}

export function exportChallengeToMarkdown(challenge: Challenge, prompts: ChallengePrompt[]): string {
  let markdown = `# ${challenge.name}\n\n`
  
  if (challenge.description) {
    markdown += `${challenge.description}\n\n`
  }
  
  markdown += `**Duration:** ${challenge.total_days} days\n`
  markdown += `**Start Date:** ${challenge.start_date}\n`
  markdown += `**End Date:** ${challenge.end_date}\n\n`
  
  markdown += `## Daily Prompts\n\n`
  
  prompts.forEach(prompt => {
    markdown += `### Day ${prompt.day_number}: ${prompt.title}\n\n`
    markdown += `${prompt.prompt_text}\n\n`
    
    if (prompt.film_suggestion) {
      markdown += `**Film Suggestion:** ${prompt.film_suggestion}\n\n`
    }
    
    if (prompt.frame_range) {
      markdown += `**Frame Range:** ${prompt.frame_range}\n\n`
    }
    
    if (prompt.location_context) {
      markdown += `**Location Context:** ${prompt.location_context}\n\n`
    }
    
    if (prompt.special_notes) {
      markdown += `**Special Notes:** ${prompt.special_notes}\n\n`
    }
    
    if (prompt.phase) {
      markdown += `**Phase:** ${prompt.phase}\n\n`
    }
    
    markdown += `---\n\n`
  })
  
  return markdown
}

export function importChallengeFromCSV(csvContent: string): ChallengeTemplate {
  if (!csvContent.trim()) {
    throw new Error('CSV content is empty')
  }
  
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header and one data row')
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const headers = lines[0].split(',').map(h => h.trim())
  
  const prompts = lines.slice(1)
    .filter(line => line.trim())
    .map((line, index) => {
      const values = parseCSVLine(line)
      
      return {
        day_number: parseInt(values[0]) || index + 1,
        title: values[1] || `Day ${index + 1}`,
        prompt_text: values[2] || '',
        film_suggestion: values[3] || undefined,
        frame_range: values[4] || undefined,
        location_context: values[5] || undefined,
        special_notes: values[6] || undefined,
        phase: values[7] || undefined,
      }
    })
  
  return {
    name: 'Imported Challenge',
    description: 'Challenge imported from CSV',
    total_days: prompts.length,
    prompts
  }
}

export function importChallengeFromMarkdown(markdownContent: string): ChallengeTemplate {
  if (!markdownContent.trim()) {
    throw new Error('Markdown content is empty')
  }
  
  const lines = markdownContent.split('\n')
  let name = 'Imported Challenge'
  const description = ''
  const prompts: ChallengeTemplate['prompts'] = []
  
  let currentPrompt: Partial<ChallengeTemplate['prompts'][0]> = {}
  let inPromptSection = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Extract challenge name from first heading
    if (line.startsWith('# ') && !name.includes('Imported')) {
      name = line.substring(2)
      continue
    }
    
    // Extract day prompts
    const dayMatch = line.match(/^### Day (\d+): (.+)$/)
    if (dayMatch) {
      // Save previous prompt if exists
      if (currentPrompt.day_number) {
        prompts.push(currentPrompt as ChallengeTemplate['prompts'][0])
      }
      
      currentPrompt = {
        day_number: parseInt(dayMatch[1]),
        title: dayMatch[2],
        prompt_text: ''
      }
      inPromptSection = true
      continue
    }
    
    if (inPromptSection && currentPrompt.day_number) {
      if (line.startsWith('**Film Suggestion:**')) {
        currentPrompt.film_suggestion = line.replace('**Film Suggestion:**', '').trim()
      } else if (line.startsWith('**Frame Range:**')) {
        currentPrompt.frame_range = line.replace('**Frame Range:**', '').trim()
      } else if (line.startsWith('**Location Context:**')) {
        currentPrompt.location_context = line.replace('**Location Context:**', '').trim()
      } else if (line.startsWith('**Special Notes:**')) {
        currentPrompt.special_notes = line.replace('**Special Notes:**', '').trim()
      } else if (line.startsWith('**Phase:**')) {
        currentPrompt.phase = line.replace('**Phase:**', '').trim()
      } else if (line === '---') {
        inPromptSection = false
      } else if (!line.startsWith('**') && line && !currentPrompt.prompt_text) {
        currentPrompt.prompt_text = line
      }
    }
  }
  
  // Add the last prompt
  if (currentPrompt.day_number) {
    prompts.push(currentPrompt as ChallengeTemplate['prompts'][0])
  }
  
  return {
    name,
    description: description || 'Challenge imported from Markdown',
    total_days: prompts.length,
    prompts
  }
}

// Helper function to parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip the next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}