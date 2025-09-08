import { ArchivePage } from "@/components/ArchivePage";
import { FileSystem } from "@/components/FileSystem";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FileSystem items={{ amount: 3, label: "projects" }} currentPath="/archive/projects">
        <ArchivePage title="Projects" />
      </FileSystem>
    </div>
  );
}
