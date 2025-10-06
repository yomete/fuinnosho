import { getDevelopmentSessions } from "@/app/actions/development";
import { getFeatureFlag } from "@/app/actions/feature-flags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate, getChemistryTypeColor } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, FlaskConical, Film } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DevelopmentHistoryPage() {
  const { data: bwSessions } = await getDevelopmentSessions("black_white");
  const { data: colorSessions } = await getDevelopmentSessions("color");
  const colorDevelopmentEnabled = await getFeatureFlag("color_development");

  const SessionCard = ({ session }: { session: NonNullable<typeof bwSessions>[number] }) => {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {formatDate(session.session_date)}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {session.process_type === 'black_white' ? 'B&W' : 'Color'}
                </Badge>
                {session.temperature_celsius && (
                  <Badge variant="secondary">
                    <Thermometer className="h-3 w-3 mr-1" />
                    {session.temperature_celsius}°C
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${session.total_cost.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                ~${(session.total_cost / (session.session_films?.reduce((sum, sf) => sum + sf.quantity, 0) || 1)).toFixed(2)}/roll
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Films */}
          {session.session_films && session.session_films.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Film className="h-4 w-4" />
                <span>
                  Films Developed ({session.session_films.length}) •{" "}
                  {session.session_films.reduce((sum, sf) => sum + sf.quantity, 0)} rolls
                </span>
              </div>
              <div className="space-y-1">
                {session.session_films.map((sf) => (
                  <div key={sf.id} className="text-sm pl-6">
                    • {sf.film?.name} - {sf.film?.brand} ({sf.film?.iso} ISO)
                    {sf.quantity > 1 && (
                      <span className="ml-2 font-medium">({sf.quantity} rolls)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chemistry Used */}
          {session.session_chemistry_usage && session.session_chemistry_usage.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <FlaskConical className="h-4 w-4" />
                <span>Chemistry Used</span>
              </div>
              <div className="space-y-2">
                {session.session_chemistry_usage.map((cu) => (
                  <div
                    key={cu.id}
                    className="flex justify-between items-start p-2 bg-muted rounded-lg text-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getChemistryTypeColor(cu.chemistry?.chemistry_type || 'other')}>
                          {cu.chemistry?.chemistry_type?.replace('_', ' ')}
                        </Badge>
                        <span className="font-medium">{cu.chemistry?.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cu.volume_used_ml}ml
                        {cu.dilution_ratio && ` @ ${cu.dilution_ratio}`}
                        {cu.development_time_minutes && ` for ${cu.development_time_minutes}min`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Notes */}
          {session.notes && (
            <div className="border-t pt-3">
              <div className="text-sm text-muted-foreground">{session.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 p-2 sm:p-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Development History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all your past development sessions
        </p>
      </div>

      <Tabs defaultValue="black_white" className="w-full">
        <TabsList className={colorDevelopmentEnabled ? "grid w-full grid-cols-2" : "grid w-full grid-cols-1"}>
          <TabsTrigger value="black_white">
            Black & White {bwSessions && `(${bwSessions.length})`}
          </TabsTrigger>
          {colorDevelopmentEnabled && (
            <TabsTrigger value="color">
              Color {colorSessions && `(${colorSessions.length})`}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="black_white" className="mt-4">
          {!bwSessions || bwSessions.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No Black & White Sessions"
              description="You haven't developed any black & white films yet"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bwSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        {colorDevelopmentEnabled && (
          <TabsContent value="color" className="mt-4">
            {!colorSessions || colorSessions.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                title="No Color Sessions"
                description="You haven't developed any color films yet"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
