export interface SamplePhoto {
  id: string;
  title: string;
  decade: string;
  description: string;
  originalUrl: string;
  restoredUrl?: string;
  sampleCaption: string;
}

export const SAMPLE_VINTAGE_PHOTOS: SamplePhoto[] = [
  {
    id: 'wedding-1958',
    title: 'Boda de Mamá y Papá (1958)',
    decade: '1950s',
    description: 'Foto en blanco y negro con grietas, dobleces de papel y grano desgastado por los años.',
    originalUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800', // Classic portrait with sepia tones
    sampleCaption: 'El día más feliz de la juventud de mamá, vestida de novia en la iglesia del pueblo.',
  },
  {
    id: 'childhood-1965',
    title: 'Infancia en el Jardín Familiar (1965)',
    decade: '1960s',
    description: 'Retrato sepia con manchas de humedad y falta de enfoque en el rostro.',
    originalUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
    sampleCaption: 'Mamá a los 7 años jugando bajo el manzano con su vestido favorito hecho a mano.',
  },
  {
    id: 'family-1978',
    title: 'Vacaciones Familiares en la Playa (1978)',
    decade: '1970s',
    description: 'Fotografía a color desvaído con tonos amarillentos y pérdida de nitidez.',
    originalUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    sampleCaption: 'El primer viaje de mamá al mar junto a sus hermanos en aquel inolvidable verano.',
  },
];
