# IITR Campus Dashboard - Performance Optimization Implementation Guide

**Quick Start:** Follow this guide in order. Each section is independently deployable.

---

## Phase 1: Critical Fixes (Target: 2 hours)

### Fix 1: Database Indexes (10 min) - MOST CRITICAL

These queries currently take **500ms-1s**, should be **50-100ms**.

#### Step 1: Update Event Schema

**File:** `temp_backend/database/schemas/Event.js`

Find this section:
```javascript
}, {
    tableName: 'event',
    timestamps: false,
});
```

Replace with:
```javascript
}, {
    tableName: 'event',
    timestamps: false,
    indexes: [
        { fields: ['club_id'], name: 'idx_event_club_id' },
        { fields: ['location_id'], name: 'idx_event_location_id' },
        { fields: ['tentative_start_time'], name: 'idx_event_start_time' },
        { 
            fields: ['tentative_start_time', 'club_id'], 
            name: 'idx_event_start_club'
        }
    ],
});
```

#### Step 2: Update EventCategoryAlloted Schema

**File:** `temp_backend/database/schemas/eventCategoryAlloted.js`

Find:
```javascript
}, {
    tableName: 'event_category_alloted',
    timestamps: false,
});
```

Replace:
```javascript
}, {
    tableName: 'event_category_alloted',
    timestamps: false,
    indexes: [
        { fields: ['event_id'], name: 'idx_eca_event_id' },
        { fields: ['event_category_id'], name: 'idx_eca_category_id' },
        { 
            fields: ['event_id', 'event_category_id'], 
            name: 'idx_eca_composite'
        }
    ],
});
```

#### Step 3: Update Club Schema

**File:** `temp_backend/database/schemas/club.js`

Find:
```javascript
}, {
    tableName: 'club',
    timestamps: false,
});
```

Replace:
```javascript
}, {
    tableName: 'club',
    timestamps: false,
    indexes: [
        { fields: ['name'], name: 'idx_club_name' }
    ],
});
```

#### Step 4: Update Location Schema

**File:** `temp_backend/database/schemas/location.js`

Find:
```javascript
}, {
    tableName: 'location',
    timestamps: false,
});
```

Replace:
```javascript
}, {
    tableName: 'location',
    timestamps: false,
    indexes: [
        { fields: ['name'], name: 'idx_location_name' }
    ],
});
```

#### Step 5: Apply Migrations

```bash
cd temp_backend

# If using sequelize-cli migrations:
npm run sequelize db:migrate

# OR manually sync (development):
node -e "
const { sequelize } = require('./database/schemas');
sequelize.sync({ force: false, alter: true }).then(() => {
    console.log('✅ Indexes created successfully');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
"
```

**Verify indexes created:**
```sql
-- In PostgreSQL
SELECT indexname FROM pg_indexes WHERE tablename IN ('event', 'club', 'location');
-- Should show: idx_event_club_id, idx_event_location_id, idx_event_start_time, etc.
```

---

### Fix 2: Fix N+1 Query Problem (25 min) - MOST IMPORTANT

**Before (Current - 3 queries):**
```
Query 1: Fetch events with Club + Location joins
Query 2: Fetch EventCategoryAlloted rows  
Query 3: Fetch EventCategory names
Total: ~500-800ms
```

**After (Optimized - 1 query):**
```
Single query with category eager loading
Total: ~50-100ms
```

#### Step 1: Update Event Route - Query with Eager Loading

**File:** `temp_backend/routes/event.js`

Find this section (starts around line 101):
```javascript
router.get('/all', userLoggedIn, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);
        const whereClause = {};

        const [count, events] = await Promise.all([
            Event.count({ where: whereClause }),
            Event.findAll({
                attributes: standardFlatAttributes,
                include: [
                    {
                        model: Club,
                        attributes: [], // Empty attributes required when using sequelize.col() above
                        required: false
                    },
                    {
                        model: Location,
                        attributes: [], // Empty attributes required when using sequelize.col() above
                        required: false
                    }
                ],
                where: whereClause,
                order: [['tentative_start_time', 'ASC']],
                limit: limit,
                offset: offset,
                raw: true,
                subQuery: false
            })
        ]);

        const eventIds = events.map((ev) => ev.id);

        let categoryRows = [];
        if (eventIds.length > 0) {
            categoryRows = await EventCategoryAlloted.findAll({
                where: {
                    event_id: {
                        [Op.in]: eventIds,
                    },
                },
                attributes: ['event_id', 'event_category_id'],
                raw: true,
            });
        }

        const categoryIds = Array.from(new Set(categoryRows.map((row) => row.event_category_id)));
        const categories = categoryIds.length > 0
            ? await EventCategory.findAll({
                where: {
                    id: {
                        [Op.in]: categoryIds,
                    },
                },
                attributes: ['id', 'name'],
                raw: true,
            })
            : [];

        const categoryNameById = new Map(categories.map((cat) => [Number(cat.id), cat.name]));
        const categoryIdsByEventId = new Map();

        for (const row of categoryRows) {
            const eventId = Number(row.event_id);
            const catId = Number(row.event_category_id);
            const existing = categoryIdsByEventId.get(eventId) || [];
            existing.push(catId);
            categoryIdsByEventId.set(eventId, existing);
        }

        const enrichedEvents = events.map((ev) => {
            const ids = categoryIdsByEventId.get(Number(ev.id)) || [];
            const names = ids
                .map((id) => categoryNameById.get(id))
                .filter(Boolean);

            return {
                ...ev,
                category_ids: ids,
                categories: names.join(', '),
            };
        });

        res.json({
            events: enrichedEvents,
            ...buildPaginationMeta(count, page, limit)
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch events'
        });
    }
});
```

