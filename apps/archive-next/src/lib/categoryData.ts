interface CategoryData {
  title: string;
  amount: number;
  description?: string;
  layout: "default" | "photos";
}

const categoryData: Record<string, CategoryData> = {
  experiments: {
    title: "Experiments",
    amount: 7,
    description: "Creative experiments and prototypes",
    layout: "default",
  },
  posts: {
    title: "Posts",
    amount: 15,
    description: "Thoughts, insights, and reflections",
    layout: "default",
  },
  projects: {
    title: "Projects",
    amount: 3,
    description: "Completed projects and case studies",
    layout: "default",
  },
  photos: {
    title: "Photos",
    amount: 20,
    description: "A curated collection of photography and visual content",
    layout: "photos",
  },
};

export function getCategoryData(category: string): CategoryData | null {
  return categoryData[category] || null;
}

export function getAllCategories(): string[] {
  return Object.keys(categoryData);
}
