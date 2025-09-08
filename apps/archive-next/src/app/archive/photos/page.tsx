import { FileSystem } from "@/components/FileSystem";

// Sample photo data - in a real app, this would come from a CMS or API
const photos = [
  { id: 1, src: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop", title: "City Code", category: "Technology" },
  { id: 2, src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop", title: "Team Meeting", category: "People" },
  { id: 3, src: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop", title: "Bakery Display", category: "Food" },
  { id: 4, src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop", title: "Sunset City", category: "Landscape" },
  { id: 5, src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop", title: "Ocean Waves", category: "Nature" },
  { id: 6, src: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=400&fit=crop", title: "Golden Gate", category: "Architecture" },
  { id: 7, src: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop", title: "American Flag", category: "Culture" },
  { id: 8, src: "https://images.unsplash.com/photo-1592478411213-6153e4c4a0bd?w=400&h=400&fit=crop", title: "VR Experience", category: "Technology" },
  { id: 9, src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop", title: "Street View", category: "Urban" },
  { id: 10, src: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=400&fit=crop", title: "Electric Vehicle", category: "Transport" },
  { id: 11, src: "https://images.unsplash.com/photo-1549366021-9f761d77f1a0?w=400&h=400&fit=crop", title: "Black Lamb", category: "Animals" },
  { id: 12, src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", title: "Lighthouse", category: "Architecture" },
  { id: 13, src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop", title: "Rowing Team", category: "Sports" },
  { id: 14, src: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop", title: "Japanese Menu", category: "Culture" },
  { id: 15, src: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop", title: "Sleeping Dog", category: "Animals" },
  { id: 16, src: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop", title: "Digital Clock", category: "Technology" },
  { id: 17, src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop", title: "Meadow Sunset", category: "Nature" },
  { id: 18, src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop", title: "Night Scooter", category: "Urban" },
  { id: 19, src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=400&fit=crop", title: "City Night", category: "Landscape" },
  { id: 20, src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop", title: "Urban Skyline", category: "Architecture" },
];

export default function PhotosPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      <FileSystem items={{ amount: 20, label: "photos" }} currentPath="/archive/photos">
        <div className="w-full h-full flex flex-col">
          <div className="mb-8 flex-shrink-0">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Photos</h1>
            <p className="text-neutral-600 dark:text-neutral-400">A curated collection of photography and visual content</p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer transition-transform hover:scale-105"
              >
                <img src={photo.src} alt={photo.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-90" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="font-medium text-sm truncate">{photo.title}</h3>
                  <p className="text-xs text-neutral-300">{photo.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FileSystem>
    </div>
  );
}
