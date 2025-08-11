# Weavewise - Sistema de Otimização Têxtil

## Overview

Weavewise is a textile production optimization system that leverages machine learning to optimize manufacturing quantities. The application allows users to upload production data via Excel files, train custom optimization models, and receive intelligent quantity recommendations based on historical patterns. The system features user authentication, data management, model training capabilities, and comprehensive analytics to help textile manufacturers optimize their production planning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **State Management**: React hooks with local component state
- **Data Fetching**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **File Processing**: SheetJS (xlsx) for Excel file parsing

### Backend Architecture
- **Server Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)
- **API Pattern**: RESTful endpoints with `/api` prefix
- **File Upload**: Multipart form handling for Excel files
- **Error Handling**: Centralized error middleware with structured responses

### Authentication & Authorization
- **Primary Auth**: Supabase Authentication service
- **Session Storage**: PostgreSQL-backed sessions for server-side auth
- **User Management**: Supabase handles signup, login, and user sessions
- **Route Protection**: Client-side authentication state management

### Database Schema
- **Users Table**: Basic user information (username, password) with Drizzle schema
- **Model Weights**: Store trained ML model parameters per user
- **Training Data**: Historical production data for model training
- **Optimization Logs**: Track optimization runs and results
- **Training History**: Monitor model training progress and status

### File Processing Pipeline
- **Excel Upload**: Client-side file validation and parsing
- **Data Validation**: Schema validation for required columns (Referência, Cor, Tamanho, Qtd)
- **Data Transformation**: Convert Excel data to ProductionItem interface
- **Batch Processing**: Handle large datasets efficiently

### Machine Learning Integration
- **Model Architecture**: Custom optimization models trained on historical data
- **Training Pipeline**: User-uploaded training data processed and stored
- **Model Versioning**: Multiple model versions per user with active model selection
- **Prediction Engine**: Apply trained models to new production data with tolerance settings

## External Dependencies

### Database & Storage
- **Neon Database**: PostgreSQL hosting service (@neondatabase/serverless)
- **Supabase**: Authentication, real-time subscriptions, and additional data storage

### Frontend Libraries
- **UI Components**: Complete Radix UI component ecosystem
- **Data Visualization**: Recharts for charts and analytics
- **File Processing**: SheetJS for Excel file manipulation
- **Date Handling**: date-fns for date operations
- **Utilities**: clsx and class-variance-authority for styling

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Database Migrations**: Drizzle Kit for schema management
- **Code Quality**: TypeScript strict mode with path mapping
- **Development**: tsx for TypeScript execution and hot reload

### Production Infrastructure
- **Deployment**: Node.js with esbuild bundling for server code
- **Static Assets**: Vite build output served by Express
- **Environment**: Environment-based configuration for database and external services
- **Session Store**: PostgreSQL-backed sessions for scalability