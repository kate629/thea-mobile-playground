import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, ensureAuth } from '../../firebaseConfig';
import { getCarouselFeed } from '../../firebaseFunctions';
import RecipientForm from './RecipientForm';
import ChipSelector from './ChipSelector';
import CarouselRow from './CarouselRow';
import { Product } from './ProductCard';
import './CarouselFeedPage.css';

type FeedStatus = 'idle' | 'processing' | 'finalizing' | 'complete' | 'error';

interface CarouselData {
  display_name: string;
  status: string;
  products: Product[];
  product_count?: number;
  target_count?: number;
}

type CarouselEntry = [string, CarouselData];

const CarouselFeedPage: React.FC = () => {
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [relationship, setRelationship] = useState('');
  const [freeform, setFreeform] = useState('');
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [carousels, setCarousels] = useState<Record<string, CarouselData>>({});
  const [carouselOrder, setCarouselOrder] = useState<string[]>([]);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>('idle');
  const [leaderStatus, setLeaderStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCarouselsRef = useRef<Record<string, CarouselData>>({});
  const latestStatusRef = useRef<FeedStatus>('idle');

  const handleToggleChip = useCallback((chip: string) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) {
        next.delete(chip);
      } else {
        next.add(chip);
      }
      return next;
    });
  }, []);

  // Clean up snapshot listener and debounce timer on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!gender || age === '' || !relationship) {
      setError('Please fill in gender, age, and relationship.');
      return;
    }

    // Tear down any previous listener and debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    setError(null);
    setFeedStatus('processing');
    setCarousels({});
    setCarouselOrder([]);

    try {
      // 1. Get stable anonymous uid + timestamp for a unique session per request
      const uid = await ensureAuth();
      const sessionId = `${uid}_${Date.now()}`;
      console.log('Session:', sessionId);

      // 2. Start onSnapshot directly — no React render cycle delay.
      //    Listening before the doc exists is fine (empty snapshot until first write).
      unsubRef.current = onSnapshot(
        doc(db, 'carouselSessions', sessionId),
        (snapshot) => {
          const data = snapshot.data();
          if (!data) return;

          latestCarouselsRef.current = data.carousels || {};
          latestStatusRef.current = data.status as FeedStatus;
          if (data.carousel_order) setCarouselOrder(data.carousel_order);
          if (data.leader_status) setLeaderStatus(data.leader_status);

          // Flush immediately for terminal states
          if (data.status === 'complete' || data.status === 'error') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setCarousels(latestCarouselsRef.current);
            setFeedStatus(latestStatusRef.current);
            return;
          }

          // Debounce intermediate updates (150ms) to batch rapid Firestore writes
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            setCarousels(latestCarouselsRef.current);
            setFeedStatus(latestStatusRef.current);
          }, 150);
        },
        (err) => {
          console.error('Firestore snapshot error:', err);
          setFeedStatus('error');
          setError('Lost connection to feed updates.');
        }
      );

      // 3. Fire the function (don't await — onSnapshot handles progress)
      getCarouselFeed({
        recipient_gender: gender,
        recipient_age: age,
        recipient_relationship: relationship,
        freeform_text: freeform,
        selected_chips: Array.from(selectedChips),
        session_id: sessionId,
      }).catch((err: any) => {
        console.error('Error calling getCarouselFeed:', err);
        setFeedStatus('error');
        setError(err.message || 'Failed to start recommendation feed.');
      });
    } catch (err: any) {
      console.error('Error during auth:', err);
      setFeedStatus('error');
      setError('Authentication failed. Please try again.');
    }
  };

  const isSubmitting = feedStatus === 'processing' || feedStatus === 'finalizing';
  const carouselEntries: CarouselEntry[] = carouselOrder.length > 0
    ? carouselOrder
        .filter((key) => key in carousels)
        .map((key) => [key, carousels[key]] as CarouselEntry)
    : Object.entries(carousels);

  return (
    <div className="carousel-feed-page">
      <h2 className="mb-4">Gift Recommendations</h2>

      <RecipientForm
        gender={gender}
        age={age}
        relationship={relationship}
        freeform={freeform}
        onGenderChange={setGender}
        onAgeChange={setAge}
        onRelationshipChange={setRelationship}
        onFreeformChange={setFreeform}
      />

      {age !== '' && (
        <div className="mb-4">
          <h6 className="mb-2">Interests</h6>
          <ChipSelector
            age={age}
            selectedChips={selectedChips}
            onToggleChip={handleToggleChip}
          />
        </div>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={isSubmitting || !gender || age === '' || !relationship || selectedChips.size === 0}
        className="mb-4"
      >
        {isSubmitting ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            {feedStatus === 'finalizing' && leaderStatus ? leaderStatus : 'Getting Recommendations...'}
          </>
        ) : (
          'Get Recommendations'
        )}
      </Button>

      {carouselEntries.map(([key, carousel]) => (
        <CarouselRow
          key={key}
          carouselId={key}
          displayName={carousel.display_name}
          status={
            carousel.status === 'complete'
              ? 'complete'
              : carousel.status === 'error'
                ? 'error'
                : carousel.status === 'curating'
                  ? 'curating'
                  : carousel.status === 'searching'
                    ? 'searching'
                    : 'loading'
          }
          products={carousel.products || []}
          productCount={carousel.product_count}
          targetCount={carousel.target_count}
        />
      ))}

      {feedStatus === 'processing' && carouselEntries.length === 0 && (
        <div className="text-center py-4">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Loading recommendations...</p>
        </div>
      )}

      {feedStatus === 'finalizing' && carouselEntries.length > 0 && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" />
          <span className="ms-2 text-muted">{leaderStatus || 'Polishing your feed...'}</span>
        </div>
      )}

      {feedStatus === 'complete' && carouselEntries.length === 0 && (
        <p className="text-muted text-center py-4">
          No recommendations found. Try adjusting your selections.
        </p>
      )}
    </div>
  );
};

export default CarouselFeedPage;
