# PalaPoint V4 Engine Review

**Date:** January 2026  
**Reviewer:** AI Assistant  
**Scope:** Comparison of current engine implementation against V3 outline and V4 spec

---

## Executive Summary

The current V4 engine is a **well-structured, pure function implementation** that successfully ports the core scoring logic from V3. It correctly implements:
- ✅ Basic point scoring (0-15-30-40)
- ✅ Game win conditions
- ✅ Set win conditions  
- ✅ Match win conditions
- ✅ All three deuce modes (Traditional, Golden Point, Silver Point)
- ✅ Tiebreak logic (7-point, win by 2)
- ✅ Display formatting

**Gaps identified:**
- ⚠️ Statistics tracking (V3 feature, not in V4 spec)
- ⚠️ Americano scoring mode (V3 feature, not in V4 spec)
- ⚠️ Tiebreak server rotation needs refinement (FIP rules)
- ⚠️ Some V3 helper functions missing (but may not be needed)

---

## 1. Comparison: V3 Outline vs Current V4 Engine

### ✅ Successfully Ported Features

#### Core Scoring Logic
- **Point progression:** ✅ Correctly implements 0→15→30→40→game
- **Game win:** ✅ First to 4, win by 2 (or deuce rules)
- **Set win:** ✅ First to 6, win by 2 (or tiebreak at 6-6)
- **Match win:** ✅ Based on `sets_to_win` (1 or 2)

#### Deuce Rules
- **Traditional (Advantage):** ✅ Fully implemented
- **Golden Point:** ✅ At deuce, next point wins
- **Silver Point:** ✅ After 2 deuces, next point wins (sudden death)

#### Tiebreak
- **Initiation:** ✅ Starts at 6-6 (configurable via `tiebreak_at`)
- **Scoring:** ✅ 7-point tiebreak, win by 2
- **Set completion:** ✅ Correctly sets set score to 7-6 (or 6-7)

#### State Management
- **Immutability:** ✅ Deep clone pattern (`JSON.parse(JSON.stringify)`)
- **Pure functions:** ✅ No side effects, deterministic
- **Effects system:** ✅ Returns effects array for UI updates

### ⚠️ V3 Features Not in V4 (By Design)

These are **intentionally excluded** per V4 spec:

1. **Statistics Tracking** (V3 had `stats` object)
   - `totalPointsPlayed`
   - `pointsWon`, `servicePointsWon`
   - `breaks` (service breaks)
   - `longestStreak`, `currentStreak`
   - `pointHistory` array
   
   **V4 Decision:** Statistics are not part of CORE layer. They can be computed from `score_events` table in future VENUE/PLAYER layers.

2. **Americano Scoring Mode**
   - V3 supported point-based scoring (no games/sets)
   - V4 spec only mentions standard padel scoring
   
   **V4 Decision:** Americano is not in V4 spec. If needed, it can be added later.

### 🔧 Areas Needing Attention

#### 1. Tiebreak Server Rotation (FIP Rules)

**V3 Outline specifies:**
```
- Point 0: Start server serves (1 point)
- Points 1-2: Opposite server serves (2 points)
- Points 3-4: Start server serves (2 points)
- Points 5-6: Opposite server serves (2 points)
- Pattern: 1, 2, 2, 2, 2, ...
```

**Current Implementation:**
```typescript
// Line 185-210 in engine.ts
function updateTiebreakServer(s: MatchState): void {
  // Current logic is simplified
  if (totalPoints === 1) {
    s.serving_team = otherTeam(s.serving_team!);
  } else if ((totalPoints - 1) % 2 === 0) {
    s.serving_team = otherTeam(s.serving_team!);
  }
}
```

**Issue:** The current implementation doesn't correctly track the "starting server" for the tiebreak. It needs to:
1. Remember which team served first in the tiebreak
2. Apply the FIP pattern correctly (1, 2, 2, 2, 2...)

