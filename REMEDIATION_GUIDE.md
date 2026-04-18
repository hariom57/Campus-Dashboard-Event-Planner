# 🔐 IITR Campus Dashboard - Security Remediation Guide

**Severity Level:** 🔴 CRITICAL - Deployment should be blocked until fixes are completed

---

## Quick Reference: Vulnerability Severity Breakdown

```
CRITICAL (3):   ████████████ Authentication bypass, SQL injection, No rate limiting
HIGH (8):       ████████ Missing validations, XSS, CORS, secrets, logging
MEDIUM (6):     ████ Headers, JWT expiration, authorization checks
LOW (5):        ██ HTTPS, dependencies
```

---

## 🚨 CRITICAL ISSUE #1: JWT Not Verified in `userLoggedIn` Middleware

### Current Vulnerable Code
📍 **File:** `temp_backend/middlewares/userAuth.js` (lines 5-22)

```javascript
const userLoggedIn = (req, res, next) => {
    try {
        const token = req.cookies.auth_token;
        
        // ❌ ONLY CHECKS IF TOKEN EXISTS, DOESN'T VERIFY!
        if (!token) {
            return res.status(401).json({
                error: 'No authentication token found'
            });
        }
        
        // ❌ CALLS next() WITHOUT VERIFICATION - ANYONE WITH auth_token COOKIE PASSES!
        next();
    } catch (error) {
        console.error('Auth error:', error);
        // error handling...
    }
};
```

### Attack Scenario
```bash
# Attacker creates fake token
curl -b "auth_token=fake" http://backend/protected-endpoint
# Result: 200 OK - BYPASSED AUTHENTICATION! 🔓

# Even easier - just set any value
curl -b "auth_token=ANYTHING" http://backend/user
# Returns user data without valid token!
```

### ✅ FIXED CODE
```javascript
const jwt = require('jsonwebtoken');

const userLoggedIn = (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({
                error: 'No authentication token found',
                message: 'Please login to continue'
            });
        }

        // ✅ VERIFY TOKEN SIGNATURE AND EXPIRATION
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;  // ✅ Attach verified user to request
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    message: 'Your session has expired. Please login again'
                });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid token',
                    message: 'Authentication failed'
                });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({
            error: 'Authentication error'
        });
    }
};

module.exports = { userLoggedIn, userData };
```

### Implementation Steps
1. Open `temp_backend/middlewares/userAuth.js`
2. Replace the `userLoggedIn` function with the fixed code above
3. Test:
   ```bash
   # Should fail with expired/invalid token
   curl -b "auth_token=invalid" http://localhost:8081/user
   # Expected: 401 Unauthorized
   ```

### Test Case
```javascript
// Test that fake tokens are rejected
test('should reject invalid token', async () => {
    const res = await request(app)
        .get('/user')
        .set('Cookie', 'auth_token=invalid');
    
    expect(res.status).toBe(401);
});

test('should reject expired token', async () => {
    const expiredToken = jwt.sign({user_id: 1}, 'secret', {expiresIn: '-1h'});
    const res = await request(app)
        .get('/user')
        .set('Cookie', `auth_token=${expiredToken}`);
    
    expect(res.status).toBe(401);
});
```

---

## 🚨 CRITICAL ISSUE #2: SQL Injection via `sequelize.literal()`

### Vulnerable Code Locations
📍 **File:** `temp_backend/routes/event.js` (4 locations)
- Line 507-514: Not preferred clubs
- Line 584-590: Preferred categories  
- Line 641-647: Not preferred categories
- Line 696-702: Additional usage

### Example Vulnerable Code
```javascript
// ❌ VULNERABLE - String interpolation in SQL
router.get('/clubs/not-preferred', userData, async (req, res) => {
    try {
        const [count, events] = await Promise.all([
            Event.findAll({
                where: {
                    club_id: {
                        [Op.in]: sequelize.literal(
                            // ❌ USER_ID DIRECTLY INTERPOLATED INTO SQL
                            `(SELECT club_id FROM user_not_preferred_club WHERE user_id = ${req.user.user_id})`
                        )
                    }
                }
            })
        ]);
    } catch (error) { ... }
});

// Attack: If jwt verification fails (see issue #1), attacker can forge user_id
// Forged JWT with: user_id = "1 OR 1=1)"
// Results in: WHERE user_id = 1 OR 1=1) -- bypasses WHERE clause!
```

### ✅ FIXED CODE (Recommended Approach)
```javascript
// ✅ SOLUTION: Refactor with proper Sequelize subqueries
router.get('/clubs/not-preferred', userData, async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);

        // ✅ Use Sequelize.Op with proper parameterization
        const { rows: events, count } = await Event.findAndCountAll({
            attributes: standardFlatAttributes,
            include: [
                {
                    model: Club,
                    required: true,
                    attributes: [],
                    include: [{
                        model: UserNotPreferredClub,
                        where: { user_id: req.user.user_id },  // ✅ Parameterized!
                        attributes: [],
                        required: true
                    }]
                },
                {
                    model: Location,
                    attributes: [],
                    required: false
                }
            ],
            where: {
                tentative_start_time: {
                    [Op.gte]: new Date()
                }
            },
            order: [['tentative_start_time', 'DESC']],
            limit,
            offset,
            raw: true,
            subQuery: false,
            distinct: true,
            col: 'Event.id'
        });

        res.json({
            events,
            ...buildPaginationMeta(count, page, limit)
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch events'
        });
    }
});
```

