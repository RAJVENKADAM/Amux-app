# My Lessons Tab (Creator Courses) Enhancement

**Status**: 📋 PLANNING - Ready to implement

## Plan Summary
**Goal**: Add 3-dot menu to myLessons courses: Edit/Delete/Share. Direct Playlist navigation.

**Files**:
1. **UserCourseCard.js**: Menu logic for creator courses
2. **ProfileScreen.js**: Pass props to myLessons FlatList
3. **api.js**: Add `courseAPI.deleteCourse(courseId)`
4. **UploadScreen.js**: Edit mode (receive course prop, UPDATE button, populate form)

## Step-by-Step

### 1. Update api.js
```
courseAPI.deleteCourse = (courseId) => api.delete(`/users/courses/${courseId}`);
```

### 2. Update ProfileScreen.js (myLessons)
```
<FlatList data={myCourses} renderItem={({ item }) => (
  <UserCourseCard 
    course={item}
    isCreator={true}
    userId={user._id}
    onCoursePress={() => navigation.navigate('CoursePlaylistScreen', { courseId: item._id })}
    onDelete={handleDeleteCourse}
    onEdit={handleEditCourse}
  />
)} />
```
Add `handleDeleteCourse(courseId)` optimistic remove from myCourses.

### 3. Update UserCourseCard.js
- Receive `isCreator` prop
- Menu: Edit Course (onEdit(course)), Delete (confirm → API → onDelete), Share
- Different logic for creator vs saved

### 4. Update UploadScreen.js
- Receive `course` prop from navigation
- If course exists: populate form, change "Create Course" → "Update Course"
- On submit: PUT `/users/courses/${course._id}` if editing

### 5. Backend (if needed)
- PUT `/users/courses/:id` update
- DELETE `/users/courses/:id`

**Next**: Add deleteCourse to api.js
