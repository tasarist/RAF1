import { Shell } from "@/components/Shell";
import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  return (
    <Shell current="home">
      <Dashboard />
    </Shell>
  );
}
