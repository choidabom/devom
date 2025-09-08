import { FileSystem } from "@/components/FileSystem";

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FileSystem items={{ amount: 5, label: "archive" }} currentPath="/archive">
        <div className="w-full max-w-4xl h-full flex flex-col">
          <div className="mb-8 flex-shrink-0">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Archive</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Welcome to my digital archive</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p>This is a collection of my projects, experiments, and creative works.</p>
            </div>
          </div>
        </div>
      </FileSystem>
    </div>
  );
}
