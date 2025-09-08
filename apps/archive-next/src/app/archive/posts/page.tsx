import { ArchivePage } from "@/components/ArchivePage";
import { FileSystem } from "@/components/FileSystem";

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FileSystem items={{ amount: 15, label: "posts" }} currentPath="/archive/posts">
        <ArchivePage title="Posts" />
      </FileSystem>
    </div>
  );
}
