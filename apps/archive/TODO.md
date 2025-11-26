# Archive App - TODO

## 🔮 Future: Migrate from GitHub Pages to Server Deployment

When moving away from GitHub Pages to a server-based deployment (Vercel/Netlify/etc):

### Tasks

- [ ] Remove calendar-manifest.json generation script
  - Delete `scripts/generate-calendar-manifest.js`
  - Delete `src/data/calendar-manifest.json`

- [ ] Replace manifest approach with server-side fs.readdirSync
  - Create `app/calendar-data.ts` with `getCalendarImages()` function
  - Use Node.js `fs` module to read `/public/calendar` directory

- [ ] Update Calendar component to accept images prop from server
  - Split Calendar into server/client components
  - Pass images as props from server component

- [ ] Remove prebuild script and manifest generation from GitHub Actions
  - Update `.github/workflows/deploy-archive.yml`
  - Remove `Generate calendar manifest` step

- [ ] Update next.config.ts to remove static export settings
  - Remove `output: "export"`
  - Remove `basePath: "/devom"`
  - Remove `images.unoptimized: true`

- [ ] Test dynamic calendar image loading
  - Verify images load correctly
  - Test image addition without rebuild

### Benefits

- ✅ Images auto-reflect without rebuild
- ✅ Runtime dynamic loading
- ✅ Simpler codebase

### Deployment Options

- Vercel (recommended)
- Netlify
- AWS Amplify
- Self-hosted Node.js server

### Implementation Example

```typescript
// app/calendar-data.ts (Server-side)
import fs from 'fs'
import path from 'path'

export function getCalendarImages() {
  const calendarDir = path.join(process.cwd(), 'public/calendar')
  const files = fs.readdirSync(calendarDir)

  return files
    .filter(file => /\.(jpeg|jpg|png|webp|gif)$/i.test(file))
    .map(file => `/calendar/${file}`)
}

// app/page.tsx (Server Component)
import { getCalendarImages } from './calendar-data'
import { Calendar } from '@/components/portfolio/Calendar'

export default function Home() {
  const calendarImages = getCalendarImages()
  return <Calendar images={calendarImages} />
}
```
