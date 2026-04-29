import React, { useState } from 'react';
import { ResultsPage } from './ResultsPage';
import { ResultsDiscoverTab } from './ResultsDiscoverTab';
import { ResultsCarouselAnimated } from './ResultsCarouselAnimated';
import { ResultsSavedGrid } from './ResultsSavedGrid';
import { ResultsPurchasedGrid } from './ResultsPurchasedGrid';
import { ProfileDrawer } from './ProfileDrawer';
import { useProfileDrawer } from './useProfileDrawer';
import { useResultsTabs } from './useResultsTabs';
import {
  SAMPLE_RESULTS_CAROUSELS,
  SAMPLE_SAVED_ITEMS,
  SAMPLE_PURCHASED_ITEMS,
} from './sampleResultsData';
import { ProfileDraft, ResultsProductCardItem } from './types';
import { Button } from '../../ui/Button';
import { getInterestPills, getPlaceholderText } from '../quiz/ageBasedContent';
import { openExternal } from '../../../theaWeb/lib/openExternal';

const initialDraft: ProfileDraft = {
  emoji: '🌷',
  name: 'Mom',
  birthMonth: 6,
  birthDay: 14,
  gender: 'female',
  relationship: 'Mom',
  age: 65,
  occasion: 'Birthday',
  priceMin: 0,
  priceMax: 150,
  interests: ['Cooking', 'Travel', 'Books'],
  vibes: ['Sentimental', 'Practical', 'Cozy'],
  moreAbout: '',
};

/** A self-contained Live container that wires sample data + state hooks into
 *  the full ResultsPage. Story-only — production callers will replace this
 *  with their own container that talks to RoomContext + Firestore. */
export const ResultsPageAnimated: React.FC = () => {
  const tabs = useResultsTabs();
  const profile = useProfileDrawer({ initial: initialDraft });

  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<ResultsProductCardItem[]>(SAMPLE_SAVED_ITEMS);
  const [purchasedItems, setPurchasedItems] = useState<ResultsProductCardItem[]>(SAMPLE_PURCHASED_ITEMS);
  const [refreshing, setRefreshing] = useState(false);

  const interestPills = getInterestPills(profile.draft.age ?? 35, profile.draft.gender);
  const placeholder = getPlaceholderText(profile.draft.gender ?? 'other', profile.draft.age ?? 35);

  const interestsLabel = (() => {
    const list = profile.draft.interests;
    if (list.length === 0) return 'Add interests';
    if (list.length <= 3) return list.join(', ');
    return `${list.slice(0, 2).join(', ')} +${list.length - 2}`;
  })();

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const allCarouselProducts = SAMPLE_RESULTS_CAROUSELS.flatMap((s) => s.products);
  const findProduct = (id: string) => allCarouselProducts.find((p) => p.id === id);

  return (
    <ResultsPage
      rightActions={<Button label="Account" variant="ghost" size="md" />}
      personEmoji={profile.draft.emoji}
      personName={profile.draft.name || 'Mom'}
      interestsLabel={interestsLabel}
      onProfilePillClick={profile.openDrawer}
      activeTab={tabs.activeTab}
      onTabChange={tabs.setActiveTab}
      likedCount={savedItems.length}
      purchasedCount={purchasedItems.length}
      drawers={
        <ProfileDrawer
          open={profile.open}
          onClose={profile.closeDrawer}
          draft={profile.draft}
          savedHints={profile.savedHints}
          interestPills={interestPills}
          freeformPlaceholder={placeholder}
          onChange={profile.setField}
          onUpdatePicks={() => {
            profile.commit();
            refresh();
          }}
        />
      }
    >
      {tabs.activeTab === 'recommended' && (
        <ResultsDiscoverTab
          refreshing={refreshing}
          summary={{ saves: savedItems.length, dismissed: dismissed.size }}
          onRefresh={refresh}
        >
          {SAMPLE_RESULTS_CAROUSELS.map((section, i) => (
            <ResultsCarouselAnimated
              key={section.id}
              title={section.title}
              products={section.products}
              isFirstCarousel={i === 0}
              isLiked={(id) => liked.has(id)}
              isDismissed={(id) => dismissed.has(id)}
              isPurchased={(id) => purchased.has(id)}
              exitingIds={new Set()}
              onSaveClick={(p) => {
                setLiked((prev) => {
                  const next = new Set(prev);
                  next.add(p.id);
                  return next;
                });
                setSavedItems((prev) => (prev.find((x) => x.id === p.id) ? prev : [...prev, p]));
              }}
              onDismissFinalize={(p) => {
                setDismissed((prev) => {
                  const next = new Set(prev);
                  next.add(p.id);
                  return next;
                });
              }}
              onMarkPurchased={(p) => {
                setPurchased((prev) => {
                  const next = new Set(prev);
                  next.add(p.id);
                  return next;
                });
                setPurchasedItems((prev) => (prev.find((x) => x.id === p.id) ? prev : [...prev, p]));
              }}
              onProductClick={(p) => {
                if (p.productUrl) openExternal(p.productUrl);
              }}
            />
          ))}
        </ResultsDiscoverTab>
      )}
      {tabs.activeTab === 'liked' && (
        <ResultsSavedGrid
          items={savedItems}
          onUnsave={(item) => {
            setSavedItems((prev) => prev.filter((x) => x.id !== item.id));
            setLiked((prev) => {
              const next = new Set(prev);
              next.delete(item.id);
              return next;
            });
          }}
        />
      )}
      {tabs.activeTab === 'purchased' && (
        <ResultsPurchasedGrid
          items={purchasedItems}
          personName={profile.draft.name || 'them'}
          onUndo={(item) => {
            setPurchasedItems((prev) => prev.filter((x) => x.id !== item.id));
            setPurchased((prev) => {
              const next = new Set(prev);
              next.delete(item.id);
              return next;
            });
            const product = findProduct(item.id) ?? item;
            setSavedItems((prev) => (prev.find((x) => x.id === product.id) ? prev : [...prev, product]));
            setLiked((prev) => {
              const next = new Set(prev);
              next.add(product.id);
              return next;
            });
          }}
        />
      )}
    </ResultsPage>
  );
};
