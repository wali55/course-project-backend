# Inventory Management App

A full-stack web application for managing inventories (office equipment, books, HR documents, etc.).
Users can create inventories with custom fields & custom IDs, add items, manage access, discuss, like, and search inventories.

---

Built with:

- Backend: Express, Prisma, PostgreSQL
- Cloudinary for image uploads

---

### Features

- Authentication & Profile Management
- Admin User Management (block, unblock, promote, remove)
- Inventory Creation with tags, categories, and images
- Custom Inventory IDs with drag-and-drop builder
- Custom Fields for items (text, number, boolean, etc.) 
- Homepage with latest and most popular inventories

---

### Backend Tech Stack

- Express.js
- Prisma ORM
- PostgreSQL
- Cloudinary SDK
- JWT Authentication (Access + Refresh Tokens)

### Quick Start Backend

1. Clone repository:
```
git clone https://github.com/wali55/course-project-backend.git
cd course-project-backend
```

2. Install dependencies:
```
npm install
```

3. Create .env file:
```
DATABASE_URL="your_database_url"
JWT_SECRET="your-jwt-secret"
NODE_ENV="your_node_environment"
PORT=5000

CLOUDINARY_CLOUD_NAME="your_cloudinary_could_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

CLIENT_URL="your_client_url"
SAME_SITE="strict_for_production_none_for_dev"
```

4. Run Prisma migrations:
```
npm run migrate
```

5. Start backend:
```
npm run dev
```

5. Seed database:
```
npm run seed
```