// BrewDesk theme — espresso & cream coffee-house palette
export const colors = {
  // QP brand colors (same as the app icon / splash screen)
  qpNavy: '#1b3380',     // brand background
  qpNavyDeep: '#13265F', // darker navy — secondary surfaces on navy
  qpBlue: '#1b87e6',     // brand accent blue
  qpMist: '#AEBEE8',     // muted light blue — secondary text on navy

  espresso: '#2D1B12',   // deep roasted brown — headers, primary text
  bean: '#4A2F1E',       // medium brown — secondary surfaces
  caramel: '#C98A3D',    // accent — buttons, highlights
  cream: '#F4E9DC',      // app background
  foam: '#FFFDF9',       // cards
  latte: '#8A6F5B',      // muted text
  leaf: '#4C7A5C',       // success / served
  berry: '#B5483A',      // pending / alerts
  line: '#E5D6C3',       // borders
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
};

export const shadow = {
  card: {
    shadowColor: '#2D1B12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};
