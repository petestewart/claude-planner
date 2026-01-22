# Spec Planner - QA Test Prompt

Study @specs/README.md and docs/qa/spec-planner/TEST_PLAN.md

Work on the next (the first phase with status "🔄 In Progress" or "⬜ Not Started").

1. Find the first unchecked test (`- [ ]`) in that phase
2. Read any referenced spec files before implementing
3. Perform the test to verify the expected outcome
4. If there are prerequisites that are not ready, it is YOUR job to implement these. If there are environment-related issues that require effort to set up conditions for the test, you must perform the necessary work to set up the test conditions. Skipping tests because extra work is required to set up the tests is NOT allowed.
4. Mark the test complete (`- [x]`) in docs/qa/spec-planner/TEST_PLAN.md and indicate the outcome

When a test passes:
1. Change its status to "✅ PASSED"
2. Change the next phase's status to "🔄 In Progress"

When a test failed:
1. Change its status to "❌ FAILED"
2. Write a synopsis of what the behavior is and how it deviates from the expected result.
3. Change the next phase's status to "🔄 In Progress"

## Rules

- **Never skip ahead** to a later test
- **All verification items must pass** before marking a phase as PASSED
- **If new work is discovered**, add it to the appropriate phase in PLAN.md