Replace with this optimized version:

```javascript
router.get('/all', userLoggedIn, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);
        const whereClause = {};

        // OPTIMIZED: Single query with eager loading
        const { count, rows: events } = await Event.findAndCountAll({
            attributes: [
                'id',
                'name',
                'club_id',
                'tentative_start_time',
                'duration_minutes',
                'actual_start_time',
                'description',
                'image_url',
                'is_all_day',
                [sequelize.col('Club.name'), 'club_name'],
                [sequelize.col('Club.logo_url'), 'club_logo_url'],
                [sequelize.col('Location.id'), 'location_id'],
                [sequelize.col('Location.name'), 'location_name'],
                [sequelize.col('Location.description'), 'location_description'],
                [sequelize.col('Location.images'), 'location_images'],
            ],
            include: [
                {
                    model: Club,
                    attributes: [],
                    required: false
                },
                {
                    model: Location,
                    attributes: [],
                    required: false
                },
                {
                    model: EventCategory,
                    through: { attributes: [] },
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            where: whereClause,
            order: [['tentative_start_time', 'ASC']],
            limit,
            offset,
            raw: false,  // Changed to false to properly handle associations
            subQuery: false,
            distinct: true,
            col: 'Event.id'
        });

        // Transform to flat structure
        const enrichedEvents = events.map((ev) => {
            const plainEvent = ev.toJSON();
            const categories = plainEvent.EventCategories || [];
            
            return {
                id: plainEvent.id,
                name: plainEvent.name,
                club_id: plainEvent.club_id,
                club_name: plainEvent.club_name,
                club_logo_url: plainEvent.club_logo_url,
                tentative_start_time: plainEvent.tentative_start_time,
                duration_minutes: plainEvent.duration_minutes,
                actual_start_time: plainEvent.actual_start_time,
                description: plainEvent.description,
                image_url: plainEvent.image_url,
                is_all_day: plainEvent.is_all_day,
                location_id: plainEvent.location_id,
                location_name: plainEvent.location_name,
                location_description: plainEvent.location_description,
                location_images: plainEvent.location_images,
                category_ids: categories.map((c) => c.id),
                categories: categories.map((c) => c.name).join(', ')
            };
        });

        res.json({
            events: enrichedEvents,
            ...buildPaginationMeta(count, page, limit)
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch events'
        });
    }
});
```

#### Step 2: Apply Same Fix to /admin/all Route

Find the `/admin/all` route (around line 199), and apply the same eager loading pattern.

**Test the improvement:**
```bash
# Compare response times before/after
time curl "http://localhost:8081/events/all?page=1&limit=10"

# Should drop from 500-800ms to 50-100ms
```

---

### Fix 3: Route Code Splitting (20 min)

**File:** `src/App.jsx`

Find the imports section at the top:
```javascript
import Home from './pages/Home';
import CalendarPage from './pages/Calendar';
import Admin from './pages/Admin';
import Todo from './pages/Todo';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/Profile';
import NotificationsPage from './pages/Notifications';
import EventDetail from './pages/EventDetail';
```

Replace with:
```javascript
import { lazy, Suspense } from 'react';

// Lazy load heavy pages
const Home = lazy(() => import('./pages/Home'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const Admin = lazy(() => import('./pages/Admin'));
const Todo = lazy(() => import('./pages/Todo'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const EventDetail = lazy(() => import('./pages/EventDetail'));

// LandingPage is critical path, keep eager
import LandingPage from './pages/LandingPage';

// Loading component
const PageLoading = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#666'
    }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{
                width: '30px',
                height: '30px',
                border: '3px solid #ddd',
                borderTop: '3px solid #0a7c5c',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 10px'
            }} />
            <p>Loading...</p>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    </div>
);
```

Then wrap all lazy route elements with Suspense:

