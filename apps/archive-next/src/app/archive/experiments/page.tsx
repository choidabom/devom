import { ArchivePage } from "@/components/ArchivePage";
import { FileSystem } from "@/components/FileSystem";

export default function ExperimentsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FileSystem items={{ amount: 7, label: "experiments" }} currentPath="/archive/experiments">
        <ArchivePage title="Experiments" />
      </FileSystem>
    </div>
  );
}
