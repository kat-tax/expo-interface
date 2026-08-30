import type {Drop} from './types';

export function getDrop(id?: string): Drop | undefined {
  if (id == null) return undefined;
  return demoDropData.find(drop => drop.id === id);
}

export const demoDropData: Drop[] = [
  {
    id: '_XEUUry_Bfczz5diaP6v',
    name: 'HIS-201 Midterm Essay',
    size: '1 GB',
    privacy: 'private',
    description:
      'Focus on the key themes discussed in class. Ensure your essay is ' +
      'well-structured, with a clear thesis statement and strong supporting ' +
      'arguments. Remember to cite your sources correctly and adhere to the ' +
      'provided formatting guidelines.',
    expiresAt: new Date('2026-06-15T14:00:00'),
    limit: 'Any file, 50MB size limit (1GB total)',
    files: [
      {id: 1, name: 'Annual report 2025.pdf', size: '2.2 MB', type: 'text', status: 'complete', progress: 1},
      {id: 2, name: 'Hero banner.png', size: '2.2 MB', type: 'image', status: 'complete', progress: 1},
      {id: 3, name: 'Onboarding flow.mp4', size: '2.2 MB', type: 'video', status: 'failed', progress: 0.4},
    ],
  },
  {
    id: 'DU6dD9KCHJ4cMidBoYMa',
    name: 'Demo Reel',
    size: '240 MB',
    privacy: 'public',
    description: 'Drop your latest cuts here. We will review and assemble the final reel.',
    expiresAt: new Date('2026-07-01T18:30:00'),
    limit: 'Any file, 250MB size limit (240MB total)',
    files: [
      {id: 1, name: 'reel.mp4', size: '220 MB', type: 'video', status: 'complete', progress: 1},
      {id: 2, name: 'soundtrack.mp3', size: '18 MB', type: 'audio', status: 'uploading', progress: 0.65},
      {id: 3, name: 'thumbnail.jpg', size: '240 KB', type: 'image', status: 'complete', progress: 1},
    ],
  },
  {
    id: 'sH7dgQ9i7vWlA-Fh3x7d',
    name: 'Project X Assets',
    size: '512 MB',
    privacy: 'private',
    description: 'Shared workspace for Project X. Upload specs, art, and builds.',
    expiresAt: new Date('2026-09-20T09:00:00'),
    limit: 'Any file, 1GB size limit (512MB total)',
    files: [
      {id: 1, name: 'spec.tsx', size: '3 KB', type: 'text', status: 'complete', progress: 1},
      {id: 2, name: 'logo.png', size: '512 KB', type: 'image', status: 'complete', progress: 1},
      {id: 3, name: 'build.exe', size: '511 MB', type: 'other', status: 'uploading', progress: 0.25},
    ],
  },
  {
    id: 'qSqHXLRhyh_YScm0JO7v',
    name: 'Summer Mixtape',
    size: '96 MB',
    privacy: 'public',
    description: 'Collaborative mixtape. Add your tracks and cover art.',
    expiresAt: new Date('2026-08-05T20:00:00'),
    limit: 'Audio & images, 50MB size limit (96MB total)',
    files: [
      {id: 1, name: 'track-01.mp3', size: '32 MB', type: 'audio', status: 'complete', progress: 1},
      {id: 2, name: 'track-02.mp3', size: '28 MB', type: 'audio', status: 'failed', progress: 0.5},
      {id: 3, name: 'cover.jpg', size: '180 KB', type: 'image', status: 'complete', progress: 1},
    ],
  },
];
