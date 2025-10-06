import { getFeatureFlag } from "@/app/actions/feature-flags";
import DevelopClient from "./develop-client";

export default async function DevelopWrapper() {
  const colorDevelopmentEnabled = await getFeatureFlag("color_development");

  return <DevelopClient colorDevelopmentEnabled={colorDevelopmentEnabled} />;
}
