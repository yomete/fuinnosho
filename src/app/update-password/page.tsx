import { Suspense } from "react";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Loader2 } from "lucide-react";

const UpdatePassword = () => {
  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
};

export default UpdatePassword;
