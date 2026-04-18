# IITR Campus Dashboard - Performance Optimization Checklist

## 🚀 Quick Summary

**Current State:** 42/100 Performance Score  
**Target State:** 85/100+ (Industry Standard)  
**Effort:** 4-6 hours of development  
**Expected Gains:** 50-70% faster load times

---

## Phase 1: Critical Path (Do First - 2 hours)

### ✅ Database Optimization

- [ ] Add indexes to `Event` table
  - [ ] `idx_event_club_id` on `club_id`
  - [ ] `idx_event_location_id` on `location_id`
  - [ ] `idx_event_start_time` on `tentative_start_time`
  - [ ] Composite: `club_id + tentative_start_time`
  
- [ ] Add indexes to `EventCategoryAlloted` table
  - [ ] `idx_eca_event_id` on `event_id`
  - [ ] `idx_eca_category_id` on `event_category_id`
  - [ ] Composite: `event_id + event_category_id`

- [ ] Add indexes to `Club` and `Location`

- [ ] Run migrations: `npm run sequelize db:migrate`

**Impact:** 🚀 10-50x faster database queries

---

### ✅ Backend Query Fixes

- [ ] Fix `/events/all` endpoint - Replace 3 queries with 1
  - Remove separate `EventCategoryAlloted` fetch
  - Remove separate `EventCategory` fetch
  - Use eager loading: `.include([{ model: EventCategory, ... }])`

- [ ] Apply same fix to `/events/admin/all` endpoint

- [ ] Test endpoint response time: Should drop from 500ms → 50ms

**Impact:** 🚀 10x faster API responses

---

### ✅ Frontend Bundle Optimization

- [ ] Convert route imports to lazy loading
  - [ ] `Admin` → `lazy(() => import('./pages/Admin'))`
  - [ ] `Calendar` → `lazy(() => import('./pages/Calendar'))`
  - [ ] `Todo` → `lazy(() => import('./pages/Todo'))`
  - [ ] `Profile` → `lazy(() => import('./pages/Profile'))`
  - [ ] `Notifications` → `lazy(() => import('./pages/Notifications'))`
  - [ ] `EventDetail` → `lazy(() => import('./pages/EventDetail'))`

- [ ] Add Suspense boundary around lazy routes

- [ ] Create `PageLoading` fallback component

- [ ] Test build: `npm run build`

**Impact:** 🚀 30-40% smaller initial bundle

---

### ✅ Backend Monitoring

- [ ] Add response time middleware
  - [ ] Log `${method} ${path} - ${duration}ms`
  - [ ] Flag queries > 1000ms as SLOW
  
- [ ] Add request timeout handling (30s)

**Impact:** 👁️ Visibility into slow endpoints

---

## Phase 2: Frontend Polish (Do Second - 1.5 hours)

### ✅ API Caching

- [ ] Update SWR config in `App.jsx`
  - [ ] `refreshInterval` → 5 minutes (from 30s)
  - [ ] `revalidateOnFocus` → `false`
  - [ ] `dedupingInterval` → 2 minutes
  - [ ] `errorRetryCount` → 2

**Impact:** 🚀 30% less API traffic

---

### ✅ Image Optimization

- [ ] Add lazy loading to EventCard banner
  - [ ] `loading="lazy"` attribute
  - [ ] `decoding="async"` attribute

- [ ] Add lazy loading to club logos in EventCard

- [ ] Add lazy loading to profile images in BottomNav

**Impact:** 🚀 20-30% faster initial page load

---

### ✅ Component Rendering

- [ ] Verify `useMemo` on filtered events list (Home.jsx)
- [ ] Verify `useMemo` on available categories
- [ ] Add `useCallback` to event handlers in EventCard
  - [ ] `handleReminderClick`
  - [ ] `handleShareClick`
  - [ ] `handleWhatsAppShare`
  - [ ] `handleAddToTodo`

**Impact:** 🚀 20-40% faster re-renders

---

## Phase 3: Advanced (Optional - 2 hours)

### ⭐ Virtualization (for 100+ events)

