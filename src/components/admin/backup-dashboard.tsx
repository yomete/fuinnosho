"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Database,
  Film,
  Camera,
  MapPin,
  Target,
  BarChart3,
  Archive,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { generateFullBackup, generateTableBackup } from "@/app/actions/backup";
import type { User } from "@supabase/supabase-js";

interface BackupDashboardProps {
  stats: {
    films: number;
    film_usage: number;
    gear: number;
    trips: number;
    trip_films: number;
    trip_gear: number;
    challenges: number;
    challenge_prompts: number;
    challenge_progress: number;
    challenge_film_rolls: number;
    total: number;
  };
  user: User;
}

interface TableInfo {
  key: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
}

export function BackupDashboard({ stats, user }: BackupDashboardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTable, setGeneratingTable] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const tables: TableInfo[] = [
    {
      key: "films",
      name: "Films",
      description: "Film inventory and stock",
      icon: Film,
      count: stats.films,
    },
    {
      key: "film_usage",
      name: "Film Usage",
      description: "Usage history and tracking",
      icon: BarChart3,
      count: stats.film_usage,
    },
    {
      key: "gear",
      name: "Gear",
      description: "Cameras and equipment",
      icon: Camera,
      count: stats.gear,
    },
    {
      key: "trips",
      name: "Trips",
      description: "Photography trips",
      icon: MapPin,
      count: stats.trips,
    },
    {
      key: "challenges",
      name: "Challenges",
      description: "Photography challenges",
      icon: Target,
      count: stats.challenges,
    },
    {
      key: "challenge_progress",
      name: "Challenge Progress",
      description: "Progress tracking",
      icon: CheckCircle,
      count: stats.challenge_progress,
    },
  ];

  const downloadAsJSON = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAsCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? "";
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFullBackup = async () => {
    setIsGenerating(true);
    try {
      const backupData = await generateFullBackup();
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `fuinnosho_backup_${timestamp}.json`;

      downloadAsJSON(backupData, filename);
      setLastBackup(new Date().toLocaleString());

      console.log("✅ Full backup completed:", backupData.metadata);
    } catch (error) {
      console.error("❌ Backup failed:", error);
      alert(
        `Backup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTableBackup = async (
    tableName: string,
    format: "json" | "csv" = "json"
  ) => {
    setGeneratingTable(tableName);
    try {
      const data = await generateTableBackup(tableName);
      const timestamp = new Date().toISOString().split("T")[0];

      if (format === "csv") {
        downloadAsCSV(data, `${tableName}_${timestamp}.csv`);
      } else {
        downloadAsJSON(data, `${tableName}_${timestamp}.json`);
      }

      console.log(
        `✅ Table backup completed: ${tableName} (${data.length} records)`
      );
    } catch (error) {
      console.error(`❌ Table backup failed for ${tableName}:`, error);
      alert(
        `Backup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setGeneratingTable(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all tables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Account</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{user.email}</div>
            <p className="text-xs text-muted-foreground">Authenticated user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">{lastBackup || "No backup yet"}</div>
            <p className="text-xs text-muted-foreground">Generated locally</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Tables</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for backup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Full Backup Section */}
      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Full Database Backup
          </CardTitle>
          <CardDescription>
            Export all your data in a single JSON file. This includes all tables
            with complete relationships preserved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                This will download {stats.total.toLocaleString()} records across{" "}
                {tables.length} tables
              </p>
              {lastBackup && (
                <p className="text-xs text-muted-foreground">
                  Last backup: {lastBackup}
                </p>
              )}
            </div>
            <Button
              onClick={handleFullBackup}
              disabled={isGenerating}
              size="lg"
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Download Full Backup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Table Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Table Backups</CardTitle>
          <CardDescription>
            Export specific tables individually in JSON or CSV format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => {
              const Icon = table.icon;
              const isGenerating = generatingTable === table.key;

              return (
                <Card key={table.key} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">
                          {table.name}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary">
                        {table.count.toLocaleString()}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {table.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTableBackup(table.key, "json")}
                        disabled={isGenerating || table.count === 0}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <FileText className="mr-1 h-3 w-3" />
                        )}
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTableBackup(table.key, "csv")}
                        disabled={isGenerating || table.count === 0}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Database className="mr-1 h-3 w-3" />
                        )}
                        CSV
                      </Button>
                    </div>

                    {table.count === 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        No data to export
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base">Backup Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            <strong>Security:</strong> All backups only include your personal
            data. No other users&apos; data is exported.
          </div>
          <div>
            <strong>Format:</strong> JSON files preserve relationships and are
            suitable for restoration. CSV files are spreadsheet-friendly.
          </div>
          <div>
            <strong>Storage:</strong> Files are generated locally and downloaded
            to your device. Nothing is stored on external servers.
          </div>
          <div>
            <strong>Data Included:</strong> All records including soft-deleted
            items for complete data preservation.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