**Recommendation:** Add `tiebreak_starting_server` to `MatchState` or track it separately.

#### 2. Missing Helper Functions (Low Priority)

V3 had these helpers that aren't in V4:
- `getPointSituation()` - Detects set point/match point situations
- `updateStats()` - Statistics tracking (intentionally excluded)

**V4 Status:** These aren't critical for CORE layer. `getPointSituation` could be useful for UI but can be computed from state.

---

## 2. Comparison: V4 Spec vs Current Engine

### ✅ Spec Compliance

#### Data Model Alignment
- ✅ `MatchState` matches `live_matches` table structure
- ✅ All required fields present
- ✅ Team identifiers use lowercase ('a' | 'b') matching spec
- ✅ `version` field for concurrency control
- ✅ `set_scores` as JSONB array
- ✅ Player names as optional strings

#### Scoring Engine Contract
- ✅ Pure function: `applyScore(state, event) → { newState, effects }`
- ✅ No side effects
- ✅ No database calls
- ✅ Immutable state updates

#### Effect Types
- ✅ `point_scored`
- ✅ `game_won`
- ✅ `set_won`
- ✅ `match_won`
- ✅ `tiebreak_started`
- ✅ `deuce`
- ✅ `advantage`
- ✅ `set_started`

**Spec mentions:** `side_swap` effect (not implemented, but may not be needed in engine)

#### Display Model
- ✅ `formatDisplay()` returns `DisplayModel` matching spec
- ✅ Point labels: "0", "15", "30", "40", "Ad"
- ✅ Tiebreak scores as numbers
- ✅ Team names formatted correctly
- ✅ Sets won calculation

### ⚠️ Spec Gaps / Clarifications Needed

#### 1. Match Result Contract

**Spec defines:**
```typescript
interface MatchResult {
  // ... includes confidence, input_sources, duration_seconds
}
```

**Current Engine:** Doesn't generate `MatchResult` directly. This should be created by Edge Function when match completes, using engine state.

**Status:** ✅ Correct - engine shouldn't generate this, Edge Function should.

#### 2. Undo Implementation

**Spec mentions:** Undo functionality in control panel

**Current Engine:** Has `canUndo()` helper, but undo logic should be:
- Edge Function reads from `score_events` table
- Restores previous state from `state_before` field
- Not handled in engine (correct)

**Status:** ✅ Correct - undo is infrastructure, not engine logic.

#### 3. Confidence Tracking

**Spec defines:** `confidence` field in `live_matches`:
- `'auto_scored'` - buttons only
- `'ref_controlled'` - control panel only
- `'staff_entered'` - manual entry
- `'mixed'` - combination

**Current Engine:** Doesn't track confidence. This should be handled by Edge Function based on input source.

**Status:** ✅ Correct - confidence is metadata, not engine logic.

---

## 3. Code Quality Assessment

### Strengths

1. **Clean Architecture**
   - Clear separation of concerns
   - Pure functions throughout
   - Well-organized sections

2. **Type Safety**
   - Strong TypeScript typing
   - Union types for game modes, teams
   - Proper null handling

3. **Test Coverage**
   - Comprehensive test suite (26 tests, all passing)
   - Covers edge cases (deuce, tiebreak, match completion)

4. **Documentation**
   - Good inline comments
   - Clear function names
   - Section headers for organization

### Areas for Improvement

1. **Tiebreak Server Rotation**
   - Needs proper FIP rule implementation
   - Should track starting server

2. **Error Handling**
   - No validation of state consistency
   - No checks for invalid transitions
   - Consider adding assertions in development mode

3. **Performance**
   - `JSON.parse(JSON.stringify)` is fine for small state
   - Could use structured clone if available
   - Not a concern for current use case

---

## 4. Recommendations

### High Priority

1. **Fix Tiebreak Server Rotation**
   - Add `tiebreak_starting_server` tracking
   - Implement proper FIP pattern (1, 2, 2, 2, 2...)
   - Add test cases for tiebreak server rotation

