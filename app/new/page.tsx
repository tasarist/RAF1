import { Shell } from "@/components/Shell";
import { NewAnalysisWizard } from "@/components/NewAnalysisWizard";

export default function NewAnalysisPage() {
  return (
    <Shell current="new">
      <NewAnalysisWizard />
    </Shell>
  );
}
