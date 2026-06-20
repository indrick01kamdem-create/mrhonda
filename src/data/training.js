import { BatteryCharging, Car, CircuitBoard, Wrench } from 'lucide-react';

export const START_DATE = '7 septembre 2026';

export const programs = [
  {
    title: 'Mécanique automobile',
    description: 'Moteur, transmission, freinage, suspension et entretien courant sur de vraies voitures.',
    duration: '2-3 ans',
    price: '150 000 FCFA',
    icon: Wrench,
  },
  {
    title: 'Mécatronique',
    description: "La mécanique rencontre l'électronique embarquée: capteurs, calculateurs et diagnostic logique.",
    duration: '2-3 ans',
    price: 'Sur devis',
    icon: CircuitBoard,
  },
  {
    title: 'Diagnostic automobile',
    description: 'Lecture OBD, effacement de défauts et analyse de panne en conditions réelles.',
    duration: '3 mois',
    price: 'Sur devis',
    icon: Car,
  },
  {
    title: 'Électronique auto',
    description: 'Circuits, faisceaux, capteurs et systèmes embarqués pour intervenir avec méthode.',
    duration: '1-2 ans',
    price: 'Sur devis',
    icon: BatteryCharging,
  },
];

export const levels = ['Aucun', 'CEP', 'BEPC', 'Probatoire', 'Baccalauréat', 'BTS / Licence et +'];
export const experiences = [
  ['Débutant total', "Je n'ai jamais pratiqué"],
  ['Déjà observé en garage', "J'ai regardé travailler"],
  ["Apprenti (moins d'1 an)", 'Un peu de pratique'],
  ['Expérimenté', 'Je pratique déjà'],
];
export const goals = [
  'Trouver un travail rapidement',
  'Ouvrir mon propre garage',
  'Améliorer mes compétences',
  'Me spécialiser',
  'Apprendre par passion',
];
export const sources = ['TikTok', 'Facebook', 'WhatsApp', 'Recommandation'];
