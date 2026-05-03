import React from 'react';
import { SpellSlotState } from '../../types';
import styles from './SpellSlotTracker.module.css';

const ORDINALS: Record<number, string> = {
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th',
  6: '6th', 7: '7th', 8: '8th', 9: '9th',
};

interface Props {
  slots: SpellSlotState[];
  isPactCaster?: boolean;
  onToggleSlot?: (slot: SpellSlotState, newUsed: number) => void;
}

const SpellSlotTracker: React.FC<Props> = ({ slots, isPactCaster = false, onToggleSlot }) => {
  if (slots.length === 0) {
    return (
      <div className={styles.tracker}>
        <div className={styles.trackerTitle}>Spell Slots</div>
        <div className={styles.emptyState}>No spell slots tracked</div>
      </div>
    );
  }

  const handleToggle = (slot: SpellSlotState, index: number) => {
    if (!onToggleSlot) return;
    // index is 0-based from the left (first = slot 1); click to toggle
    const newUsed = index < slot.used ? index : index + 1;
    const clamped = Math.max(0, Math.min(slot.total, newUsed));
    onToggleSlot(slot, clamped);
  };

  return (
    <div className={styles.tracker}>
      <div className={styles.trackerTitle}>Spell Slots</div>
      {isPactCaster && (
        <div className={styles.pactNote}>Pact Magic — slots restore on short rest</div>
      )}
      {slots.map(slot => (
        <div key={slot.slot_level} className={styles.slotRow}>
          <span className={styles.slotLevel}>
            {ORDINALS[slot.slot_level] ?? `${slot.slot_level}th`} Level ({slot.used}/{slot.total})
          </span>
          <div className={styles.slots}>
            {Array.from({ length: slot.total }, (_, i) => (
              <button
                key={i}
                type="button"
                title={i < slot.used ? 'Click to restore' : 'Click to use'}
                onClick={() => handleToggle(slot, i)}
                className={`${styles.slot} ${i < slot.used ? styles.slotUsed : ''}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpellSlotTracker;
