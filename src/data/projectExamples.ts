export const projectExamples = [
  "4 bedroom modern house, 3 baths, landscaped garden and pool",
  "Renovate 2 bedrooms and 1 bath in existing house", 
  "Large modern house with 3 bedrooms, 2 bathrooms and indoor pool",
  "Minimalistic house, 2 bedrooms, 1 bath, garden",
  "Large complex, 15 units of single bedroom houses, underground parking",
  "Modern family home with 4 bedrooms, 2.5 baths, open kitchen",
  "Renovation of 3 bedroom house, update 2 bathrooms completely",
  "Contemporary house with 3 bedrooms, 2 baths, rooftop terrace",
  "Apartment complex with 8 units, each 2 bedrooms, shared courtyard",
  "Luxury home with 5 bedrooms, 4 baths, swimming pool and spa",
  "Complete renovation of 2 bedroom, 1 bath cottage with garden",
  "Multi-family building with 6 units, mixed 1-2 bedroom apartments",
  "Modern townhouse with 3 bedrooms, 2.5 baths, private garage",
  "Residential complex with 20 studio and 1-bedroom units",
  "Custom home with 4 bedrooms, 3 baths, outdoor entertainment area",
  "Renovation project: expand 2 bedroom house to 3 bedrooms, 2 baths",
  "Duplex with 2 units, each having 2 bedrooms and 1.5 baths",
  "Eco-friendly home with 3 bedrooms, 2 baths, solar panels",
  "Large estate with 6 bedrooms, 5 baths, guest house and pool",
  "Complete gut renovation of 2 bedroom, 2 bath urban loft"
];

export const getRandomExamples = (count: number = 3) => {
  const shuffled = [...projectExamples].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};