### All Locations to Fix

**Location 1: Not Preferred Clubs (Line 507)**
```javascript
// ❌ BEFORE
club_id: {
    [Op.in]: sequelize.literal(
        `(SELECT club_id FROM user_not_preferred_club WHERE user_id = ${req.user.user_id})`
    )
}

// ✅ AFTER - Use JOIN instead
// (See refactored code above)
```

**Location 2: Preferred Categories (Line 584)**
```javascript
// ❌ BEFORE  
id: {
    [Op.in]: sequelize.literal(
        `(SELECT DISTINCT event_id FROM event_category_alloted WHERE event_category_id IN (SELECT event_category_id FROM user_preferred_category WHERE user_id = ${req.user.user_id}))`
    )
}

// ✅ AFTER
include: [{
    model: EventCategory,
    through: {
        model: EventCategoryAlloted,
        attributes: []
    },
    include: [{
        model: UserPreferredCategory,
        where: { user_id: req.user.user_id },
        attributes: [],
        required: true
    }]
}]
```

### Implementation Steps
1. Back up current `event.js`
2. Replace all `sequelize.literal()` calls with proper Sequelize includes/joins
3. Test with different user_ids
4. Run SQL injection tests

---

## 🚨 CRITICAL ISSUE #3: No Rate Limiting

### Current Vulnerability
📍 **File:** `temp_backend/app.js` (Line 67-80)

```javascript
// ❌ ALL ROUTES EXPOSED TO DOS/BRUTE FORCE
app.use('/oauth', require('./routes/auth.js'));
app.use('/events', require('./routes/event.js'));
app.use('/user', require('./routes/user.js'));
// ... no rate limiting!
```

### Attack Scenarios
```bash
# Brute force login
for i in {1..10000}; do
  curl -X GET "http://backend/oauth/login" 
done

# Extract all events
curl "http://backend/events/all?page=1&limit=999999"

# Denial of Service
for i in {1..1000}; do
  ab -n 10000 -c 100 http://backend/events/all &
done
```

### ✅ FIXED CODE

**Step 1: Install dependency**
```bash
cd temp_backend
npm install express-rate-limit
```

**Step 2: Update `app.js`**
```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');  // ✅ ADD THIS
const { sequelize } = require('./database/schemas');
const initializeSchema = require('./database/initializeSchema.js');

const app = express();
const PORT = process.env.PORT || 8081;

// ... CORS setup ...

// ✅ CONFIGURE RATE LIMITERS
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // 5 requests per window
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,  // Return info in `RateLimit-*` headers
    legacyHeaders: false,   // Disable `X-RateLimit-*` headers
    skip: (req) => process.env.NODE_ENV === 'development',  // Skip in dev
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minute
    max: 100,  // 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
});

const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 20,  // 20 requests per hour for sensitive operations
    standardHeaders: true,
    legacyHeaders: false,
});

// ✅ APPLY RATE LIMITERS
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ PROTECT SENSITIVE ROUTES
app.use('/oauth/login', authLimiter);
app.use('/oauth/token', authLimiter);

// ✅ PROTECT GENERAL ROUTES
app.use('/events', generalLimiter);
app.use('/user', generalLimiter);
app.use('/todos', generalLimiter);
app.use('/reminders', generalLimiter);

// ✅ STRICT LIMITING FOR ADMIN ROUTES
app.use('/admins', strictLimiter);
app.use('/club-admins', strictLimiter);
app.use('/admin-permissions', strictLimiter);

// Rest of routes...
app.use('/oauth', require('./routes/auth.js'));
app.use('/events', require('./routes/event.js'));
// ... etc
```

### Testing
```bash
# Should be rate limited after 5 tries
for i in {1..10}; do
  echo "Request $i"
  curl -X GET "http://localhost:8081/oauth/login"
  sleep 1
done

# After 5 requests, you should see:
# 429 Too Many Requests
```

---

## 🟠 HIGH PRIORITY: Add Input Validation with Zod

### Install Zod
```bash
npm install zod
```

### Example: Validate Todo Creation

**📍 File:** `temp_backend/routes/todo.js`

