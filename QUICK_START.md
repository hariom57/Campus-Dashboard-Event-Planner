# 🚀 Quick Start: Verify Fixes & Deploy

## 5-Minute Verification

Run these commands to verify everything works:

```bash
# 1. Check backend syntax
cd temp_backend && node -c app.js
# Expected: No errors

# 2. List what was installed
npm list express-rate-limit joi
# Expected: Both packages listed

# 3. Go back to project root
cd ..

# 4. Check frontend still builds
npm run build
# Expected: "Built in Xs" with no errors
```

---

## 30-Minute Full Test

### Terminal 1: Backend
```bash
cd temp_backend
npm start
# Should show: "Listening to port 8081"
```

### Terminal 2: Frontend
```bash
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Browser: Test flows
1. Navigate to http://localhost:5173
2. Try login - should see JWT in cookies
3. View events - should load without errors
4. Try to set reminder - should work now (even for all-day events)
5. Check DevTools → Network → Response Headers:
   - Look for `X-Frame-Options: DENY` ✓
   - Look for `X-Content-Type-Options: nosniff` ✓

### Rate Limiting Test
```bash
# In another terminal, spam a GET endpoint
for i in {1..150}; do curl -s http://localhost:8081/api/health; done
# After 100 hits, should get: "Too Many Requests"
```

---

## Environment Setup

### Create `.env` files

**temp_backend/.env**
```
JWT_SECRET=your-super-secret-key-must-be-at-least-32-characters-long
DATABASE_URL=postgresql://user:password@localhost:5432/campus_dashboard
PORT=8081
FRONTEND_URL=http://localhost:3000
```

**Frontend .env** (if needed)
```
VITE_API_URL=http://localhost:8081
```

---

## Docker Build

### Option 1: Single Docker Compose
```bash
# Assumes PostgreSQL is running
docker-compose up --build
```

### Option 2: Manual Builds

**Backend:**
```bash
cd temp_backend
docker build -t campus-backend:latest .
docker run -e JWT_SECRET=... -e DATABASE_URL=... -p 8081:8081 campus-backend
```

**Frontend:**
```bash
docker build -t campus-frontend:latest .
docker run -p 3000:80 campus-frontend
```

---

## Issues & Fixes Reference

### ✅ Fixed Issues Quick Reference

| Issue | File | What Was Done |
|-------|------|---------------|
| Auth bypass | `userAuth.js` | Added jwt.verify() |
| SQL injection | `event.js` | Replaced string interpolation with Op.in |
| Missing state | `Profile.jsx` | Added errorMessage state |
| Memory leak | `AuthContext.jsx` | Added isMounted guard |
| Observer bug | `Home.jsx` | Removed dependency causing recreation |
| Reminder logic | `EventDetail.jsx` | Removed isAllDay check |
| Rate limiting | `app.js` | Added express-rate-limit middleware |
| Security headers | `app.js` | Added DENY headers |

### Common Issues After Deployment

**"Cannot set headers after they are sent"**
- Likely: An endpoint has multiple response.send() calls
- Fix: Review error handling in routes

**"JWT malformed"**
- Likely: JWT_SECRET changed or not set
- Fix: Ensure JWT_SECRET is consistent

**"Connect to database failed"**
- Likely: DATABASE_URL incorrect or DB down
- Fix: Test connection string with `psql`

**"Too many open connections"**
- Likely: Connection pool exhausted
- Fix: Reduce pool size or add cleanup handlers

---

## Monitoring Checklist

After deployment, monitor these:

- [ ] Error logs - no JWT errors
- [ ] API response times - < 500ms avg
- [ ] Database connections - < 20 active
- [ ] Memory usage - stable over 24h
- [ ] Rate limiting - catching abuse
- [ ] Security headers - present on all responses
- [ ] HTTPS - enforced in production
- [ ] Database backups - running daily

---

## Support Resources

**In Your Project:**
- `DEPLOYMENT_READY.md` - Full deployment guide
- `SECURITY_AUDIT_REPORT.md` - All vulnerabilities + fixes
- `PERFORMANCE_AUDIT.md` - Optimization roadmap
- `FIXES_APPLIED.md` - What changed

**For More Help:**
- Database issues: Review `temp_backend/database/` folder
- Auth issues: Check `temp_backend/middlewares/userAuth.js`
- API issues: Check `temp_backend/routes/` folder
- Frontend issues: Check `src/` folder

---

**Ready? Let's go!** 🚀
