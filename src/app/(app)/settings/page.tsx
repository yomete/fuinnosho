import { redirect } from "next/navigation";
import { getUser } from "@/app/actions/user";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  const { user, error } = await getUser();

  if (error || !user?.user) {
    redirect("/login");
  }

  const email = user.user.email || "";

  return (
    <main className="max-w-2xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight font-serif">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Update your email address. A confirmation will be sent to the new
            address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangeEmailForm currentEmail={email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password. You&apos;ll need to enter your current
            password first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