```javascript
// ✅ ADD AT TOP OF FILE
const { z } = require('zod');

// ✅ DEFINE VALIDATION SCHEMA
const CreateTodoSchema = z.object({
    text: z.string()
        .min(1, 'Todo text is required')
        .max(500, 'Todo text must be less than 500 characters'),
    notes: z.string()
        .max(2000, 'Notes must be less than 2000 characters')
        .nullable()
        .optional(),
    due_date: z.string()
        .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date format')
        .nullable()
        .optional(),
    due_time: z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format HH:mm')
        .nullable()
        .optional(),
    linked_event_id: z.number().positive().nullable().optional(),
    linked_event_name: z.string().max(255).nullable().optional(),
    linked_event_club: z.string().max(255).nullable().optional(),
    linked_event_date: z.string().nullable().optional(),
});

// ✅ USE IN ROUTE
router.post('/', userData, async (req, res) => {
    try {
        // ✅ VALIDATE INPUT
        const validated = CreateTodoSchema.parse(req.body);
        
        const userId = req.user.user_id;

        const todo = await UserTodo.create({
            user_id: userId,
            text: validated.text.trim(),
            notes: validated.notes || null,
            due_date: validated.due_date || null,
            due_time: validated.due_time || null,
            linked_event_id: validated.linked_event_id || null,
            linked_event_name: validated.linked_event_name || null,
            linked_event_club: validated.linked_event_club || null,
            linked_event_date: validated.linked_event_date || null,
            completed: false,
        });

        res.status(201).json({ todo: todo.toJSON() });
    } catch (error) {
        // ✅ HANDLE VALIDATION ERRORS
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        
        console.error('Error creating todo:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
```

---

## 🟠 HIGH PRIORITY: Add Security Headers with Helmet

### Install Helmet
```bash
npm install helmet
```

### Update `app.js`
```javascript
const helmet = require('helmet');

// ✅ ADD AFTER CORS SETUP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],  // Consider removing unsafe-inline
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.googleapis.com"],
            connectSrc: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
        },
        reportUri: "/csp-report",  // Optional: log CSP violations
    },
    hsts: {
        maxAge: 31536000,  // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'deny'  // Prevent clickjacking
    },
    noSniff: true,  // X-Content-Type-Options
    xssFilter: true,  // X-XSS-Protection
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    },
    permissionsPolicy: {
        geolocation: [],
        microphone: [],
        camera: [],
        payment: [],
    }
}));
```

---

## 🟢 Quick Fix Checklist

### Before Going to Production

**Authentication & Authorization**
- [ ] Fix JWT verification in userLoggedIn
- [ ] Remove debug logging from middleware
- [ ] Validate JWT_SECRET at startup
- [ ] Implement short JWT expiration (1h) + refresh tokens
- [ ] Fix SameSite cookie to 'strict'

**Database Security**
- [ ] Replace all sequelize.literal() with proper joins
- [ ] Audit all database queries for SQL injection
- [ ] Enable parameterized queries

**API Security**
- [ ] Add rate limiting to all endpoints
- [ ] Add input validation schemas (Zod)
- [ ] Add CSRF protection (csurf)
- [ ] Fix CORS to whitelist only known origins
- [ ] Add security headers (Helmet)

**Frontend Security**
- [ ] Install isomorphic-dompurify
- [ ] Sanitize all user-provided HTML
- [ ] Never store tokens in localStorage
- [ ] Add CSP headers

**Error Handling**
- [ ] Sanitize error messages (never leak database errors)
- [ ] Log detailed errors server-side only
- [ ] Return generic errors to client

**Dependencies**
- [ ] Run npm audit
- [ ] Fix vulnerabilities with npm audit fix
- [ ] Update to latest secure versions

---

## Testing Your Fixes

### Manual Security Tests
```bash
# Test 1: Invalid JWT should be rejected
curl -b "auth_token=invalid" http://localhost:8081/user
# Expected: 401 Unauthorized

# Test 2: Rate limiting
for i in {1..10}; do curl http://localhost:8081/oauth/login; done
# After 5: Should get 429 Too Many Requests

# Test 3: Invalid input validation
curl -X POST http://localhost:8081/todos \
  -H "Content-Type: application/json" \
  -d '{"text": ""}'
# Expected: 400 Bad Request

# Test 4: XSS protection
curl -X POST http://localhost:8081/todos \
  -H "Content-Type: application/json" \
  -d '{"text": "<script>alert(1)</script>"}'
# Expected: Text sanitized or rejected
```

### Automated Testing
```bash
# Run security audit
npm audit

# Run static analysis
npm install -D eslint-plugin-security
npx eslint . --plugin security

# Install dependency checker
npm install -g snyk
snyk test
```

---

## Timeline & Ownership

**Immediate (24 hours):**
- [ ] Fix JWT verification - CRITICAL
- [ ] Add rate limiting - CRITICAL
- [ ] Fix SQL injection patterns - CRITICAL

**This Week:**
- [ ] Add input validation with Zod
- [ ] Add security headers with Helmet
- [ ] Fix CORS whitelist
- [ ] Remove debug logging
- [ ] Validate secrets at startup

**Before Production:**
- [ ] Complete all remaining fixes
- [ ] Run full security audit
- [ ] Perform penetration testing
- [ ] Code review by security specialist

---

**Questions?** Each fix above includes:
✅ Location in codebase  
✅ Vulnerability explanation  
✅ Correct fixed code  
✅ Testing instructions  
✅ Implementation steps