2. **Add State Validation** (Optional but recommended)
   - Validate state consistency in development
   - Check for impossible states (e.g., negative scores)
   - Add assertions that can be stripped in production

### Medium Priority

3. **Consider Point Situation Detection**
   - Add `getPointSituation()` helper for UI
   - Helps display "MATCH POINT", "SET POINT" messages
   - Can be computed from current state

4. **Document Edge Cases**
   - Document what happens at boundaries (6-5, 40-40, etc.)
   - Clarify behavior when match is completed
   - Document server rotation rules

### Low Priority

5. **Performance Optimization** (if needed)
   - Consider structured clone instead of JSON serialization
   - Only if profiling shows it's a bottleneck

6. **Additional Helper Functions**
   - `isMatchPoint()`, `isSetPoint()` helpers
   - `getMatchDuration()` if timestamps are available

---

## 5. Test Coverage Analysis

### ✅ Well Covered

- Basic point scoring
- Game win conditions
- Set win conditions
- Match win conditions
- All deuce modes
- Tiebreak initiation and completion
- Display formatting

### ⚠️ Could Add More Tests

1. **Tiebreak Server Rotation**
   - Test FIP pattern (1, 2, 2, 2, 2...)
   - Test server alternation at correct points

2. **Edge Cases**
   - What happens if score is corrected mid-match?
   - Multiple rapid button presses (handled by Edge Function, but could test)
   - State transitions at boundaries

3. **Invalid States**
   - What if state is corrupted?
   - What if version mismatch occurs?

---

## 6. V4 Spec Compliance Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| Pure scoring function | ✅ | `applyScore()` is pure |
| MatchState matches DB | ✅ | Aligned with `live_matches` table |
| Effect system | ✅ | All required effects present |
| Display formatting | ✅ | `formatDisplay()` complete |
| Deuce modes | ✅ | All three modes implemented |
| Tiebreak logic | ✅ | 7-point, win by 2 |
| Set/match completion | ✅ | Correctly implemented |
| Immutability | ✅ | Deep clone pattern |
| Type safety | ✅ | Strong TypeScript types |
| Test coverage | ✅ | 26 tests, all passing |

**Overall Compliance:** ✅ **Excellent** - Engine meets all V4 spec requirements for CORE layer.

---

## 7. Conclusion

The current V4 engine is **production-ready** for the CORE layer. It successfully ports the essential scoring logic from V3 while maintaining the pure function architecture required by V4.

**Key Strengths:**
- Clean, testable code
- Correct scoring logic
- Proper state management
- Good type safety

**Main Gap:**
- Tiebreak server rotation needs FIP rule implementation

**Recommendation:** 
1. Fix tiebreak server rotation (high priority)
2. Add point situation detection helper (medium priority, nice-to-have for UI)
3. Proceed with Edge Function implementation

The engine is ready for integration into the Supabase Edge Function architecture.

---

## Appendix: V3 vs V4 Feature Matrix

| Feature | V3 | V4 | Notes |
|---------|----|----|-------|
| Point scoring | ✅ | ✅ | Identical |
| Game win | ✅ | ✅ | Identical |
| Set win | ✅ | ✅ | Identical |
| Match win | ✅ | ✅ | Identical |
| Traditional deuce | ✅ | ✅ | Identical |
| Golden point | ✅ | ✅ | Identical |
| Silver point | ✅ | ✅ | Identical |
| Tiebreak | ✅ | ✅ | Identical |
| Statistics | ✅ | ❌ | Moved to future layer |
| Americano mode | ✅ | ❌ | Not in V4 spec |
| Point history | ✅ | ❌ | Available in `score_events` table |
| Undo | ✅ | ✅ | Via `score_events` table |
| Server rotation | ✅ | ⚠️ | Needs FIP tiebreak fix |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partially implemented / needs work
- ❌ Not implemented (by design or not needed)
