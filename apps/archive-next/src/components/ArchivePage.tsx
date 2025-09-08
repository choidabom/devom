interface ArchivePageProps {
  title: string;
}

export function ArchivePage({ title }: ArchivePageProps) {
  return (
    <div className="w-full max-w-4xl h-full flex flex-col">
      <div className="mb-8 flex-shrink-0">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">{title}</h1>
      </div>
    </div>
  );
}
