# SteerSolo Backend

Production-ready Node.js backend for SteerSolo - A Nigerian-first e-commerce platform.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Access + Refresh Tokens)
- **Payment**: Paystack
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## Features

### User Roles
- **Admin**: Platform management and analytics
- **Entrepreneur**: Store management and order fulfillment
- **Customer**: Browse, purchase, and review products

### Core Functionality
- ✅ Email/Password authentication with JWT
- ✅ Role-based access control (RBAC)
- ✅ Shop management with custom slugs
- ✅ Product catalog with inventory tracking
- ✅ Order management with WhatsApp integration
- ✅ Paystack payment integration
- ✅ Review and rating system
- ✅ Subscription management (₦1,000/month with 7-day trial)
- ✅ Admin dashboard with analytics
- ✅ Offers, Courses, Rewards, and Feedback modules

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Paystack account

### Installation

1. **Clone the repository**
   ```bash
   cd SteerSolo-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Generate secure random strings
   - `PAYSTACK_SECRET_KEY` & `PAYSTACK_PUBLIC_KEY`: From your Paystack dashboard
   - `CORS_ORIGIN`: Your frontend URL(s)

4. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:5000`

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /signup` - Create new account
- `POST /login` - Login
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

### Users (`/api/v1/users`)
- `GET /me` - Get current user
- `PUT /me` - Update profile
- `GET /` - List all users (Admin)
- `GET /:id` - Get user by ID (Admin)

### Shops (`/api/v1/shops`)
- `POST /` - Create shop (Entrepreneur)
- `GET /` - List all shops
- `GET /:slug` - Get shop by slug
- `PUT /:id` - Update shop
- `DELETE /:id` - Delete shop
- `PATCH /:id/activate` - Activate shop (Admin)
- `PATCH /:id/deactivate` - Deactivate shop (Admin)

### Products (`/api/v1/products`)
- `POST /` - Create product (Entrepreneur)
- `GET /` - List products (with filters)
- `GET /:id` - Get product details
- `PUT /:id` - Update product
- `DELETE /:id` - Delete product

### Orders (`/api/v1/orders`)
- `POST /` - Create order
- `GET /` - List orders (role-based)
- `GET /:id` - Get order details
- `PATCH /:id/status` - Update order status
- `GET /:id/whatsapp-link` - Generate WhatsApp link

### Payments (`/api/v1/payments`)
- `POST /initialize` - Initialize payment
- `GET /verify/:reference` - Verify payment
- `POST /webhook` - Paystack webhook

### Reviews (`/api/v1/reviews`)
- `POST /` - Create review
- `GET /product/:productId` - Get product reviews
- `PUT /:id` - Update review
- `DELETE /:id` - Delete review

### Admin (`/api/v1/admin`)
- `GET /analytics` - Platform analytics
- `GET /users` - List all users
- `GET /shops` - List all shops
- `GET /orders` - List all orders
- `GET /products` - List all products
- `PATCH /users/:id/role` - Change user role

### Additional Modules
- `/api/v1/offers` - Manage platform offers
- `/api/v1/courses` - Educational courses
- `/api/v1/rewards` - Loyalty rewards
- `/api/v1/feedback` - User feedback

## Database Schema

The Prisma schema includes:
- User & Profile
- Shop & Subscription
- Product, Category, ProductImage
- Order, OrderItem
- Payment
- Review
- RefreshToken, PasswordReset
- Offer, Course, Reward, Feedback

## Security Features

- **Helmet**: Security headers
- **CORS**: Configured for specific origins
- **Rate Limiting**: Different limits for auth, payments, and general endpoints
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Zod schemas for all endpoints
- **SQL Injection Protection**: Prisma ORM
- **Webhook Signature Verification**: Paystack webhooks

## Deployment

### Vercel (Serverless)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Create `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.ts"
       }
     ]
   }
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### VPS (Traditional Server)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Set up environment variables** on your server

3. **Run migrations**:
   ```bash
   npm run prisma:deploy
   ```

4. **Start with PM2**:
   ```bash
   pm2 start dist/server.js --name steersolo-api
   pm2 save
   pm2 startup
   ```

### Environment Variables for Production

Ensure all environment variables are set:
- Use strong, random JWT secrets (min 32 characters)
- Use production Paystack keys
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use a production PostgreSQL database

## Development

### Project Structure
```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── routes.ts              # Route registry
├── config/                # Configuration files
├── middlewares/           # Express middlewares
├── modules/               # Feature modules
│   ├── auth/
│   ├── users/
│   ├── shops/
│   ├── products/
│   ├── orders/
│   ├── payments/
│   ├── reviews/
│   ├── admin/
│   ├── offers/
│   ├── courses/
│   ├── rewards/
│   └── feedback/
├── utils/                 # Utility functions
└── types/                 # TypeScript types
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio

## Testing

Test the API using:
- **Postman**: Import the API collection
- **Thunder Client**: VS Code extension
- **curl**: Command line testing

Example:
```bash
# Health check
curl http://localhost:5000/api/v1/health

# Signup
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","role":"CUSTOMER"}'
```

## License

ISC

## Support

For issues and questions, please contact the development team.