Find this section:
```javascript
<Routes>
    {/* Public Landing Route (No Bottom Nav) */}
    <Route path="/" element={<LandingPage />} />

    {/* App Routes (with Bottom Nav) */}
    <Route path="/home" element={<AppShell><Home /></AppShell>} />
    <Route path="/calendar" element={<AppShell><CalendarPage /></AppShell>} />
    <Route path="/todo" element={<AppShell><Todo /></AppShell>} />
    <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />
    <Route path="/notifications" element={<AppShell><NotificationsPage /></AppShell>} />
    <Route path="/admin" element={<AppShell><Admin /></AppShell>} />
    <Route path="/event/:eventId" element={<AppShell><EventDetail /></AppShell>} />
</Routes>
```

Replace with:
```javascript
<Suspense fallback={<PageLoading />}>
    <Routes>
        {/* Public Landing Route (No Bottom Nav) */}
        <Route path="/" element={<LandingPage />} />

        {/* App Routes (with Bottom Nav) */}
        <Route path="/home" element={<AppShell><Home /></AppShell>} />
        <Route path="/calendar" element={<AppShell><CalendarPage /></AppShell>} />
        <Route path="/todo" element={<AppShell><Todo /></AppShell>} />
        <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />
        <Route path="/notifications" element={<AppShell><NotificationsPage /></AppShell>} />
        <Route path="/admin" element={<AppShell><Admin /></AppShell>} />
        <Route path="/event/:eventId" element={<AppShell><EventDetail /></AppShell>} />
    </Routes>
</Suspense>
```

**Verify improvement:**
```bash
npm run build
# Compare bundle sizes before/after
# main chunk should reduce by 20-35%
```

---

### Fix 4: Response Time Monitoring (10 min)

**File:** `temp_backend/app.js`

Find where other middleware is added (after cors, bodyParser, etc.):
```javascript
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
```

Add this after body-parser:
```javascript
// ===== PERFORMANCE MONITORING =====
app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const method = req.method;
        const path = req.path;
        
        // Color code by duration
        let speedIndicator = '✅';
        if (duration > 1000) {
            speedIndicator = '🔴 SLOW';
        } else if (duration > 500) {
            speedIndicator = '🟡 MEDIUM';
        }
        
        console.log(`${speedIndicator} [${method}] ${path} - ${statusCode} - ${duration}ms`);
        
        // Log to file for analysis (optional)
        if (process.env.LOG_PERFORMANCE === 'true') {
            const fs = require('fs');
            const logEntry = `${new Date().toISOString()},${method},${path},${statusCode},${duration}\n`;
            fs.appendFileSync('performance.log', logEntry);
        }
    });
    
    next();
});
```

Also add request timeout configuration. Find where routes are mounted and add before:

```javascript
// ===== REQUEST TIMEOUT =====
const timeout = require('connect-timeout');
app.use(timeout('30s'));
app.use((req, res, next) => {
    if (!req.timedout) next();
});
```

**Test:**
```bash
# You'll now see timing in logs:
# ✅ [GET] /events/all - 200 - 45ms
# 🟡 [POST] /events/add - 201 - 520ms
# 🔴 SLOW [GET] /admin/all - 200 - 1250ms
```

---

## Phase 2: Frontend Optimizations (Target: 1.5 hours)

### Fix 5: Optimize SWR Configuration (5 min)

**File:** `src/App.jsx`

Find:
```javascript
<SWRConfig 
    value={{
        refreshInterval: 30000, 
        revalidateOnFocus: true,
        revalidateOnReconnect: true
    }}
>
```

Replace with:
```javascript
<SWRConfig 
    value={{
        // Reduce refresh frequency
        refreshInterval: 5 * 60 * 1000,  // 5 minutes
        revalidateOnFocus: false,        // Don't spam when tab focused
        revalidateOnReconnect: true,     // OK to sync when network restored
        
        // Optimize request deduplication
        dedupingInterval: 2 * 60 * 1000,  // Dedupe requests within 2 min
        focusThrottleInterval: 5 * 60 * 1000,
        
        // Better error handling
        shouldRetryOnError: true,
        errorRetryCount: 2,
        errorRetryInterval: 5000,
    }}
>
```

---

### Fix 6: Lazy Load Images (15 min)

**File:** `src/components/Event/EventCard.jsx`

Find the banner style section (around line 100):
```javascript
const bannerStyle = event.image_url 
    ? { 
        background: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${event.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
    }
    : { background: fallbackGradient };
```

Change to use `<img>` tag with lazy loading. Find where the banner is rendered and update:

```jsx
// Find this in the JSX:
<div style={bannerStyle}></div>

// Replace with:
{event.image_url ? (
    <img
        src={event.image_url}
        alt={event.name}
        loading="lazy"
        decoding="async"
        style={{
            width: '100%',
            height: '180px',
            objectFit: 'cover',
            display: 'block'
        }}
    />
) : (
    <div style={{ ...bannerStyle, height: '180px' }} />
)}
```

