# Dashboard API Documentation

> **Base URL:** `/api/v1/dashboard`
> **Authentication:** Bearer JWT token required (header `Authorization: Bearer <token>`)
> **Content-Type:** `application/json`
> **Response naming:** All JSON fields use `snake_case`

---

## 1. Article Growth by Month

Returns a line chart dataset showing how many articles were created each month for a given year.

### Endpoint

```
GET /api/v1/dashboard/articles/growth
```

### Query Parameters

| Parameter | Type    | Required | Default      | Description             |
|-----------|---------|----------|--------------|-------------------------|
| `year`    | integer | No       | current year | Year to query (e.g. `2026`) |

### Request Headers

| Header            | Value                  | Required |
|-------------------|------------------------|----------|
| `Authorization`   | `Bearer <jwt_token>`   | Yes      |
| `Accept-Language` | `en` / `vi`            | No (default `en`) |

### Response

**HTTP 200 OK**

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "year": 2026,
    "months": [
      { "month": 1,  "month_name": "January",   "count": 45 },
      { "month": 2,  "month_name": "February",  "count": 62 },
      { "month": 3,  "month_name": "March",     "count": 78 },
      { "month": 4,  "month_name": "April",     "count": 0  },
      { "month": 5,  "month_name": "May",        "count": 0  },
      { "month": 6,  "month_name": "June",       "count": 0  },
      { "month": 7,  "month_name": "July",       "count": 0  },
      { "month": 8,  "month_name": "August",     "count": 0  },
      { "month": 9,  "month_name": "September",  "count": 0  },
      { "month": 10, "month_name": "October",    "count": 0  },
      { "month": 11, "month_name": "November",   "count": 0  },
      { "month": 12, "month_name": "December",   "count": 0  }
    ],
    "total": 185
  },
  "timestamp": "2026-03-26T10:00:00"
}
```

### Response Fields

| Field                  | Type    | Description                                              |
|------------------------|---------|----------------------------------------------------------|
| `data.year`            | integer | The queried year                                         |
| `data.months`          | array   | Always 12 entries (one per month), filled with 0 if no data |
| `data.months[].month`  | integer | Month number (1–12)                                      |
| `data.months[].month_name` | string | Full English month name                             |
| `data.months[].count`  | long    | Number of articles created in that month                 |
| `data.total`           | long    | Total articles created across all months of the year     |

### Frontend Chart Mapping

```
X-axis (categories): month_name values from data.months
Y-axis (values):     count values from data.months
Series name:         "Articles Created"
Chart title:         "Article Growth - {year}"
```

### Example Requests

```bash
# Current year (auto-detected on server)
GET /api/v1/dashboard/articles/growth

# Specific year
GET /api/v1/dashboard/articles/growth?year=2025
```

---

## 2. Article Count by Source (per Month)

Returns a multi-series line chart dataset showing how many articles each news source produced per month.

### Endpoint

```
GET /api/v1/dashboard/articles/by-source
```

### Query Parameters

| Parameter | Type    | Required | Default      | Description             |
|-----------|---------|----------|--------------|-------------------------|
| `year`    | integer | No       | current year | Year to query (e.g. `2026`) |

### Request Headers

| Header            | Value                  | Required |
|-------------------|------------------------|----------|
| `Authorization`   | `Bearer <jwt_token>`   | Yes      |
| `Accept-Language` | `en` / `vi`            | No (default `en`) |

### Response

**HTTP 200 OK**

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "year": 2026,
    "sources": [
      {
        "source_id": 1,
        "source_name": "VnExpress",
        "monthly_data": [
          { "month": 1,  "count": 20 },
          { "month": 2,  "count": 35 },
          { "month": 3,  "count": 50 },
          { "month": 4,  "count": 0  },
          { "month": 5,  "count": 0  },
          { "month": 6,  "count": 0  },
          { "month": 7,  "count": 0  },
          { "month": 8,  "count": 0  },
          { "month": 9,  "count": 0  },
          { "month": 10, "count": 0  },
          { "month": 11, "count": 0  },
          { "month": 12, "count": 0  }
        ],
        "total": 105
      },
      {
        "source_id": 2,
        "source_name": "Tuổi Trẻ",
        "monthly_data": [
          { "month": 1,  "count": 15 },
          { "month": 2,  "count": 18 },
          { "month": 3,  "count": 22 },
          { "month": 4,  "count": 0  },
          { "month": 5,  "count": 0  },
          { "month": 6,  "count": 0  },
          { "month": 7,  "count": 0  },
          { "month": 8,  "count": 0  },
          { "month": 9,  "count": 0  },
          { "month": 10, "count": 0  },
          { "month": 11, "count": 0  },
          { "month": 12, "count": 0  }
        ],
        "total": 55
      }
    ]
  },
  "timestamp": "2026-03-26T10:00:00"
}
```

