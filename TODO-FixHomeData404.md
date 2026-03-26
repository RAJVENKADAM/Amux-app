# Fix Home Data 404 Error

## Steps:
- [x] 1. Mount missing /api/feed routes in backend/src/server.js
- [x] 2. Restart backend server (Ctrl+C then npm start in backend/)
- [ ] 3. Test endpoints:
  - `curl http://localhost:5000/api/users/courses`
  - `curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/users/me/paid-courses`
- [ ] 4. Reload mobile app and check HomeScreen
- [ ] 5. If still 404, check auth token, DB courses collection, server logs

