import { FileSystem } from "@/components/FileSystem";
import { DefaultLayout } from "@/components/layouts/DefaultLayout";
import { PhotosLayout } from "@/components/layouts/PhotosLayout";
import { getCategoryData } from "@/lib/categoryData";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category } = params;
  const categoryData = getCategoryData(category);

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Category Not Found</h1>
          <p className="text-neutral-600 dark:text-neutral-400">The requested category does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FileSystem items={{ amount: categoryData.amount, label: category }} currentPath={`/archive/${category}`}>
        {categoryData.layout === "photos" ? (
          <PhotosLayout title={categoryData.title} description={categoryData.description} />
        ) : (
          <DefaultLayout title={categoryData.title} description={categoryData.description} />
        )}
      </FileSystem>
    </div>
  );
}