### Response Fields

| Field                               | Type    | Description                                                       |
|-------------------------------------|---------|-------------------------------------------------------------------|
| `data.year`                         | integer | The queried year                                                  |
| `data.sources`                      | array   | List of sources that have at least 1 article in the queried year  |
| `data.sources[].source_id`          | long    | Unique ID of the news source                                      |
| `data.sources[].source_name`        | string  | Display name of the news source                                   |
| `data.sources[].monthly_data`       | array   | Always 12 entries (one per month), filled with 0 if no data      |
| `data.sources[].monthly_data[].month` | integer | Month number (1–12)                                             |
| `data.sources[].monthly_data[].count` | long  | Number of articles from this source in that month                |
| `data.sources[].total`              | long    | Total articles from this source across all months of the year     |

### Frontend Chart Mapping

```
X-axis (categories): months 1–12 (use month number or a fixed label array ["Jan","Feb",...,"Dec"])
Y-axis (values):     monthly_data[].count for each source
Series:              One line per source, use source_name as series label
Chart title:         "Articles by Source - {year}"
Legend:              source_name values
```

### Example Requests

```bash
# Current year
GET /api/v1/dashboard/articles/by-source

# Specific year
GET /api/v1/dashboard/articles/by-source?year=2025
```

---

## Common Error Responses

All endpoints follow the same error format:

```json
{
  "status": 401,
  "message": "Unauthorized",
  "data": null,
  "timestamp": "2026-03-26T10:00:00"
}
```

| HTTP Status | Meaning                                      |
|-------------|----------------------------------------------|
| `200`       | Success                                      |
| `401`       | Missing or invalid JWT token                 |
| `403`       | Token valid but insufficient permissions     |
| `500`       | Internal server error                        |

---

## Frontend Integration Notes

### Chart Library Recommendation
Use **Chart.js**, **Recharts**, **ApexCharts**, or **ECharts** with `type: "line"`.

### API 1 — Single-series line chart (`/articles/growth`)

```javascript
// Pseudocode
const res = await fetch('/api/v1/dashboard/articles/growth?year=2026', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data } = await res.json();

const chartData = {
  labels: data.months.map(m => m.month_name),   // ["January", ..., "December"]
  datasets: [{
    label: `Articles Created`,
    data: data.months.map(m => m.count),          // [45, 62, 78, 0, ...]
  }]
};
```

### API 2 — Multi-series line chart (`/articles/by-source`)

```javascript
// Pseudocode
const res = await fetch('/api/v1/dashboard/articles/by-source?year=2026', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data } = await res.json();

const monthLabels = data.sources[0]?.monthly_data.map(m => `Month ${m.month}`) ?? [];

const chartData = {
  labels: monthLabels,                                         // ["Month 1", ..., "Month 12"]
  datasets: data.sources.map(source => ({
    label: source.source_name,                                 // e.g. "VnExpress"
    data: source.monthly_data.map(m => m.count),              // [20, 35, 50, 0, ...]
  }))
};
```

### Year Picker
Both endpoints accept an optional `year` query parameter. Provide a year-picker UI component that calls the API again when the year changes. If omitted, the server defaults to the current year.
