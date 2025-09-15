import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BackupDashboard } from '@/components/admin/backup-dashboard'
import { getBackupStats } from '@/app/actions/backup'

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  // Get backup statistics
  const stats = await getBackupStats()
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your data and create backups of your film photography inventory
        </p>
      </div>
      
      <BackupDashboard stats={stats} user={user} />
    </div>
  )
}