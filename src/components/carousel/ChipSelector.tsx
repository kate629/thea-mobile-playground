import React from 'react';

interface ChipConfig {
  id: string;
  age_min: number;
  age_max?: number;
}

const CHIP_CAROUSELS: Record<string, ChipConfig> = {
  Cooking: { id: 'cooking', age_min: 18 },
  Jewelry: { id: 'jewelry', age_min: 14 },
  Clothes: { id: 'clothes', age_min: 14 },
  Fitness: { id: 'fitness', age_min: 18 },
  Sweets: { id: 'sweets', age_min: 18 },
  Alcohol: { id: 'alcohol', age_min: 21 },
  Books: { id: 'books', age_min: 18 },
  Crafts: { id: 'crafts', age_min: 10 },
  Plants: { id: 'plants', age_min: 18 },
  Games: { id: 'games', age_min: 0 },
  Sports: { id: 'sports', age_min: 10 },
  Beauty: { id: 'beauty', age_min: 14 },
  HomeDecor: { id: 'homedecor', age_min: 18 },
  Tech: { id: 'tech', age_min: 14 },
  Toys: { id: 'toys', age_min: 0, age_max: 13 },
  Accessories: { id: 'accessories', age_min: 14 },
  Music: { id: 'music', age_min: 10 },
  Travel: { id: 'travel', age_min: 18 },
  Outdoors: { id: 'outdoors', age_min: 18 },
  Hosting: { id: 'hosting', age_min: 18 },
};

const KID_CHIPS = ['Toys', 'Books', 'Crafts', 'Clothes', 'Cooking', 'Sports', 'Games', 'Outdoors'];

interface ChipSelectorProps {
  age: number;
  selectedChips: Set<string>;
  onToggleChip: (chip: string) => void;
}

const getVisibleChips = (age: number): string[] => {
  if (age < 14) {
    return KID_CHIPS;
  }
  return Object.entries(CHIP_CAROUSELS)
    .filter(([, config]) => age >= config.age_min && age <= (config.age_max ?? 999))
    .map(([name]) => name);
};

const ChipSelector: React.FC<ChipSelectorProps> = ({ age, selectedChips, onToggleChip }) => {
  const visibleChips = getVisibleChips(age);

  return (
    <div>
      <div className="chip-selector">
        {visibleChips.map((chip) => {
          const selected = selectedChips.has(chip);
          return (
            <button
              key={chip}
              type="button"
              className={`btn btn-outline-primary m-1 ${selected ? 'active' : ''}`}
              onClick={() => onToggleChip(chip)}
              style={{
                border: '1px solid black',
                backgroundColor: selected ? '#F8BD0080' : 'transparent',
                color: 'black',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F8BD0080';
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>
      {selectedChips.size < 3 && (
        <p className="chip-nudge">Select at least 3 interests for better results</p>
      )}
    </div>
  );
};

export default ChipSelector;
