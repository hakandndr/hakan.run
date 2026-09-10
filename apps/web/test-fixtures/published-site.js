import { siteContent } from '../src/content.js';

export const completeSiteContent = () => {
  const content = structuredClone(siteContent);
  content.hero.profile = {
    name: 'Published Name',
    role: 'Published Role',
    image: '/media/HakanDundar.webp',
    imageAlt: 'Published profile',
    location: 'Published Location',
    topLabel: 'Published Top Label',
    topValue: '15+',
    bottomLabel: 'Published Bottom Label',
    bottomValue: 'Published Bottom Value',
  };
  content.about.chips = ['Published tag'];
  content.about.block1.sections.forEach((story, index) => {
    story.period = `Published period ${index + 1}`;
  });
  content.portfolio.cards.forEach((card, index) => {
    card.externalUrl = `https://example.com/project-${index + 1}`;
    card.technology = `Published technology ${index + 1}`;
  });
  content.footer.bottomSignature = 'Published signature';
  content.footer.bottomLocation = 'Published location';
  content.footer.logoText = '<h/>';
  return content;
};
