# Synvya Retail Client

A modern merchant platform that leverages Nostr for decentralized authentication and storefront creation. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Nostr Authentication**: Secure sign-in/sign-up using NIP-07 browser extensions
- **Merchant Onboarding**: Complete profile setup with file uploads
- **Platform Integration**: Bulk import from Square and Shopify (coming soon)
- **Live Preview**: Embedded iframe preview of your storefront
- **Modern UI**: Clean, responsive design with smooth animations

## Quick Start

### Prerequisites
- Node.js & npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Nostr browser extension (nos2x, Alby, etc.)

### Local Development
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd synvya-retail-client

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173 to view the application.

## Environment Setup

This application uses environment variables for configuration. Before running the application, you'll need to set up your environment files:

### Frontend Configuration
Copy the example file and configure as needed:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `DATABASE_URL`: Your PostgreSQL connection string
- `VITE_API_URL`: Backend API URL (optional, defaults to http://localhost:8000)

### Backend Configuration
Copy the backend example file:
```bash
cp server/app/.env.example server/app/.env
```

Edit `server/app/.env` with:
- `BACKEND_PRIVATE_KEY`: Your Nostr private key in nsec format (generate with a Nostr client)

**⚠️ Security Note**: Never commit `.env` files to version control. They are included in `.gitignore` to prevent accidental exposure of sensitive data.

### Docker Development
```bash
# Build and run with docker-compose
docker compose up --build
```

This starts:
- **Frontend** on http://localhost:5173
- **Backend API** on http://localhost:8000

## Project Structure

```
synvya-retail-client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Logo.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── SecondaryButton.tsx
│   │   ├── FilePicker.tsx
│   │   ├── Checkbox.tsx
│   │   ├── AuthGuard.tsx
│   │   └── NavHeader.tsx
│   ├── contexts/            # React contexts
│   │   └── NostrAuthContext.tsx
│   ├── pages/               # Application pages
│   │   ├── SignInPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── FormPage.tsx
│   │   └── VisualizationPage.tsx
│   └── hooks/               # Custom React hooks
├── server/                  # FastAPI backend (placeholder)
└── docker-compose.yml       # Docker configuration
```

## Technology Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Authentication**: Nostr NIP-07 browser extensions
- **State Management**: React Context + useReducer
- **Routing**: React Router DOM v6
- **Backend**: FastAPI (placeholder ready for expansion)
- **Development**: Docker & docker-compose

## Design System

### Colors
- **Primary**: `#01013C` (Deep Navy)
- **Accent**: `#9F7AEA` (Purple)
- **Neutral**: `#F6F6F9` (Light Gray)

### Typography
- **Font**: Inter with system fallbacks
- **Weights**: 300, 400, 500, 600, 700

### Components
- **Buttons**: Rounded corners (12px), subtle shadows, hover animations
- **Cards**: Rounded corners (16px), elevated shadows
- **Inputs**: Focus states with accent color borders

## Nostr Integration

This application integrates with Nostr through NIP-07 compatible browser extensions:

### Supported Extensions
- [nos2x](https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp)
- [Alby](https://chrome.google.com/webstore/detail/alby/iokeahhehimjnekafflcihljlcjccdbe)

### Authentication Flow
1. User clicks "Sign In" or "Sign Up"
2. Application checks for `window.nostr` interface
3. If missing, shows extension installation modal
4. Calls `window.nostr.getPublicKey()` for authentication
5. Stores public key in context for session management

## Extending in Cursor

This codebase is designed to be extended with real backend functionality. Here's how to continue development:

### Backend Implementation
The `/server` directory contains FastAPI placeholder code ready for expansion:

1. **Open in Cursor**: Load the project in Cursor IDE
2. **Implement API endpoints**: 
   - `server/app/api/products.py` - Product management
   - `server/app/api/profile.py` - Merchant profile handling
3. **Add database integration**: Configure PostgreSQL/SQLite with SQLAlchemy
4. **Implement file uploads**: Add cloud storage for images and CSV files
5. **Platform integrations**: Add Square and Shopify API clients

### Frontend Enhancements
- Add form validation with react-hook-form
- Implement real API calls replacing placeholder functions
- Add loading states and error handling
- Enhance file upload with progress indicators

### Production Deployment
- Configure environment variables
- Set up CI/CD pipeline with the included GitHub Actions
- Deploy to your preferred cloud platform
- Configure SSL and domain routing

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run test suite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