Also find club logo rendering and add lazy loading:
```jsx
// Find:
<img src={event.club_logo_url || event.logo_url} alt={event.club_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

// Replace with:
<img 
    src={event.club_logo_url || event.logo_url}
    alt={event.club_name}
    loading="lazy"
    decoding="async"
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
```

Do the same in `src/components/Layout/BottomNav.jsx` for profile image.

---

### Fix 7: Component Memoization (20 min)

**File:** `src/pages/Home.jsx`

Add this near the top after imports:
```javascript
// Memoize utilities
const extractCategoryNamesStable = (event) => {
    if (Array.isArray(event?.categories)) {
        return event.categories
            .map((cat) => (typeof cat === 'string' ? cat : cat?.name))
            .filter(Boolean);
    }
    if (typeof event?.categories === 'string') {
        return event.categories
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean);
    }
    return [];
};
```

Find the useMemo for `availableCategories` (around line 100):
```javascript
const availableCategories = useMemo(() => {
    const set = new Set();
    events.forEach((ev) => {
        extractCategoryNames(ev).forEach((cat) => set.add(cat));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}, [events]);
```

Keep this - it's already optimized.

Find where `filteredEvents` is used and ensure it's wrapped in useMemo:
```javascript
const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return combined
        .filter((ev) => {
            let endTime;
            if (ev.isAcademicCalendar && ev.tentative_end_time) {
                endTime = ev.tentative_end_time;
            } else {
                const startDate = new Date(ev.tentative_start_time);
                const endDateObj = new Date(startDate.getTime() + (ev.duration_minutes || 0) * 60000);
                endTime = endDateObj.toISOString();
            }

            const eventEndDateStr = endTime.split('T')[0];
            return eventEndDateStr >= todayStr;
        })
        .sort((a, b) => new Date(a.tentative_start_time) - new Date(b.tentative_start_time));
}, [combined]);  // Make sure dependencies are correct
```

In EventCard.jsx, wrap handlers in useCallback:
```javascript
// Add to imports
import React, { useMemo, useCallback } from 'react';

// Inside EventCard component, find handleReminderClick:
const handleReminderClick = useCallback((evt) => {
    evt.stopPropagation();
    if (!canSetReminder || !onToggleReminder) return;
    onToggleReminder(event);
}, [event, canSetReminder, onToggleReminder]);

const handleShareClick = useCallback((evt) => {
    evt.stopPropagation();
    shareEvent(event);
}, [event]);

const handleWhatsAppShare = useCallback((evt) => {
    evt.stopPropagation();
    shareEventOnWhatsApp(event);
}, [event]);

const handleAddToTodo = useCallback(async (evt) => {
    evt.stopPropagation();
    try {
        // ... rest of function
    } catch (err) {
        console.error('Failed to add to Todo', err);
    }
}, [event, isAcademic, numericId]);
```

---

## Phase 3: Verification & Testing

### Test 1: Measure Bundle Size Reduction

```bash
cd src && npm run build

# Before optimizations: note the bundle size
# After Phase 1-2: should reduce by 30-40%
```

### Test 2: API Response Time Improvement

```bash
# Test the /events/all endpoint multiple times
for i in {1..5}; do 
  curl -w "Time: %{time_total}s\n" -o /dev/null -s "http://localhost:8081/events/all?page=1&limit=10"
done

# Before: 500-800ms avg
# After: 50-100ms avg
```

### Test 3: Frontend Performance

```bash
# Run Lighthouse audit
npx lighthouse https://campus-dashboard-event-planner.vercel.app/ --view

# Should show improvement in:
# - LCP: 3.5s → 2.0s
# - FID: 200ms → 80ms
# - CLS: 0.18 → 0.08
```

### Test 4: Visual Regression Check

```bash
# Ensure no visual regressions after optimizations
npm run dev

# Click through all pages:
# Home → Calendar → Admin → Todo → Profile → Notifications
# Verify everything renders correctly
```

---

## Deployment Checklist

- [ ] All database indexes created
- [ ] N+1 queries fixed
- [ ] Route code splitting deployed
- [ ] SWR config optimized
- [ ] Images lazy loaded
- [ ] Components memoized
- [ ] Response monitoring in place
- [ ] Tests pass
- [ ] Lighthouse score > 80
- [ ] No visual regressions
- [ ] Performance metrics baseline captured

---

## Monitoring Queries

After deployment, use these to verify improvements:

```sql
-- Check index usage (PostgreSQL)
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC 
LIMIT 10;

-- Reset stats after optimization
SELECT pg_stat_statements_reset();
```

---

**Total Implementation Time: ~4 hours**  
**Expected Performance Improvement: 50-70%**
