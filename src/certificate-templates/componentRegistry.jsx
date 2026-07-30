import EditorialTemplate from './components/EditorialTemplate.jsx';
import GeometricTemplate from './components/GeometricTemplate.jsx';
import MinimalTemplate from './components/MinimalTemplate.jsx';
import RainbowStarsTemplate from './components/RainbowStarsTemplate.jsx';
import JungleFriendsTemplate from './components/JungleFriendsTemplate.jsx';
import SpaceExplorerTemplate from './components/SpaceExplorerTemplate.jsx';
import OceanAdventureTemplate from './components/OceanAdventureTemplate.jsx';
import StorybookCastleTemplate from './components/StorybookCastleTemplate.jsx';
import SportsChampionTemplate from './components/SportsChampionTemplate.jsx';
import IslamicHeritageTemplate from './components/IslamicHeritageTemplate.jsx';
import GraduationHonorTemplate from './components/GraduationHonorTemplate.jsx';
import CreativeArtsTemplate from './components/CreativeArtsTemplate.jsx';
import { resolveTemplateId } from './templateUtils.js';

export const TEMPLATE_COMPONENTS = Object.freeze({
  editorial: EditorialTemplate,
  geometric: GeometricTemplate,
  minimal: MinimalTemplate,
  'rainbow-stars': RainbowStarsTemplate,
  'jungle-friends': JungleFriendsTemplate,
  'space-explorer': SpaceExplorerTemplate,
  'ocean-adventure': OceanAdventureTemplate,
  'storybook-castle': StorybookCastleTemplate,
  'sports-champion': SportsChampionTemplate,
  'islamic-heritage': IslamicHeritageTemplate,
  'graduation-honor': GraduationHonorTemplate,
  'creative-arts': CreativeArtsTemplate,
});

export function resolveTemplateComponent(templateId) {
  return TEMPLATE_COMPONENTS[resolveTemplateId(templateId)] || EditorialTemplate;
}
