# Spec Planner - Implementation Prompt

Study @specs/README.md and @PLAN.md

Work on the current phase (the first phase with status "🔄 In Progress" or "⬜ Not Started").

1. Find the first unchecked task (`- [ ]`) in that phase
2. Read any referenced spec files before implementing
3. Implement the task and write tests to verify it works
4. Mark the task complete (`- [x]`) in PLAN.md
5. Repeat until all tasks AND verification items in the phase are checked

When a phase is complete:
1. Change its status to "✅ Complete"
2. Change the next phase's status to "🔄 In Progress"
3. IMPORTANT: Commit changes with a message describing what was completed

## Rules

- **Never skip ahead** to a later phase
- **All verification items must pass** before marking a phase complete
- **If new work is discovered**, add it to the appropriate phase in PLAN.md
- **Read the relevant spec** before implementing any task
- **Write tests** for new functionality
- **Commit frequently** after completing tasks (if git is initialized)
