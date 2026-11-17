export interface VinylTrack {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  order: number;
  isPublished: boolean;
  ownerUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VinylPlayerConfig {
  enabled: boolean;
  title: string;
  autoplayHint: string;
}

export const DEFAULT_VINYL_CONFIG: VinylPlayerConfig = {
  enabled: true,
  title: 'Our Little Vinyl Player ♡',
  autoplayHint: 'Ketuk piringannya untuk memutar lagu',
};

export const DEFAULT_VINYL_PLAYLIST: VinylTrack[] = [
  {
    id: 'vinyl-track-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
    youtubeVideoId: 'lTRiuFIWV54',
    title: 'Warm Afternoon Study & Memories',
    artist: 'Lofi Girl · 1 A.M Study Session',
    thumbnailUrl: 'https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg',
    order: 1,
    isPublished: true,
  },
  {
    id: 'vinyl-track-2',
    youtubeUrl: 'https://www.youtube.com/watch?v=TURbeWK2wwg',
    youtubeVideoId: 'TURbeWK2wwg',
    title: 'Soft Rain & Quiet Promises',
    artist: 'Lofi Girl · 4 A.M Study Session',
    thumbnailUrl: 'https://i.ytimg.com/vi/TURbeWK2wwg/hqdefault.jpg',
    order: 2,
    isPublished: true,
  },
];
