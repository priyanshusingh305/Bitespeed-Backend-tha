# Contact Identification Service

A robust web service that identifies and consolidates contact information based on email and phone number inputs. The service maintains relationships between contacts and handles various scenarios of contact linking and merging.

## Deployment Links

### Backend API
- Vercel: [https://server-eight-rose-41.vercel.app/](https://server-eight-rose-41.vercel.app/)
- Render: [https://bitespeed-backend-tha.onrender.com/](https://bitespeed-backend-tha.onrender.com/)

### Frontend Application
- Vercel: [https://bitespeed-backend-tha-o7gr.vercel.app/](https://bitespeed-backend-tha-o7gr.vercel.app/)

## Features

- Contact identification and consolidation
- Automatic linking of related contacts
- Support for primary and secondary contact relationships
- Pagination support for retrieving contacts
- Input validation using Zod
- TypeScript support
- PostgreSQL database with Drizzle ORM

## API Endpoints

### 1. Identify Contact
```http
POST /identify
```

**Request Body:**
```json
{
    "email": "string",      // optional
    "phoneNumber": "string" // optional
}
```

**Response:**
```json
{
    "contact": {
        "primaryContatctId": number,
        "emails": string[],           // first element is primary contact's email
        "phoneNumbers": string[],     // first element is primary contact's phone
        "secondaryContactIds": number[] // IDs of secondary contacts
    }
}
```

### 2. Get All Contacts
```http
GET /getall?page=1&limit=10
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

## Contact Linking Rules

1. **New Contact**: If no existing contact matches the input, a new primary contact is created.

2. **Secondary Contact Creation**: A secondary contact is created when:
   - An incoming request has either phoneNumber or email matching an existing contact
   - The request contains new information not present in existing contacts

3. **Primary Contact Rules**:
   - The oldest contact remains as primary
   - Primary contacts can be converted to secondary if they're linked to an older contact
   - When multiple contacts are merged, the oldest contact becomes primary

## Database Schema

```sql
contacts (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    linked_id INTEGER,
    link_precedence VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
)
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```env
DATABASE_URL=your_postgresql_connection_string
```

3. Run database migrations:
```bash
npm run migrate
```

4. Start the server:
```bash
npm start
```

## Example Scenarios

### Scenario 1: New Contact
**Request:**
```json
{
    "email": "new@example.com",
    "phoneNumber": "123456"
}
```
**Response:**
```json
{
    "contact": {
        "primaryContatctId": 1,
        "emails": ["new@example.com"],
        "phoneNumbers": ["123456"],
        "secondaryContactIds": []
    }
}
```

### Scenario 2: Linking Contacts
**Request:**
```json
{
    "email": "secondary@example.com",
    "phoneNumber": "123456"
}
```
**Response:**
```json
{
    "contact": {
        "primaryContatctId": 1,
        "emails": ["new@example.com", "secondary@example.com"],
        "phoneNumbers": ["123456"],
        "secondaryContactIds": [2]
    }
}
```

## Error Handling

The service returns appropriate HTTP status codes:
- 200: Successful operation
- 400: Invalid request data
- 500: Internal server error

## Technologies Used

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod (for validation)
- Helmet (for security)
- CORS
