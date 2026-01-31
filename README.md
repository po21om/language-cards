# Flashcards AI

[![Node.js Version](https://img.shields.io/badge/node-22.14.0-brightgreen)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5.13.7-FF5D01?logo=astro)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)

A web-based application designed to help students and language learners accelerate their learning process through AI-powered flashcard generation and spaced repetition. The core value proposition is using AI to instantly convert text excerpts into high-quality flashcards, removing the time-consuming friction of manual creation.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**Flashcards AI** solves a critical problem for learners: manually creating high-quality flashcards is tedious and time-consuming. This high effort barrier discourages learners from adopting spaced repetition, despite it being a highly effective learning method.

### Key Features

- **AI Flashcard Generation** - Paste text up to 1,800 characters and instantly generate Question/Answer pairs
- **Review Workflow** - Accept, refine, edit, or reject AI-generated cards before adding them to your deck
- **Manual Card Management** - Create, edit, and organize flashcards with Unicode emoji tags
- **Smart Study System** - Custom weighted random-without-replacement scheduler for effective spaced repetition
- **Multi-language Support** - Interface available in English and Polish
- **Data Export** - Download your flashcards in CSV or JSON format
- **Accessibility First** - WCAG AA Level A compliant with full keyboard navigation and screen reader support
- **Privacy Focused** - GDPR compliant, source text not stored, complete data deletion on request

### Target Audience

Students and language learners who want to focus their energy on studying rather than administrative tasks, thereby increasing adherence to their learning goals.

## Tech Stack

### Core Framework & Libraries

- **[Astro](https://astro.build/)** v5.13.7 - Modern web framework for building fast, content-focused websites
- **[React](https://react.dev/)** v19.1.1 - UI library for building interactive components
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Tailwind CSS](https://tailwindcss.com/)** v4.1.13 - Utility-first CSS framework
- **[Supabase](https://supabase.io/)** - Open source Firebase alternative for database and authentication

### UI Components & Styling

- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives for building high-quality design systems
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icon set
- **[class-variance-authority](https://cva.style/)** - Component variant management
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Utility class merging
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications for React

### Development Tools

- **ESLint** - Code linting with TypeScript, React, and Astro support
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files

## Getting Started Locally

### Prerequisites

- **Node.js** v22.14.0 (as specified in `.nvmrc`)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd language-cards
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file by copying the example file:

```bash
cp .env.example .env
```

Next, add your Supabase and OpenRouter credentials to the `.env` file. You can get these from your Supabase project settings and OpenRouter account.

```
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-anon-key"
OPENROUTER_API_KEY="your-openrouter-api-key"
OPENROUTER_MODEL="your-model-of-choice"
```

4. **Run the development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

5. **Build for production:**

```bash
npm run build
```

6. **Preview production build:**

```bash
npm run preview
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run test:unit` | Run unit tests with Vitest |
| `npm run test:e2e` | Run end-to-end tests with Playwright |

## Project Scope

### Included in MVP

#### AI Flashcard Generation
- Text input up to 1,800 characters (~1 A4 page)
- AI-powered Question/Answer pair generation
- Review workflow with Accept/Refine/Edit/Reject actions
- User feedback logging for acceptance rate metrics

#### Card Management
- Manual flashcard creation with Front/Back text
- Flat tagging system with Unicode emoji support
- Full CRUD operations (Create, Read, Update, Delete)
- Soft-delete mechanism with 30-day retention before permanent purge
- Restore functionality for accidentally deleted cards

#### Study System
- In-house weighted random-without-replacement scheduler
- One-by-one card review with answer reveal
- User feedback collection (Correct/Incorrect) to update card weights
- Versioned scheduler API

#### User System & Security
- **Authentication:** Secure sign-up and sign-in functionality provided by Supabase Auth.
- **Email Verification:** New user accounts require email verification to ensure security.
- **Password Policy:** Passwords must be at least 8 characters long and contain both letters and numbers.
- **Account Deletion:** Users can permanently delete their accounts and all associated data.
- **GDPR Compliance:** All data handling is designed to be GDPR-compliant.

#### Platform Features
- Desktop browser support: Chrome and Firefox
- CSV and JSON export functionality
- Optional demo deck for new users
- WCAG AA Level A accessibility compliance

### Out of Scope (MVP)

- ❌ Advanced algorithms (SuperMemo SM-2, Anki)
- ❌ File imports (PDF, DOCX, images)
- ❌ Social features (deck sharing between users)
- ❌ Third-party integrations (LMS, Quizlet)
- ❌ Native mobile applications
- ❌ AI usage quotas or rate limiting
- ❌ Bilingual UI: English and Polish (architecture ready for expansion)

### Constraints

- **Performance:** Time-To-First-Card (TTFC) must be < 3 minutes
- **Privacy:** Minimal cookie/analytics banner, GDPR-friendly retention
- **Browser Support:** Strictly Chrome and Firefox (desktop only)

## Project Status

**Version:** 0.0.1 (MVP Phase)

### Success Metrics

The MVP will be validated against the following metrics:

1. **AI Quality Acceptance:** 75% of AI-generated flashcards accepted by users
2. **AI Usage Adoption:** Users create 75% of their flashcards using AI
3. **Performance:** Time-to-First-Card (TTFC) < 3 minutes for new users
4. **Accessibility:** Zero accessibility blockers at WCAG AA Level A

### Browser Support

- ✅ Google Chrome (latest)
- ✅ Mozilla Firefox (latest)

### Language Support

- 🇬🇧 English

## License

Flashcards AI is released under the MIT License.

```
MIT License

Copyright (c) 2026 Flashcards AI contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
