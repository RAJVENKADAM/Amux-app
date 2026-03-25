# Pin/Unpin Learnings Feature (ProfileScreen Learnings Tab)
Status: ✅ COMPLETE

## Steps:
- [✅] 1. Refactor ProfileScreen state & logic for pinned (max 3) / unpinned
- [✅] 2. Fix VirtualizedList warning (ScrollView + FlatList)
- [✅] 3. Update UserCourseCard menu: dynamic 'Pin'/'Unpin' text
- [✅] 4. Test pin/unpin, max limit, share, badges
- [✅] 5. Complete & cleanup TODO

**Changes:**
- ProfileScreen: pinnedLearnings/unpinnedLearnings states, togglePin() with max 3 limit, dynamic isPinned prop, nestedScrollEnabled
- UserCourseCard: getMenuButtons() now "Unpin Course" if isPinned else "Pin Course" + Share
- Three-dot shows pin/unpin + share options as requested.

**Test:** Profile > Learnings tab > 3-dot menu. ✅
