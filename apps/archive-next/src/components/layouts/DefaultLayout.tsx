interface DefaultLayoutProps {
  title: string;
  description?: string;
}

export function DefaultLayout({ title, description }: DefaultLayoutProps) {
  return (
    <div className="w-full max-w-4xl h-full flex flex-col">
      <div className="mb-8 flex-shrink-0">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">{title}</h1>
        {description && <p className="text-neutral-600 dark:text-neutral-400">{description}</p>}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p>This is a collection of {title.toLowerCase()}.</p>
        </div>
      </div>
    </div>
  );
}
