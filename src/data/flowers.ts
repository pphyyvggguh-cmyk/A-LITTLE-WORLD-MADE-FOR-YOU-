export type FlowerSpecies =
  | 'sakura'
  | 'sunflower'
  | 'lavender'
  | 'rose'
  | 'daisy'
  | 'forgetmenot'
  | 'tulip';

export interface CollectibleFlower {
  id: string;
  species: FlowerSpecies;
  name: string;
  indonesianName: string;
  section: 'hub' | 'story' | 'world' | 'letters' | 'video';
  locationHint: string;
  petalColor: string;
  accentColor: string;
}

/**
 * Exactly 7 unique botanical flowers hidden naturally across the website.
 */
export const FLOWERS_DATA: CollectibleFlower[] = [
  {
    id: 'flower-sakura',
    species: 'sakura',
    name: 'Cherry Blossom',
    indonesianName: 'Bunga Sakura',
    section: 'hub',
    locationHint: 'Terselip di sudut halaman utama (Hub)',
    petalColor: '#E8BFC5',
    accentColor: '#743D4A',
  },
  {
    id: 'flower-sunflower',
    species: 'sunflower',
    name: 'Golden Sunflower',
    indonesianName: 'Bunga Matahari',
    section: 'story',
    locationHint: 'Menghiasi bagian awal papan scrapbook Our Story',
    petalColor: '#D9A74A',
    accentColor: '#38271F',
  },
  {
    id: 'flower-daisy',
    species: 'daisy',
    name: 'Ivory Daisy',
    indonesianName: 'Bunga Aster Putih',
    section: 'story',
    locationHint: 'Terselip di ujung kanan papan kenangan Our Story',
    petalColor: '#FBF6EE',
    accentColor: '#C4A574',
  },
  {
    id: 'flower-forgetmenot',
    species: 'forgetmenot',
    name: 'Forget-Me-Not',
    indonesianName: 'Bunga Forget-Me-Not',
    section: 'world',
    locationHint: 'Dekat kompas peta di halaman Our World',
    petalColor: '#8FB3C9',
    accentColor: '#E6B85C',
  },
  {
    id: 'flower-lavender',
    species: 'lavender',
    name: 'Wild Lavender',
    indonesianName: 'Bunga Lavender',
    section: 'world',
    locationHint: 'Terselip di bagian daftar destinasi Our World',
    petalColor: '#9E8FB2',
    accentColor: '#455342',
  },
  {
    id: 'flower-rose',
    species: 'rose',
    name: 'Pressed Dusty Rose',
    indonesianName: 'Mawar Kering',
    section: 'letters',
    locationHint: 'Di samping koleksi prangko Birthday Letters',
    petalColor: '#C97B84',
    accentColor: '#743D4A',
  },
  {
    id: 'flower-tulip',
    species: 'tulip',
    name: 'Brick Tulip',
    indonesianName: 'Bunga Tulip',
    section: 'video',
    locationHint: 'Di sudut bingkai bioskop mini Birthday Video',
    petalColor: '#A6533B',
    accentColor: '#C4A574',
  },
];

export const VALID_FLOWER_IDS = new Set(FLOWERS_DATA.map((f) => f.id));
