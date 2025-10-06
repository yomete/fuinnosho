import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BackupDashboard } from '@/components/admin/backup-dashboard'
import { FeatureFlags } from '@/components/admin/feature-flags'
import { getBackupStats } from '@/app/actions/backup'
import { getFeatureFlag } from '@/app/actions/feature-flags'

export default async function AdminPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  // Get backup statistics and feature flags
  const stats = await getBackupStats()
  const colorDevelopmentEnabled = await getFeatureFlag("color_development")

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your data and create backups of your film photography inventory
        </p>
      </div>

      <FeatureFlags colorDevelopmentEnabled={colorDevelopmentEnabled} />

      <BackupDashboard stats={stats} user={user} />
    </div>
  )
}