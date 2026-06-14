// Edit this file to add / remove items on the menu.
// health: 'good' | 'moderate' | 'bad'  — used by Health Insights tab
export const MENU = [
  {
    section: 'Coffee & Drinks',
    items: [
      { id: 'espresso',     name: 'Espresso',        emoji: '☕', health: 'good',     cal: 5   },
      { id: 'cappuccino',   name: 'Cappuccino',       emoji: '🍮', health: 'moderate', cal: 120 },
      { id: 'latte',        name: 'Latte',            emoji: '🥛', health: 'moderate', cal: 150 },
      { id: 'black-coffee', name: 'Black Coffee',     emoji: '🫖', health: 'good',     cal: 5   },
      { id: 'milk-tea',     name: 'Milk Tea (Cha)',   emoji: '🍵', health: 'moderate', cal: 90  },
      { id: 'green-tea',    name: 'Green Tea',        emoji: '🌿', health: 'good',     cal: 2   },
      { id: 'cold-coffee',  name: 'Cold Coffee',      emoji: '🧋', health: 'bad',      cal: 250 },
      { id: 'white-coffee', name: 'White Coffee',     emoji: '☕', health: 'moderate', cal: 80  },
      { id: 'red-tea',      name: 'Red Tea',          emoji: '🫖', health: 'good',     cal: 2   },
      { id: 'juice',        name: 'Juice',            emoji: '🧃', health: 'moderate', cal: 110 },
      { id: 'water',        name: 'Water Bottle',     emoji: '💧', health: 'good',     cal: 0   },
    ],
  },
  {
    section: 'Snacks',
    items: [
      { id: 'samosa',    name: 'Samosa',     emoji: '🥟', health: 'bad',      cal: 260 },
      { id: 'singara',   name: 'Singara',    emoji: '🥠', health: 'bad',      cal: 240 },
      { id: 'biscuit',   name: 'Biscuits',   emoji: '🍪', health: 'bad',      cal: 150 },
      { id: 'cake',      name: 'Cake Slice', emoji: '🍰', health: 'bad',      cal: 320 },
      { id: 'sandwich',  name: 'Sandwich',   emoji: '🥪', health: 'moderate', cal: 280 },
      { id: 'noodles',   name: 'Noodles',    emoji: '🍜', health: 'moderate', cal: 350 },
      { id: 'chips',     name: 'Chips',      emoji: '🍟', health: 'bad',      cal: 200 },
      { id: 'fruit',     name: 'Fruits',     emoji: '🍎', health: 'good',     cal: 80  },
      { id: 'chanachur', name: 'Chanachur',  emoji: '🥜', health: 'bad',      cal: 180 },
    ],
  },
];
