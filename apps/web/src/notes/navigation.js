export const withNotesNavigation = (links) => {
  if (links.some((link) => link.href === '/notes')) return links;
  const about = links.findIndex((link) => link.href === '/#about');
  const position = about < 0 ? links.length : about;
  return [...links.slice(0, position), { name: 'Notes', href: '/notes' }, ...links.slice(position)];
};
