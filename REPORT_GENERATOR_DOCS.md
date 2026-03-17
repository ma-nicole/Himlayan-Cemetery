# Report Generator — Technical Documentation

## Overview

The Report Generator feature allows **admin** and **staff** users to generate, preview, and download/print PDF reports for **payments** and **feedback** data. It consists of three layers:

1. **Backend API** — Laravel controller that queries the database and returns filtered data with summary statistics.
2. **Frontend Page** — React component with filter controls, a live data preview table, and PDF generation buttons.
3. **PDF Generation** — Client-side PDF creation using jsPDF + jspdf-autotable, triggered by the Download/Print buttons.

---

## Architecture Diagram

```
User clicks "Generate Report"
        │
        ▼
┌──────────────────────┐       GET /api/reports/payments
│  ReportGeneratorPage │  ──────────────────────────────►  ┌────────────────────┐
│  (React Component)   │                                   │  ReportController  │
│                      │  ◄──────────────────────────────  │  (Laravel)         │
│  - Filter controls   │       JSON { data, summary }      │                    │
│  - Preview table     │                                   │  - payments()      │
│  - Summary stats     │                                   │  - feedbacks()     │
│                      │                                   │  - users()         │
│  User clicks         │                                   └────────────────────┘
│  "Download PDF"      │                                            │
│        │             │                                            ▼
│        ▼             │                                   ┌────────────────────┐
│  generatePDF()       │                                   │  MySQL Database    │
│  (jsPDF + autoTable) │                                   │  - payments table  │
│        │             │                                   │  - feedbacks table │
│        ▼             │                                   │  - users table     │
│  .pdf file saved     │                                   └────────────────────┘
└──────────────────────┘
```

---

## Files Involved

| File | Purpose |
|------|---------|
| `backend/app/Http/Controllers/Api/ReportController.php` | API endpoints for report data |
| `backend/routes/api.php` | Route definitions (under `/api/reports/*`) |
| `frontend/src/pages/ReportGeneratorPage.jsx` | Main React page component |
| `frontend/src/pages/ReportGeneratorPage.css` | Styling for the report page |
| `frontend/src/App.jsx` | Route `/admin/reports` registered here |
| `frontend/src/components/common/Sidebar.jsx` | "Reports" nav link added here |
| `frontend/src/pages/EnhancedDashboardPage.jsx` | "Generate Report" button in dashboard header |

---

## Backend — ReportController.php

**Location:** `backend/app/Http/Controllers/Api/ReportController.php`

### Route Registration

In `backend/routes/api.php`, the report routes are defined inside the authenticated route group with an additional role middleware:

```php
Route::prefix('reports')->middleware('role:admin,staff')->group(function () {
    Route::get('/payments', [ReportController::class, 'payments']);
    Route::get('/feedbacks', [ReportController::class, 'feedbacks']);
    Route::get('/users', [ReportController::class, 'users']);
});
```

- **`middleware('role:admin,staff')`** — Only users with the role `admin` or `staff` can access these endpoints. Regular members cannot.
- All three routes use `GET` since they are read-only data retrieval operations.

### Method: `payments(Request $request)`

**Endpoint:** `GET /api/reports/payments`

**What it does:**
1. Starts a query on the `Payment` model with eager-loaded relationships (`user` and `plot`) to avoid N+1 query problems.
2. Applies optional filters from query parameters:
   - `date_from` — filters `created_at >= date_from`
   - `date_to` — filters `created_at <= date_to`
   - `status` — filters by exact payment status (e.g., `pending`, `verified`, `rejected`)
   - `user_id` — filters by a specific member
3. Orders results by `created_at` descending (newest first).
4. Executes the query with `->get()` to retrieve all matching records.
5. Returns a JSON response containing:
   - `data` — array of payment records (each includes nested `user` and `plot` objects)
   - `summary` — computed statistics:
     - `total_count` — total number of records
     - `total_amount` — sum of all payment amounts
     - `pending_count` / `pending_amount` — count and sum of pending payments
     - `verified_count` / `verified_amount` — count and sum of verified payments
     - `rejected_count` / `rejected_amount` — count and sum of rejected payments

**Key detail:** The `with(['user:id,name,email'])` syntax uses Laravel's constrained eager loading — it only selects the `id`, `name`, and `email` columns from the `users` table, reducing data transfer.

### Method: `feedbacks(Request $request)`

**Endpoint:** `GET /api/reports/feedbacks`

Works identically to `payments()` but queries the `Feedback` model. Summary includes:
- `total_count` — total feedback records
- `new_count` — feedbacks with status `new`
- `read_count` — feedbacks with status `read`
- `responded_count` — feedbacks with status `responded`
- `average_rating` — average of non-null ratings, rounded to 1 decimal place

### Method: `users()`

