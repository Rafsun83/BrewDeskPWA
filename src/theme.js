// BrewDesk theme — QP brand palette (navy & blue, same as app icon/splash)
export const colors = {
  // QP brand colors (same as the app icon / splash screen)
  qpNavy: '#1b3380',     // brand background
  qpNavyDeep: '#13265F', // darker navy — secondary surfaces on navy
  qpBlue: '#1b87e6',     // brand accent blue
  qpMist: '#AEBEE8',     // muted light blue — secondary text on navy

  // The original coffee-house token names are kept so screens don't need
  // renaming, but their values now map to the QP brand palette.
  espresso: '#13265F',   // deep navy — headers, primary text
  bean: '#1b3380',       // brand navy — secondary surfaces
  caramel: '#1b87e6',    // accent — buttons, highlights
  cream: '#EEF3FB',      // app background (light blue tint)
  foam: '#FFFFFF',       // cards
  latte: '#5A6B96',      // muted blue-grey text
  leaf: '#2F9E63',       // success / served
  berry: '#D6493E',      // pending / alerts
  line: '#D6DEF0',       // borders
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
};

export const shadow = {
  card: {
    shadowColor: '#13265F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};