- [ ] Install `react-window`
- [ ] Implement `FixedSizeList` in event feed
- [ ] Test: Should render 100+ events smoothly

**Impact:** 🚀 5-10x rendering speed for large lists

---

### ⭐ PWA Enhancements

- [ ] Update workbox cache strategies
- [ ] Add stale-while-revalidate for events
- [ ] Increase cache entries: 100 → 500
- [ ] Increase cache age: 1h → 7 days

**Impact:** 👁️ Better offline support

---

### ⭐ Image CDN (Optional)

- [ ] Implement image optimization utility
- [ ] Add `srcset` to images
- [ ] Add responsive image sizing

**Impact:** 🚀 50-70% smaller image payloads

---

## 🧪 Testing Checklist

### Before Deployment

- [ ] Run all tests: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Bundle size reduced by 25%+
  
### Performance Verification

- [ ] API response time: `/events/all` < 100ms
- [ ] Lighthouse score: > 85
- [ ] LCP: < 2.5s
- [ ] FID/INP: < 100ms
- [ ] CLS: < 0.1

### Functional Testing

- [ ] Home page loads and displays events
- [ ] Calendar page filters events correctly
- [ ] Admin panel creates/edits events
- [ ] Todo list works
- [ ] Lazy loading working (check Network tab)
- [ ] PWA still installable
- [ ] Images display correctly

---

## 📊 Measurement Commands

### Before Optimization

```bash
# 1. Bundle size
npm run build && du -sh dist/

# 2. API response time
curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  "http://localhost:8081/events/all?page=1&limit=10"

# 3. Lighthouse score
npx lighthouse https://campus-dashboard-event-planner.vercel.app/ --view
```

### After Optimization

```bash
# Compare metrics from above
# Expected improvements:
# - Bundle: 30-40% smaller
# - API: 10x faster (500ms → 50ms)
# - Lighthouse: 60+ → 85+
```

---

## 📋 File Changes Summary

| File | Change | Status |
|------|--------|--------|
| `temp_backend/database/schemas/Event.js` | Add indexes | ⏳ |
| `temp_backend/database/schemas/EventCategoryAlloted.js` | Add indexes | ⏳ |
| `temp_backend/routes/event.js` | Fix N+1 queries | ⏳ |
| `temp_backend/app.js` | Add monitoring | ⏳ |
| `src/App.jsx` | Code splitting + SWR config | ⏳ |
| `src/pages/Home.jsx` | Verify memoization | ⏳ |
| `src/components/Event/EventCard.jsx` | Lazy load images + useCallback | ⏳ |
| `src/components/Layout/BottomNav.jsx` | Lazy load images | ⏳ |

---

## 🎯 Phase-Based Timeline

```
Week 1:
  Monday:   Database indexes (1h)
  Tuesday:  Query optimization (2h)
  Wednesday: Bundle splitting (1.5h)
  Thursday: Testing & verification (2h)
  
Week 2:
  Monday:   Lazy loading (1h)
  Tuesday:  Component optimization (1h)
  Wednesday: Advanced features (optional, 2h)
  Thursday: Final testing & deployment
```

---

## ⚠️ Common Pitfalls

- [ ] ❌ Don't forget to run migrations after schema changes
- [ ] ❌ Don't lazy load LandingPage (critical path)
- [ ] ❌ Don't increase SWR refreshInterval beyond 10 min (users need updates)
- [ ] ❌ Don't remove error handling when optimizing
- [ ] ❌ Don't skip testing before deploying

---

## 📞 Support

If stuck on any optimization:

1. Check [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) for detailed analysis
2. Check [OPTIMIZATION_GUIDE.md](OPTIMIZATION_GUIDE.md) for implementation code
3. Run performance monitoring and compare metrics

---

## ✅ Sign-Off

- [ ] All Phase 1 items complete
- [ ] All tests passing
- [ ] Performance metrics baseline captured
- [ ] Ready for deployment

**Estimated Time:** 4-6 hours  
**Expected Improvement:** 50-70% faster  
**Difficulty:** Medium (mostly copy-paste from guides)
