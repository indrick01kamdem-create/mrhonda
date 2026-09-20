export const formatPrice = (value) =>
  new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value) + ' FCFA';

export const whatsappUrl = (number, message) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
