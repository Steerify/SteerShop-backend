# SteerSolo API Endpoints Reference

Base URL: `http://localhost:5000/api/v1`

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "CUSTOMER",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "profile": {...}
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "jwt-refresh-token"
    }
  }
}
```

### POST /auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### POST /auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "NewSecurePass123"
}
```

---

## Shop Endpoints

### POST /shops
Create a new shop (Entrepreneur only).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "My Amazing Shop",
  "slug": "my-amazing-shop",
  "description": "Best products in Nigeria",
  "phone": "+2348012345678",
  "whatsapp": "+2348012345678",
  "address": "123 Main St",
  "city": "Lagos",
  "state": "Lagos"
}
```

### GET /shops
List all shops.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `isActive` (boolean): Filter by active status

### GET /shops/:slug
Get shop by slug.

---

## Product Endpoints

### POST /products
Create a new product (Entrepreneur only).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "shopId": "shop-uuid",
  "categoryId": "category-uuid",
  "name": "Product Name",
  "slug": "product-name",
  "description": "Product description",
  "price": 500000,
  "comparePrice": 600000,
  "inventory": 100,
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "alt": "Product image",
      "position": 0
    }
  ]
}
```

**Note:** Price is in kobo (₦5,000 = 500000 kobo)

### GET /products
List all products with filters.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `shopId` (string)
- `categoryId` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `search` (string)
- `isActive` (boolean)

### GET /products/:id
Get product details with reviews and average rating.

---

## Order Endpoints

### POST /orders
Create a new order.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "shopId": "shop-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2
    }
  ],
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+2348012345678",
  "deliveryAddress": "123 Main St",
  "deliveryCity": "Lagos",
  "deliveryState": "Lagos",
  "deliveryFee": 200000,
  "notes": "Please deliver in the morning"
}
```

### GET /orders
List orders (filtered by user role).

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `shopId` (string)
- `status` (string): PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED

### GET /orders/:id
Get order details.

### PATCH /orders/:id/status
Update order status (Entrepreneur/Admin only).

**Request Body:**
```json
{
  "status": "PROCESSING"
}
```

### GET /orders/:id/whatsapp-link
Generate WhatsApp link for order.

**Response:**
```json
{
  "success": true,
  "data": {
    "whatsappLink": "https://wa.me/2348012345678?text=...",
    "message": "Order details formatted for WhatsApp"
  }
}
```

---

## Payment Endpoints

### POST /payments/initialize
Initialize Paystack payment.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "orderId": "order-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {...},
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "...",
    "reference": "PAY-ORD-..."
  }
}
```

### GET /payments/verify/:reference
Verify payment status.

### POST /payments/webhook
Paystack webhook endpoint (no authentication required).

**Headers:**
```
x-paystack-signature: signature-hash
```

---

## Review Endpoints

### POST /reviews
Create a product review.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "productId": "product-uuid",
  "rating": 5,
  "comment": "Great product!"
}
```

### GET /reviews/product/:productId
Get all reviews for a product.

**Query Parameters:**
- `page` (number)
- `limit` (number)

**Response includes average rating**

---

## Admin Endpoints

All admin endpoints require Admin role.

### GET /admin/analytics
Get platform analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalShops": 50,
    "activeShops": 45,
    "totalProducts": 500,
    "totalOrders": 2000,
    "pendingOrders": 50,
    "totalRevenue": 50000000,
    "recentOrders": [...]
  }
}
```

### GET /admin/users
List all users with pagination.

### GET /admin/shops
List all shops with pagination.

### GET /admin/orders
List all orders with pagination.

### GET /admin/products
List all products with pagination.

### PATCH /admin/users/:id/role
Change user role.

**Request Body:**
```json
{
  "role": "ENTREPRENEUR"
}
```

---

## Additional Endpoints

### Offers
- `GET /offers` - List active offers
- `POST /offers` - Create offer (Admin)
- `PUT /offers/:id` - Update offer (Admin)
- `DELETE /offers/:id` - Delete offer (Admin)

### Courses
- `GET /courses` - List published courses
- `GET /courses/:id` - Get course details
- `POST /courses` - Create course (Admin)
- `PUT /courses/:id` - Update course (Admin)
- `DELETE /courses/:id` - Delete course (Admin)

### Rewards
- `GET /rewards` - List active rewards
- `POST /rewards` - Create reward (Admin)
- `PUT /rewards/:id` - Update reward (Admin)
- `DELETE /rewards/:id` - Delete reward (Admin)

### Feedback
- `POST /feedback` - Submit feedback (Authenticated)
- `GET /feedback` - List all feedback (Admin)
- `PATCH /feedback/:id/status` - Update feedback status (Admin)

---

## Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

**Paginated:**
```json
{
  "success": true,
  "message": "Data retrieved",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer {accessToken}
```

Access tokens expire after 15 minutes. Use the refresh token to get a new access token.

---

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **Payment endpoints**: 10 requests per minute

---

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `429` - Too Many Requests (Rate Limit)
- `500` - Internal Server Error
