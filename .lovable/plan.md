
# Quest Builder Cleanup and Duration Steps

## Overview
Six targeted changes to the quest builder and quest detail modal to remove redundancies, align UI consistency, and replace the free-text duration notes with a structured step-based approach.

---

## 1. Replace "Duration Notes" with Structured Steps (TimingStep)

Replace the free-text `duration_notes` field with a dynamic step builder where creators define quest phases (e.g., "Icebreaker," "Main Activity," "Wrap-up"), each with a slider for duration in minutes.

**Data model change:**
- Add a new column `duration_steps` (JSONB, nullable) to the `quests` table to store an array like:
  ```json
  [
    { "label": "Icebreaker", "minutes": 15 },
    { "label": "Main Activity", "minutes": 60 },
    { "label": "Wrap-up", "minutes": 15 }
  ]
  ```
- Keep `duration_notes` for backward compatibility but stop rendering it in the builder for new quests.

**UI:**
- Starts with 1 step pre-filled ("Step 1", 30 min).
- "Add Step" button (max 8 steps).
- Each step has a text input for the label and a slider (5-180 min, step 5).
- Remove button per step (min 1 step).
- Total duration auto-calculated and displayed at the bottom.

**Form data type update:**
- Add `duration_steps: Array<{ label: string; minutes: number }>` to `QuestFormData`.
- Default: `[{ label: '', minutes: 30 }]`.

**Quest detail modal:**
- Display these steps in the detail modal so users can see the quest timeline breakdown.

---

## 2. Align "What to Bring" AI Suggester (ExpectationsStep)

Currently the `AIFieldSuggester` for "What to Bring" sits below the textarea (left-aligned), while "Dress Code" and "Physical Requirements" have theirs in a `justify-between` row on the right.

**Fix:** Wrap the "What to Bring" helper text and AI suggester in the same `flex items-center justify-between` layout used by the other fields.

---

## 3. Remove Duplicate Age Restriction (SafetyStep)

The "Age Restriction" select in SafetyStep duplicates what is already captured in ConstraintsStep (`constraints_age_requirement`). 

**Fix:** Remove the entire Age Restriction section from SafetyStep. The `age_restriction` field in `QuestFormData` becomes unused by the builder (keep it in the type for backward compat but stop rendering it).

---

## 4. Remove Emergency Contact Section (SafetyStep)

Per the plan, emergency help will be handled via a help button in the squad lobby, not a static field.

**Fix:** Remove the "Emergency Contact Info" section from SafetyStep entirely.

---

## 5. Remove "Cost to Participants" from CapacityStep

Cost is already captured in the Constraints step as `constraints_budget_level` (Free / Low / Medium / High / Mixed).

**Fix:** Remove the `cost_description` input from CapacityStep. The field remains in the data type but is no longer prompted during creation.

---

## 6. Hide "Quest Objectives" and "How You'll Know You Succeeded" from QuestModal

These are internal creator/admin fields and should not be shown to participants in the quest detail view.

**Fix:** Remove the two sections (lines ~454-478) from `QuestModal.tsx` that render `quest.objectives` and `quest.successCriteria`.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/...` | Add `duration_steps JSONB` column to `quests` |
| `src/components/quest-builder/types.ts` | Add `duration_steps` field to `QuestFormData` and defaults |
| `src/components/quest-builder/steps/TimingStep.tsx` | Replace duration notes textarea with step builder UI |
| `src/components/quest-builder/steps/ExpectationsStep.tsx` | Fix AI suggester alignment for "What to Bring" |
| `src/components/quest-builder/steps/SafetyStep.tsx` | Remove Age Restriction and Emergency Contact sections |
| `src/components/quest-builder/steps/CapacityStep.tsx` | Remove Cost to Participants section |
| `src/components/QuestModal.tsx` | Remove objectives and success criteria sections |
| Quest submission logic (wherever `duration_notes` is persisted) | Also persist `duration_steps` to the new column |

---

## Technical Notes

- The `duration_steps` JSONB column avoids needing a separate table for a simple ordered list.
- Existing quests with only `duration_notes` will still display correctly since we are not removing the column.
- The step builder uses the existing `Slider` and `Input` components already in the project.
- No new dependencies required.