**Endpoint:** `GET /api/reports/users`

Returns all users (id, name, email, role) ordered alphabetically. This is used to populate the "Member" filter dropdown on the frontend.

---

## Frontend — ReportGeneratorPage.jsx

**Location:** `frontend/src/pages/ReportGeneratorPage.jsx`

### Imports

```jsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
```

- **`jsPDF`** — Library for creating PDF documents in the browser (no server needed).
- **`autoTable`** — Plugin that adds table-drawing capability to jsPDF. Imported as a **named import** (not a side-effect import) because the side-effect import (`import 'jspdf-autotable'`) doesn't register the plugin properly in production builds.
- **`api`** — Pre-configured Axios instance that automatically attaches the auth token to every request.

### State Variables

```jsx
const [reportType, setReportType] = useState('payments');  // 'payments' or 'feedbacks'
const [dateFrom, setDateFrom] = useState('');               // Start date filter
const [dateTo, setDateTo] = useState('');                   // End date filter
const [status, setStatus] = useState('');                   // Status filter (payments only)
const [userId, setUserId] = useState('');                   // Member filter
const [users, setUsers] = useState([]);                     // All users for dropdown
const [reportData, setReportData] = useState(null);         // API response (data + summary)
const [loading, setLoading] = useState(false);              // Loading state
const [error, setError] = useState('');                     // Error message
```

### Data Flow

#### 1. On Page Load — Fetch Users for Dropdown

```jsx
useEffect(() => {
    api.get('/reports/users').then(res => {
        setUsers(res.data.data || []);
    }).catch(() => {});
}, []);
```

When the component mounts, it calls `GET /api/reports/users` to populate the "Member" filter dropdown. This runs once (`[]` dependency array).

#### 2. User Clicks "Generate Report" — `fetchReport()`

```jsx
const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    setReportData(null);
    try {
        const params = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (reportType === 'payments' && status) params.status = status;
        if (userId) params.user_id = userId;

        const res = await api.get(`/reports/${reportType}`, { params });
        setReportData(res.data);
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch report data.');
    } finally {
        setLoading(false);
    }
}, [reportType, dateFrom, dateTo, status, userId]);
```

**Step-by-step:**
1. Sets loading state and clears previous data/errors.
2. Builds a `params` object with only the non-empty filter values. Empty filters are simply omitted (the backend treats missing parameters as "no filter").
3. Calls `GET /api/reports/payments` or `GET /api/reports/feedbacks` depending on `reportType`.
4. Stores the full response (`{ data, summary }`) in `reportData`.
5. On error, extracts the error message from the API response.

The `useCallback` hook with the dependency array ensures this function is re-created only when the filter values change, preventing unnecessary re-renders.

#### 3. Preview Table Renders

Once `reportData` is set (not null), the preview section renders:
- **Summary stat cards** — Shows key metrics (total records, total amount/avg rating, etc.)
- **HTML table** — Displays all fetched records with columns appropriate to the report type
- **Action buttons** — "Download PDF" and "Print" appear

#### 4. User Clicks "Download PDF" or "Print" — `generatePDF(action)`

This is the core PDF generation function. The `action` parameter is either `'download'` or `'print'`.

### PDF Generation — Detailed Breakdown

#### Step 1: Create the PDF Document

```jsx
const doc = new jsPDF('landscape', 'mm', 'a4');
```

- **`'landscape'`** — Horizontal orientation (wider than tall) because tables have many columns.
- **`'mm'`** — All coordinates/sizes are in millimeters.
- **`'a4'`** — Standard A4 paper size (297mm × 210mm in landscape).

#### Step 2: Draw the Header

```jsx
doc.setFontSize(18);
doc.setFont('helvetica', 'bold');
doc.setTextColor(26, 71, 42);  // Dark green (matches system branding)
doc.text('Himlayan Cemetery Management System', pageWidth / 2, 18, { align: 'center' });
```

The header is centered on the page using `pageWidth / 2` as the x-coordinate with `align: 'center'`. It includes:
- System name (18pt, bold, dark green)
- Report title — "Payment Report" or "Feedback Report" (14pt)
- Generation timestamp (9pt, gray)
- Active filters description (9pt, gray) — built by `getFilterDescription()`
- A horizontal divider line at y=41mm

#### Step 3: Generate the Data Table

```jsx
autoTable(doc, {
    startY: 45,
    head: [['ID', 'Member', 'Type', 'Amount', 'Method', 'Status', 'Date']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 71, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 245] },
    margin: { left: 14, right: 14 },
});
```

**`autoTable(doc, options)`** — Called as a standalone function (named import), passing the `doc` as the first argument.

