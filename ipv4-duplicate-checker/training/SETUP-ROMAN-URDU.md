# Complete Setup & Training — IPv4 Duplicate Checker
## Roman Urdu Training Manual

Is guide ko order mein follow karein. Project mein do alag deployments hain:
1. Cloudflare Worker + Cloudflare D1 (backend/database)
2. Vercel (frontend website)

---

## Part 1 — ZIP extract aur GitHub repository

### Step 1: ZIP extract karein
- Download ki hui ZIP ko apne computer par extract karein.
- Folder ka naam `ipv4-duplicate-checker` rehne dein.
- Is folder ke andar `frontend`, `worker`, `training`, `README.md` aur `.gitignore` honge.

### Step 2: GitHub par repository banayein
1. https://github.com par login karein.
2. Top-right `+` par click karein, phir `New repository`.
3. Repository name: `ipv4-duplicate-checker`
4. Visibility apni marzi se Public ya Private rakhein. Private recommended hai.
5. `Add a README` ko select na karein, kyun ke project mein README pehle se hai.
6. `Create repository` par click karein.

### Step 3: Project GitHub par upload karein — easy method
1. Apni new repository open karein.
2. `Add file` > `Upload files` par click karein.
3. Extracted project folder ke ANDAR ki tamam files/folders select karke upload area mein drag karein.
   - `frontend` folder upload hona chahiye.
   - `worker` folder upload hona chahiye.
   - `training` folder upload hona chahiye.
   - Root `README.md` aur `.gitignore` bhi upload hon.
   - ZIP file ko repository mein upload karna zaroori nahi.
4. Neeche `Commit changes` par click karein.
5. GitHub repository mein folder structure check karein. `frontend` aur `worker` root level par nazar aane chahiye.

---

## Part 2 — Fresh Cloudflare D1 database banana

### Step 4: Cloudflare Dashboard open karein
1. https://dash.cloudflare.com par login karein.
2. Left menu mein `Storage & databases` open karein.
3. `D1 SQL Database` / `D1` select karein. Dashboard ke labels waqt ke saath change ho sakte hain.
4. `Create database` par click karein.
5. Database name bilkul ye rakhein: `ipv4-duplicate-checker-db`
6. Create database kar dein.

Ye naya/empty database hoga. Purane database ko select na karein.

### Step 5: Database table create karein
1. Naye database ko open karein.
2. `Console` ya `SQL Console` tab open karein.
3. GitHub project se file open karein:
   `worker/migrations/0001_create_ip_records.sql`
4. Is file ka poora SQL copy karke D1 SQL Console mein paste karein.
5. `Run` click karein.

SQL ye table banata hai:
- `id`: auto-increment ID
- `ip_address`: IPv4 address; UNIQUE constraint
- `created_at`: record create hone ka UTC timestamp

**Important:** `UNIQUE` constraint duplicate protection ki asal database-level guarantee hai. Sirf website ke duplicate check par depend nahi kiya gaya.

---

## Part 3 — Cloudflare Worker setup

### Step 6: Worker create karein
1. Cloudflare Dashboard mein `Workers & Pages` open karein.
2. `Create` / `Create application` > `Worker` select karein.
3. Worker name: `ipv4-duplicate-checker-api`
4. Worker create/deploy karein.

### Step 7: Worker code publish karein
Recommended method Wrangler CLI hai. Iske liye computer par Node.js install hona chahiye.

1. Node.js LTS install karein: https://nodejs.org
2. Windows Terminal / PowerShell open karein.
3. Project ke `worker` folder mein jayein:
   `cd path\to\ipv4-duplicate-checker\worker`
4. Wrangler install/run karein:
   `npx wrangler login`
5. Browser khulega; Cloudflare account authorize karein.
6. `wrangler.toml` open karein.
7. `database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"` ko apne D1 database ke actual ID se replace karein.
   - D1 database details page par database ID milti hai.
   - Database name aur ID ko mix na karein.
8. File save karein.
9. Deploy command run karein:
   `npx wrangler deploy`

Deploy ke baad Worker URL milega, misal:
`https://ipv4-duplicate-checker-api.YOUR-SUBDOMAIN.workers.dev`

Apna actual URL copy karein.

### Step 8: Worker test karein
Browser mein ye URL open karein:
`https://YOUR-WORKER-URL/api/health`

Expected response:
`{"success":true,"message":"IPv4 API is running"}`

Agar 404 aaye to URL mein `/api/health` aur Worker deployment check karein. Agar database error aaye to D1 binding/database ID check karein.

---

## Part 4 — Vercel frontend connect karna

### Step 9: Worker URL frontend mein set karein
1. GitHub repository mein `frontend/config.js` open karein.
2. Is line ko dhoondein:
   `API_BASE_URL: "https://REPLACE-WITH-YOUR-WORKER-URL"`
3. Is value ko apne actual Worker URL se replace karein. `/api` end mein add na karein.
   Example:
   `API_BASE_URL: "https://ipv4-duplicate-checker-api.example.workers.dev"`
4. Save/Commit changes karein.

