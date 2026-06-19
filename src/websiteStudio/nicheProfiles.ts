import type { NicheProfile } from './demoTypes';
import type { WebsiteCategory } from './types';

type ProfileSeed = Pick<
  NicheProfile,
  'visualMood' | 'typographyDirection' | 'spacingDirection' | 'borderRadiusStyle'
  | 'sectionOrder' | 'ctaStyle' | 'imageTreatment' | 'motionLevel' | 'heroType' | 'colorRoles'
>;

const profiles: Record<WebsiteCategory, ProfileSeed> = {
  boutique_hotel: profile('quiet luxury, local character, editorial calm', 'elegant serif headings with a neutral sans-serif body', 'generous', 'soft', ['navigation', 'hero', 'value', 'experiences', 'showcase', 'differentiators', 'conversion', 'footer'], 'refined solid button', 'cinematic editorial frames', 'subtle', 'editorial split', '#f4efe7', '#fffaf3', '#22201d', '#6c655d', '#694f38', '#b67c46'),
  villa: profile('private, spacious, sun-warmed retreat', 'high-contrast serif headings with a clean sans-serif body', 'generous', 'soft', ['navigation', 'hero', 'value', 'showcase', 'experiences', 'differentiators', 'conversion', 'footer'], 'reserved outline and solid pair', 'wide architectural frames', 'subtle', 'immersive framed', '#f6f0e5', '#fffdf8', '#24231f', '#6c685f', '#526052', '#c68a4a'),
  surf_camp: profile('adventurous, coastal, welcoming, grounded', 'bold humanist sans-serif headings with a highly readable sans-serif body', 'open and energetic', 'rounded', ['navigation', 'hero', 'value', 'experiences', 'showcase', 'differentiators', 'conversion', 'footer'], 'high-contrast rounded button', 'layered coastal shapes and documentary-style frames', 'moderate', 'layered coastal collage', '#f4f0e5', '#fffaf0', '#17333a', '#557078', '#0c6b68', '#ef8e4b'),
  gym: profile('focused, capable, energetic, direct', 'condensed-style system sans-serif headings with a neutral sans-serif body', 'compact', 'minimal', ['navigation', 'hero', 'value', 'experiences', 'differentiators', 'showcase', 'conversion', 'footer'], 'strong squared button', 'high-contrast geometric crops', 'moderate', 'bold statement', '#111315', '#1b1e21', '#f6f7f8', '#a9b0b5', '#d2f34c', '#ff7043'),
  martial_arts: profile('disciplined, respectful, precise, strong', 'weight-forward sans-serif headings with a calm sans-serif body', 'balanced', 'minimal', ['navigation', 'hero', 'value', 'experiences', 'differentiators', 'showcase', 'conversion', 'footer'], 'precise solid button', 'structured action frames', 'subtle', 'disciplined split', '#eeeae2', '#faf8f4', '#231f1d', '#6b635d', '#8b2f2f', '#c99a42'),
  wellness: profile('restorative, natural, unhurried, trustworthy', 'soft serif headings with a light sans-serif body', 'generous', 'pillowed', ['navigation', 'hero', 'value', 'experiences', 'showcase', 'differentiators', 'conversion', 'footer'], 'soft pill button', 'organic textures and quiet frames', 'subtle', 'organic composition', '#edf0e8', '#fafbf7', '#253329', '#69736b', '#657c63', '#c7a46b'),
  yoga: profile('centered, spacious, warm, intentional', 'graceful serif headings with a simple sans-serif body', 'generous', 'pillowed', ['navigation', 'hero', 'value', 'experiences', 'differentiators', 'showcase', 'conversion', 'footer'], 'calm pill button', 'soft tonal gradients and balanced frames', 'subtle', 'centered atmospheric', '#f2ede6', '#fffdfa', '#302b28', '#746b65', '#9b6f63', '#d8a879'),
  restaurant: profile('convivial, crafted, sensory, confident', 'editorial serif headings with a compact sans-serif body', 'balanced', 'soft', ['navigation', 'hero', 'value', 'experiences', 'showcase', 'differentiators', 'conversion', 'footer'], 'confident compact button', 'rich close-up framing without supplied food claims', 'subtle', 'editorial menu story', '#1e1b18', '#29241f', '#f7f0e8', '#b7aaa0', '#d27249', '#d9ad68'),
  real_estate: profile('clear, established, polished, location-aware', 'modern serif headings with a practical sans-serif body', 'balanced', 'minimal', ['navigation', 'hero', 'value', 'experiences', 'showcase', 'differentiators', 'conversion', 'footer'], 'polished squared button', 'clean property-style frames using conceptual placeholders', 'subtle', 'structured portfolio', '#f2f3f1', '#ffffff', '#202927', '#697370', '#315f58', '#b9925e'),
  aesthetic_clinic: profile('clinical calm, discreet, refined, reassuring', 'precise serif headings with a clean sans-serif body', 'generous', 'soft', ['navigation', 'hero', 'value', 'experiences', 'differentiators', 'showcase', 'conversion', 'footer'], 'refined soft button', 'clean light, abstract forms, no treatment claims', 'subtle', 'clean layered', '#f4f0ef', '#fffdfc', '#322b2d', '#776d70', '#8d626d', '#c6a48e'),
  professional_services: profile('credible, clear, measured, approachable', 'authoritative serif headings with a legible sans-serif body', 'balanced', 'minimal', ['navigation', 'hero', 'value', 'experiences', 'differentiators', 'showcase', 'conversion', 'footer'], 'clear solid button', 'abstract diagrams and structured fields', 'minimal', 'clarity-first split', '#edf1f2', '#ffffff', '#17262d', '#65747b', '#285b70', '#d68b4b'),
  other: profile('clear, contemporary, flexible, human', 'strong system sans-serif headings and body', 'balanced', 'soft', ['navigation', 'hero', 'value', 'experiences', 'showcase', 'differentiators', 'conversion', 'footer'], 'clear rounded button', 'neutral abstract shapes and editable frames', 'subtle', 'flexible split', '#f0f1ed', '#ffffff', '#222725', '#68706c', '#3e6759', '#d48a55'),
};

export function getNicheProfile(category: WebsiteCategory): NicheProfile {
  return { category, ...profiles[category] };
}

function profile(
  visualMood: string,
  typographyDirection: string,
  spacingDirection: string,
  borderRadiusStyle: string,
  sectionOrder: string[],
  ctaStyle: string,
  imageTreatment: string,
  motionLevel: string,
  heroType: string,
  canvas: string,
  surface: string,
  ink: string,
  muted: string,
  primary: string,
  accent: string,
): ProfileSeed {
  return {
    visualMood,
    typographyDirection,
    spacingDirection,
    borderRadiusStyle,
    sectionOrder,
    ctaStyle,
    imageTreatment,
    motionLevel,
    heroType,
    colorRoles: { canvas, surface, ink, muted, primary, accent },
  };
}