- **`startY: 45`** — Table starts 45mm from the top (below the header).
- **`head`** — Column headers (dark green background, white text).
- **`body`** — 2D array of row data, mapped from `reportData.data`.
- **`alternateRowStyles`** — Every other row gets a light gray background for readability.
- **`margin`** — 14mm padding on left and right edges.
- **Automatic page breaks** — If the table exceeds the page height, `autoTable` automatically creates new pages and continues the table.

**Data mapping for payments:**
```jsx
const tableData = (reportData.data || []).map(p => [
    p.id,
    p.user?.name || 'N/A',
    p.type?.replace(/_/g, ' ') || '',
    `PHP ${Number(p.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    (p.payment_method || 'N/A').toUpperCase(),
    (p.status || '').charAt(0).toUpperCase() + (p.status || '').slice(1),
    p.created_at ? new Date(p.created_at).toLocaleDateString('en-PH') : '',
]);
```

Each payment record is mapped to a flat array of strings. Amounts are formatted as `PHP 50,000.00`, methods are uppercased, statuses are capitalized, and dates use the Philippine locale format.

#### Step 4: Add Summary Section

```jsx
let summaryY = doc.lastAutoTable.finalY + 10;
const pageHeight = doc.internal.pageSize.getHeight();
if (summaryY + 25 > pageHeight - 15) {
    doc.addPage();
    summaryY = 20;
}
```

**Page overflow protection:** After the table ends, we check if there's enough remaining space on the current page (25mm for the summary content + 15mm bottom margin). If not, a new page is added and the summary starts at y=20mm.

The summary text is then drawn with `doc.text()` — showing total records, total amount, and status breakdowns.

#### Step 5: Add Page Footer

```jsx
const pageCount = doc.internal.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
        `Page ${i} of ${pageCount}  |  Himlayan Cemetery Management System`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
    );
}
```

Loops through every page in the document and adds a centered footer with "Page X of Y" and the system name, positioned 8mm from the bottom edge.

#### Step 6: Output the PDF

```jsx
if (action === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
} else {
    doc.save(filename);
}
```

- **Download:** `doc.save()` triggers the browser's file download dialog with filename `payments_report_2026-03-18.pdf`.
- **Print:** `doc.autoPrint()` embeds a JavaScript auto-print command in the PDF, then `window.open()` opens it in a new browser tab where the print dialog appears immediately.

---

## CSS Styling

**Location:** `frontend/src/pages/ReportGeneratorPage.css`

The page reuses the shared `AdminManagement.css` for the base admin layout (sidebar + main content area), then adds report-specific styles:

- **`.report-filters-card`** — White card with rounded corners and shadow, containing the filter controls.
- **`.report-filters-grid`** — CSS Grid with `auto-fill` and `minmax(200px, 1fr)` so filters wrap responsively.
- **`.btn-generate`** — Green gradient button matching the system's branding.
- **`.report-preview-card`** — Contains the summary stats, action buttons, and data table.
- **`.report-summary-stats`** — Grid of stat cards showing key metrics.
- **`.report-table`** — Styled HTML table with dark green header, alternating row colors, and hover effects.
- **`.status-badge`** — Color-coded pill badges for status values (green for verified, yellow for pending, red for failed).
- **Responsive:** At screen widths below 768px, filters stack vertically and the summary grid switches to a 2-column layout.

---

## Routing & Navigation

### App.jsx Route

```jsx
<Route
    path="/admin/reports"
    element={
        <ProtectedRoute roles={['admin', 'staff']}>
            <ReportGeneratorPage />
        </ProtectedRoute>
    }
/>
```

The route is wrapped in `ProtectedRoute` with `roles={['admin', 'staff']}`, which redirects unauthorized users (members, unauthenticated visitors) away from this page.

### Sidebar Link

In `Sidebar.jsx`, a "Reports" NavLink was added under the Management section:

```jsx
<NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'active' : ''}>
    Reports
</NavLink>
```

### Dashboard Button

In `EnhancedDashboardPage.jsx`, a "Generate Report" button was added in the page header that navigates to `/admin/reports` using React Router's `useNavigate()`.

---

## Security

- **Authentication:** All `/api/reports/*` endpoints require a valid auth token (Sanctum middleware).
- **Authorization:** The `role:admin,staff` middleware restricts access to admin and staff users only.
- **Frontend guard:** `ProtectedRoute` with `roles` prop prevents unauthorized users from seeing the page.
- **No raw SQL:** All database queries use Laravel's Eloquent ORM query builder, preventing SQL injection.
- **Input validation:** Filter parameters use `$request->filled()` checks — empty/missing values are safely ignored.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `jspdf` | ^2.x | Core PDF document creation library |
| `jspdf-autotable` | ^3.x | Plugin for rendering tables in jsPDF |

Both are installed in the `frontend/` directory via npm and bundled into the production build. PDF generation happens entirely in the browser — no server-side PDF rendering is needed.
