export const categories = {
  habitual: { label: 'Panes habituales' },
  especial: { label: 'Especiales de masa madre' },
};

export const products = [
  {
    pickupDays: 'all',
    slug: 'baguette', name: 'Baguette', category: 'habitual', price: 15,
    description: 'Corteza dorada y crujiente, con el sabor del trigo en cada mordida.',
    image: 'baguette', alt: 'Baguettes de corteza dorada sobre papel de panadería',
    source: 'https://www.instagram.com/p/C4JXge8xWb6/',
  },
  {
    pickupDays: [5, 6],
    slug: 'integral', name: 'Pan integral de masa madre', category: 'habitual', price: 30,
    description: 'Una hogaza de 100 % trigo integral, elaborada con masa madre.',
    image: 'integral', alt: 'Hogaza integral con un corte longitudinal sobre papel',
    source: 'https://www.instagram.com/p/DVcA7qKDyum/',
  },
  {
    pickupDays: [6],
    slug: 'sesamo', name: 'Pan de sésamo', category: 'especial', price: 32,
    description: 'Pan de masa madre con una corteza cubierta de semillas de sésamo.',
    image: 'sesamo', alt: 'Pan ovalado con semillas de sésamo en la corteza',
    source: 'https://www.instagram.com/reel/DYnOmwqxssr/',
  },
  {
    pickupDays: [5, 6],
    slug: 'ciabatta', name: 'Ciabatta 100 % biga', category: 'habitual', price: 20,
    description: 'Pan de estilo italiano con miga aireada y aceite de oliva virgen extra.',
    image: 'ciabatta', alt: 'Ciabattas cortadas que muestran una miga aireada',
    source: 'https://www.instagram.com/p/DI14Ty1xinW/',
  },
  {
    pickupDays: [6],
    slug: 'pasas-y-nueces', name: 'Pan de pasas y nueces', category: 'especial', price: 38,
    description: 'Masa madre, pasas y nueces en una hogaza de corteza tostada.',
    image: 'pasas-nueces', alt: 'Hogaza rebanada con pasas y nueces visibles en la miga',
    source: 'https://www.instagram.com/p/DIkkpzIxESI/',
  },
];

export const featured = ['baguette', 'integral', 'pasas-y-nueces'];
