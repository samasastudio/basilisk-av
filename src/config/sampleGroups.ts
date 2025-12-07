/**
 * Sample group definitions for organizing Dirt Samples categories
 *
 * Groups are matched against category names using keyword patterns.
 * Categories are assigned to the first matching group.
 */

export interface SampleGroup {
  /** Display name for the group */
  name: string;
  /** Icon/emoji for the group (optional) */
  icon?: string;
  /** Keywords to match against category names (case-insensitive) */
  keywords: string[];
  /** Exact category names to include */
  exact?: string[];
}

/**
 * Sample groups ordered by priority (first match wins)
 */
export const SAMPLE_GROUPS: SampleGroup[] = [
  {
    name: 'Drums',
    icon: '🥁',
    keywords: ['808', '909', 'drum', 'dr_', 'gretsch', 'casio', 'roland', 'linn', 'dmx', 'oberheim'],
    exact: ['jazz', 'tabla', 'techno', 'house', 'electro', 'breakbeat', 'rave']
  },
  {
    name: 'Bass',
    icon: '🎸',
    keywords: ['bass', 'jvbass', 'wobble', 'sub', 'reese'],
    exact: ['db', 'moog']
  },
  {
    name: 'Kicks',
    icon: '💥',
    keywords: ['kick', 'bd'],
    exact: ['bd']
  },
  {
    name: 'Snares',
    icon: '🪘',
    keywords: ['snare', 'sd', 'rim', 'clap', 'cp'],
    exact: ['sd', 'cp', 'hc', 'lt', 'mt', 'ht']
  },
  {
    name: 'Hi-Hats',
    icon: '🎩',
    keywords: ['hat', 'hh', 'hihat', 'oh', 'ch'],
    exact: ['hh', 'oh', 'ch']
  },
  {
    name: 'Percussion',
    icon: '🪇',
    keywords: ['perc', 'conga', 'bongo', 'tom', 'shaker', 'tamb', 'clave', 'cow', 'bell', 'click', 'rim', 'wood'],
    exact: ['tabla', 'hand', 'finger', 'click']
  },
  {
    name: 'Synth',
    icon: '🎹',
    keywords: ['synth', 'arp', 'lead', 'pad', 'pluck', 'square', 'saw', 'sine', 'wave', 'fm', 'analog'],
    exact: ['arpy', 'blip', 'bleep', 'ades']
  },
  {
    name: 'Keys',
    icon: '🎹',
    keywords: ['piano', 'keys', 'rhodes', 'organ', 'ep', 'clav', 'wurli', 'elec'],
    exact: ['keys', 'epiano']
  },
  {
    name: 'Strings',
    icon: '🎻',
    keywords: ['string', 'violin', 'cello', 'viola', 'orch', 'pizz'],
    exact: []
  },
  {
    name: 'Vocal',
    icon: '🎤',
    keywords: ['vocal', 'voice', 'vox', 'speak', 'speech', 'mouth', 'sing', 'choir', 'human'],
    exact: ['alphabet', 'numbers']
  },
  {
    name: 'FX',
    icon: '✨',
    keywords: ['fx', 'noise', 'glitch', 'ambient', 'atmos', 'texture', 'hit', 'impact', 'sweep', 'riser', 'down'],
    exact: ['noise', 'static', 'hiss']
  },
  {
    name: 'Nature',
    icon: '🌿',
    keywords: ['nature', 'bird', 'water', 'wind', 'rain', 'thunder', 'animal', 'forest', 'ocean', 'fire'],
    exact: ['wind', 'rain']
  },
  {
    name: 'Industrial',
    icon: '🏭',
    keywords: ['industrial', 'metal', 'machine', 'mech', 'robot', 'factory'],
    exact: ['industrial', 'metal']
  }
];

/**
 * Default group for categories that don't match any keywords
 */
export const DEFAULT_GROUP: SampleGroup = {
  name: 'Other',
  icon: '📁',
  keywords: [],
  exact: []
};

/**
 * Categorize a sample category into a group
 */
export const categorizeToGroup = (categoryName: string): string => {
  const lowerName = categoryName.toLowerCase();

  for (const group of SAMPLE_GROUPS) {
    // Check exact matches first
    if (group.exact?.includes(lowerName)) {
      return group.name;
    }

    // Check keyword matches
    for (const keyword of group.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return group.name;
      }
    }
  }

  return DEFAULT_GROUP.name;
};

/**
 * Get all unique group names (including "All" and default)
 */
export const getAllGroupNames = (): string[] => [
  ...new Set(['All', ...SAMPLE_GROUPS.map(g => g.name), DEFAULT_GROUP.name])
];

/**
 * Get group info by name
 */
export const getGroupByName = (name: string): SampleGroup | undefined =>
  name === DEFAULT_GROUP.name ? DEFAULT_GROUP : SAMPLE_GROUPS.find(g => g.name === name);
