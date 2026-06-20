export const WA_NUMBER = '237693271126';

const productImages = {
  piecesAuto:
    'https://www.carter-cash.com/upload/media/category/0001/25/81c7f35be70ef7cd5249078863b23738ce7a21ac.jpeg',
  piecesMoteur:
    'https://thumbs.dreamstime.com/b/pi%C3%A8ces-d%C3%A9tach%C3%A9es-pi%C3%A8ce-de-rechange-ou-voiture-m%C3%A9canique-automobile-sur-fond-blanc-ensemble-nouvelle-en-m%C3%A9tal-moteur-service-213989102.jpg',
  kitMecanique:
    'https://thumbs.dreamstime.com/b/les-pi%C3%A8ces-d-automobile-placez-de-la-pi%C3%A8ce-voiture-en-m%C3%A9tal-rechange-automatique-m%C3%A9canicien-moteur-ou-morceau-isol%C3%A9e-sur-le-207018126.jpg',
  transmission:
    'https://image.made-in-china.com/202f0j00hyMqlkAcfEoa/Pi-ces-de-transmission-automatique-pour-voiture-japonaise-entra-nement-principal-pour-4bg1-4hf1-8971689800.webp',
  boiteVitesse: 'https://www.hyundai-pieces.com/assets/img/transmission.png',
  embrayage: 'https://gap-33.fr/wp-content/uploads/2024/02/Kits-dEmbrayage.jpeg',
  compresseur:
    'https://s.alicdn.com/@sc04/kf/Hc22bb9e3a09647268622060b9e25c4ffr/SD7V16-1273-1273N-1273-1823-A11-8104010BA-A118104010BA-AC-Compressor-for-Chery-Fulwin-Cowin-Tiggo-Eastar-A520-A516.png',
  freinage:
    'https://cdn.pkwteile.de/uploads/info_section/article/2783/1767798899_2007_68940efc99168d3e64f48275257233d1.png',
  diagnostic: 'https://le-de.cdn-website.com/8beea85bfeec413da6a78f8ba7b4d6a6/dms3rep/multi/opt/IMG_1841-640w.JPG',
  entretien:
    'https://www.carter-cash.com/upload/media/category/0001/18/c9f75eaebb237a298eda5769c5d509be36053c9b.jpeg',
};

export const categories = [
  {
    slug: 'pieces-moteur',
    title: 'Pièces moteur',
    text: "Composants fiables pour remettre un moteur d'aplomb.",
    image: productImages.piecesMoteur,
  },
  {
    slug: 'transmission',
    title: 'Transmission',
    text: 'Kits embrayage, boîtes, entraînement et organes de liaison.',
    image: productImages.boiteVitesse,
  },
  {
    slug: 'diagnostic',
    title: 'Diagnostic',
    text: 'Valises OBD, contrôle électronique et inspection atelier.',
    image: productImages.diagnostic,
  },
];

export const products = [
  {
    id: 'kit-pieces-auto',
    name: 'Pack Pièces Auto Essentielles',
    category: 'Pièces moteur',
    categorySlug: 'pieces-moteur',
    price: 85000,
    oldPrice: 105000,
    badge: 'MOCK',
    rating: 4,
    specs: ['Sélection temporaire', 'Pièces de remplacement', 'Contrôle compatibilité', 'Commande WhatsApp'],
    image: productImages.piecesAuto,
  },
  {
    id: 'ensemble-moteur-metal',
    name: 'Ensemble Moteur Métal',
    category: 'Pièces moteur',
    categorySlug: 'pieces-moteur',
    price: 125000,
    oldPrice: 150000,
    badge: 'PRO',
    rating: 5,
    specs: ['Pièces moteur', 'Usage réparation', 'Contrôle avant achat', 'Stock mock'],
    image: productImages.piecesMoteur,
  },
  {
    id: 'kit-mecanique-auto',
    name: 'Kit Mécanique Automobile',
    category: 'Pièces moteur',
    categorySlug: 'pieces-moteur',
    price: 99000,
    badge: 'BEST',
    rating: 4,
    specs: ['Lot multi-pièces', 'Usage atelier', 'Moteur et entretien', 'Image temporaire'],
    image: productImages.kitMecanique,
  },
  {
    id: 'entrainement-principal',
    name: 'Entraînement Principal 4BG1',
    category: 'Transmission',
    categorySlug: 'transmission',
    price: 180000,
    oldPrice: 220000,
    badge: 'PROMO',
    rating: 4,
    specs: ['Transmission automatique', 'Véhicules japonais', 'Référence à confirmer', 'Commande assistée'],
    image: productImages.transmission,
  },
  {
    id: 'module-transmission',
    name: 'Module Transmission Auto',
    category: 'Transmission',
    categorySlug: 'transmission',
    price: 145000,
    rating: 4,
    specs: ['Transmission', 'Assemblage complet', 'Compatibilité à valider', 'Usage atelier'],
    image: productImages.boiteVitesse,
  },
  {
    id: 'kit-embrayage',
    name: "Kit d'Embrayage",
    category: 'Transmission',
    categorySlug: 'transmission',
    price: 78000,
    oldPrice: 92000,
    badge: 'FLASH',
    rating: 5,
    specs: ['Disque', 'Mécanisme', 'Butée selon modèle', 'Vérification WhatsApp'],
    image: productImages.embrayage,
  },
  {
    id: 'compresseur-clim',
    name: 'Compresseur Climatisation',
    category: 'Climatisation',
    categorySlug: 'climatisation',
    price: 110000,
    rating: 4,
    specs: ['Compresseur AC', 'Référence à confirmer', 'Pièce mockée', 'Montage atelier'],
    image: productImages.compresseur,
  },
  {
    id: 'kit-freinage',
    name: 'Kit Freinage Complet',
    category: 'Freinage',
    categorySlug: 'freinage',
    price: 65000,
    oldPrice: 79000,
    badge: 'SECURITE',
    rating: 5,
    specs: ['Disques et plaquettes', 'Contrôle sécurité', 'Montage conseillé', 'Compatibilité modèle'],
    image: productImages.freinage,
  },
  {
    id: 'diagnostic-atelier',
    name: 'Diagnostic Atelier',
    category: 'Diagnostic',
    categorySlug: 'diagnostic',
    price: 35000,
    badge: 'SERVICE',
    rating: 5,
    specs: ['Lecture défauts', 'Inspection rapide', 'Rapport de panne', 'Conseil réparation'],
    image: productImages.diagnostic,
  },
  {
    id: 'pack-entretien',
    name: 'Pack Entretien Auto',
    category: 'Entretien',
    categorySlug: 'entretien',
    price: 45000,
    oldPrice: 56000,
    rating: 4,
    specs: ['Filtres et consommables', 'Entretien courant', 'Sélection mock', 'Commande rapide'],
    image: productImages.entretien,
  },
];

export const filters = ['Tout', 'Pièces moteur', 'Transmission', 'Diagnostic', 'Freinage', 'Climatisation', 'Entretien'];