### Step 10: Vercel par GitHub repository import karein
1. https://vercel.com par login karein.
2. `Add New` > `Project` par click karein.
3. GitHub account connect karein, agar pehle connected nahi.
4. `ipv4-duplicate-checker` repository ke saamne `Import` click karein.
5. Project settings mein:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. `Deploy` click karein.
7. Deployment complete hone par Vercel URL open karein.

Note: Vercel ka Root Directory `frontend` rakhna zaroori hai, kyun ke website files us folder mein hain.

---

## Part 5 — CORS ko production ke liye restrict karna

Initial testing ke liye Worker config mein `ALLOWED_ORIGIN = "*"` hai.

Production mein:
1. `worker/wrangler.toml` open karein.
2. `ALLOWED_ORIGIN = "*"` ko apne exact Vercel origin se replace karein, example:
   `ALLOWED_ORIGIN = "https://your-project.vercel.app"`
3. Agar custom domain use karte hain to uska exact origin set karein, example `https://ip.example.com`.
4. Worker folder se dobara deploy karein:
   `npx wrangler deploy`

CORS browser-based cross-origin access ko control karta hai; ye authentication ya security lock nahi hai.

---

## Part 6 — Training: system kaise use karna hai

### Single IP upload
1. Website open karein.
2. IP address box mein `8.8.8.8` paste karein.
3. `Upload IPs` click karein.
4. Agar IP new hai to uploaded count 1 hoga.
5. Wohi IP dobara upload karein; duplicate count 1 hoga aur woh dobara save nahi hogi.

### Multiple IP upload
Text box mein har IP alag line par paste karein:

`8.8.8.8`
`1.1.1.1`
`9.9.9.9`

`Upload IPs` click karein. System maximum 500 entries per request process karta hai. Comma, semicolon, spaces aur new lines separators ke taur par supported hain.

### Expected results
- `Uploaded`: valid new IPs jo database mein save hui.
- `Duplicates`: woh IPv4 addresses jo pehle se database mein hain, ya same batch mein pehle hi insert ho chuki hain.
- `Invalid`: IPv4 format ke mutabiq invalid entries.

Examples:
- `8.8.8.8` — valid IPv4 format
- `192.168.1.25` — valid IPv4 format (private range bhi format ke lihaz se accepted)
- `256.1.1.1` — invalid; octet 255 se bara hai
- `8.8.8` — invalid; 4 octets nahi
- `2001:4860:4860::8888` — invalid; IPv6 hai

Note: System sirf IPv4 format validate karta hai. Ye check nahi karta ke IP public, reachable, USA-based, ya kisi particular ISP ki hai.

### Records aur search
- `Saved IP records` mein database ke saved records nazar aate hain.
- Search box mein IP ka hissa type karke `Search` click karein.
- `Refresh` se records aur total count reload honge.
- Pagination mein Previous/Next se pages change karein.

---

## Part 7 — Troubleshooting

### Error: Worker URL is not configured
`frontend/config.js` mein actual Worker URL set nahi hua. GitHub par file update/commit karein; Vercel redeploy karein.

### Error: Failed to fetch / Network error
- Worker URL browser mein `/api/health` ke saath test karein.
- URL mein extra `/api` na lagayein.
- Worker deploy hua hai ya nahi check karein.
- CORS origin setting check karein.

### Error: Server error / database error
- `worker/wrangler.toml` mein D1 `database_id` sahi hai?
- Binding ka naam `DB` hai?
- D1 database par SQL migration run hui?
- Table `ip_records` bani hui hai?
- Cloudflare Worker logs check karein.

### Website khulti hai lekin records load nahi hote
Worker ka `/api/ips` aur `/api/stats` endpoint test karein. Worker URL aur D1 binding verify karein.

### Upload par invalid aa raha hai
IPv4 mein 4 numeric parts hone chahiye, har part 0–255 ke darmiyan. IPv6 supported nahi.

---

## Part 8 — Important operational/security notes

- D1 database ka backup/export regular basis par rakhein.
- Worker code ya frontend mein D1 credentials/API tokens paste na karein.
- Public app mein authentication nahi hai. Production mein login/API authorization aur rate limiting add karein.
- CORS alone unauthorized uploads ko nahi rokta.
- IP address personal/network data ho sakta hai; access ko limited rakhein aur apni data-retention policy define karein.
- D1 SQL table ka `UNIQUE` constraint remove na karein.
- Database reset karne se records permanently delete ho sakte hain. Production data par DROP/TRUNCATE commands bina backup ke na chalayein.

---

## Final deployment checklist

- [ ] GitHub repository mein project files upload hain.
- [ ] Fresh D1 database create ho gaya.
- [ ] SQL migration successfully run hui.
- [ ] `wrangler.toml` mein correct database ID hai.
- [ ] Worker deploy ho gaya.
- [ ] `/api/health` successful response deta hai.
- [ ] `frontend/config.js` mein Worker URL set hai.
- [ ] Vercel Root Directory `frontend` hai.
- [ ] Vercel website successfully deploy ho gayi.
- [ ] New IPv4 upload karke test ki.
- [ ] Same IPv4 dobara upload karke duplicate rejection test ki.
