'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Download, Upload, FileText, File } from 'lucide-react'
import { 
  exportChallengeToCSV, 
  exportChallengeToMarkdown,
  importChallengeFromCSV,
  importChallengeFromMarkdown,
  downloadFile,
  type ChallengeTemplate
} from '@/lib/challenge-templates'
import type { Challenge, ChallengePrompt } from '@/lib/utils'

interface TemplateManagerProps {
  challenge?: Challenge
  prompts?: ChallengePrompt[]
  onImport?: (template: ChallengeTemplate) => void
}

export function TemplateManager({ challenge, prompts, onImport }: TemplateManagerProps) {
  const [importContent, setImportContent] = useState('')
  const [importFormat, setImportFormat] = useState<'csv' | 'markdown'>('csv')
  const [isImporting, setIsImporting] = useState(false)

  const handleExportCSV = () => {
    if (!challenge || !prompts) return
    
    const csvContent = exportChallengeToCSV(challenge, prompts)
    const filename = `${challenge.name.replace(/[^a-zA-Z0-9]/g, '_')}_template.csv`
    downloadFile(csvContent, filename, 'text/csv')
  }

  const handleExportMarkdown = () => {
    if (!challenge || !prompts) return
    
    const markdownContent = exportChallengeToMarkdown(challenge, prompts)
    const filename = `${challenge.name.replace(/[^a-zA-Z0-9]/g, '_')}_template.md`
    downloadFile(markdownContent, filename, 'text/markdown')
  }

  const handleImport = async () => {
    if (!importContent.trim() || !onImport) return
    
    setIsImporting(true)
    try {
      const template = importFormat === 'csv' 
        ? importChallengeFromCSV(importContent)
        : importChallengeFromMarkdown(importContent)
      
      onImport(template)
      setImportContent('')
    } catch (error) {
      console.error('Failed to import template:', error)
      alert('Failed to import template. Please check the format and try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Determine format from file extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension === 'csv') {
      setImportFormat('csv')
    } else if (extension === 'md' || extension === 'markdown') {
      setImportFormat('markdown')
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportContent(content)
    }
    reader.onerror = () => {
      alert('Failed to read file. Please try again.')
    }
    reader.readAsText(file)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Export Section */}
      {challenge && prompts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your challenge as a reusable template that can be shared with others.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="w-full justify-start"
              >
                <File className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              
              <Button
                onClick={handleExportMarkdown}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as Markdown
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>CSV:</strong> Structured data format, easy to edit in spreadsheet apps</p>
              <p><strong>Markdown:</strong> Human-readable format with rich formatting</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Import a challenge template from CSV or Markdown format.
          </p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="template-file">Upload Template File</Label>
              <Input
                id="template-file"
                type="file"
                accept=".csv,.md,.markdown"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              or
            </div>
            
            <div>
              <Label htmlFor="template-content">Paste Template Content</Label>
              <Textarea
                id="template-content"
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                placeholder={importFormat === 'csv' 
                  ? 'Paste CSV content here...' 
                  : 'Paste Markdown content here...'}
                rows={6}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label>Format:</Label>
              <Button
                size="sm"
                variant={importFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setImportFormat('csv')}
              >
                CSV
              </Button>
              <Button
                size="sm"
                variant={importFormat === 'markdown' ? 'default' : 'outline'}
                onClick={() => setImportFormat('markdown')}
              >
                Markdown
              </Button>
            </div>
            
            <Button
              onClick={handleImport}
              disabled={!importContent.trim() || isImporting}
              className="w-full"
            >
              {isImporting ? 'Importing...' : 'Import Template'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}