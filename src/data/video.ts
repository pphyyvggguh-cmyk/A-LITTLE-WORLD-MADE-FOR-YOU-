export interface BirthdayVideoConfig {
  title: string;
  subtitle: string;
  description: string;
  ticketLabel: string;
  videoSrc: string;
  thumbnailSrc: string;
}

export const DEFAULT_VIDEO_CONFIG: BirthdayVideoConfig = {
  title: 'A Special Message For You ♡',
  subtitle: '04 · Ruang Putar Khusus',
  description: 'Duduk santai sebentar ya, video ini aku bikin khusus untuk ulang tahunmu.',
  ticketLabel: 'TIKET · 19.02',
  videoSrc: '/assets/videos/birthday-greeting.mp4',
  thumbnailSrc: '',
};
