# Spec Planner - Implementation Prompt

Study @specs/README.md and ISSUES.md

Work on the current issue (the first issue with status "🔄 In Progress" or "⬜ Not Started"). If none is marked as "🔄 In Progress" then determine what the most important or most logical issue is to start on.

1. Find the first unchecked task (`- [ ]`) in that issue
2. Read any referenced spec files before implementing
3. Implement the task and write tests to verify it works
4. Mark the task complete (`- [x]`) in ISSUES.md

When a issue is complete:
1. Change its status to "✅ Complete"
2. Change the next issue's status to "🔄 In Progress"
3. IMPORTANT: Commit changes with a message describing what was completed

## Rules

- **All verification items must pass** before marking a issue complete
- **If new work is discovered**, add it to the appropriate issue in PLAN.md
- **If a new issue is discovered**, add it to the appropriate issue in ISSUES.md
- **Read the relevant spec** before implementing any task
- **Write tests** for new functionality
- **Commit frequently** after completing tasks (if git is initialized)
