# Welcome!

Your JavaScript module was successfully created. If this is your first time creating a module, you may want to consult the [Getting Started guide](https://academy.jahia.com/tutorials-get-started/front-end-developer/setting-up-your-dev-environment#create-a-new-project).

This README assumes you have a working development environment with Node.js, Yarn and Docker installed and configured. Please refer to the [Getting Started](https://academy.jahia.com/tutorials-get-started/front-end-developer/setting-up-your-dev-environment) guide if you need help setting up your environment.

## Prerequisites

This module requires the **blog-service** module to be deployed for full functionality. The blog-service provides REST API endpoints for:

- Blog post ratings
- Comment submission and moderation

See [BLOG_SERVICE.md](./BLOG_SERVICE.md) for detailed integration documentation.

## Getting Started

This module is accompanied by a Docker-based development environment. To get started, follow these steps:

```bash
# Install dependencies
yarn install

# Start Jahia in Docker
docker compose up --wait

# Deploy blog-service module (required for ratings/comments)
# Then start the dev mode
yarn dev
```

These commands will start a Jahia instance in a Docker container and start a watcher that will automatically build your module every time you make changes to the source code.

## Configuration

### CSRF Token Setup

For security, the blog-service requires a CSRF token. Add this to your `.env` file:

```bash
BLOG_SERVICE_CSRF_TOKEN=your-csrf-token-here
```

**Important**: This is only for deployment configuration. For runtime, you must add a CSRF token meta tag to your page template:

```html
<meta name="csrf-token" content="${csrf-token-value}" />
```

See [BLOG_SERVICE.md](./BLOG_SERVICE.md) for complete setup instructions.

## Commands

This module comes with some scripts to help you develop your module. You can run them with `yarn <script>`:

| Category     | Script                | Description                                                             |
| ------------ | --------------------- | ----------------------------------------------------------------------- |
| Build        | `build`               | Produces a deployable artifact that can be uploaded to a Jahia instance |
| Build        | `deploy`              | Pushes the build artifact to a Jahia instance                           |
| Development  | `dev` (alias `watch`) | Watches for changes and rebuilds the module                             |
| Code quality | `format`              | Runs Prettier (a code formatter) on your code                           |
| Code quality | `lint`                | Runs ESLint (a linter) on your code                                     |
| Utils        | `clean`               | Removes build artifacts                                                 |
| Utils        | `package`             | Packs distributions files in a `.tgz` archive inside the `dist/` folder |
| Utils        | `watch:callback`      | Called every time a build succeeds in watch mode                        |

## Features

- **Server-Side Rendering (SSR)**: BlogList, BlogPost, and AuthorCard components
- **Interactive Islands**: Rating widget and Comments section with client-side hydration
- **Multiple Views**: Default list, cards grid, and full-page post layouts
- **Responsive Design**: Mobile-first CSS with modern styling
- **REST API Integration**: Uses blog-service for ratings and comments
- **GraphQL Support**: Queries for blog content and JCR data
- **Internationalization**: English and French translations
- **Content Types**: Blog, Post, Author, and Comment with proper CND definitions

## Architecture

```
blog-factory/
├── src/
│   ├── components/          # React server and client components
│   │   ├── BlogList/        # List views (default, cards)
│   │   ├── BlogPost/        # Post views (default, fullPage)
│   │   ├── AuthorCard/      # Author profile display
│   │   ├── Rating/          # Interactive rating widget (island)
│   │   └── Comments/        # Comment form and list (island)
│   ├── services/
│   │   └── blogService.ts   # REST API client for blog-service
│   └── graphql/
│       └── blog.graphql     # GraphQL queries for blog data
├── settings/
│   ├── definitions.cnd      # Content type definitions
│   ├── locales/             # i18n translations
│   └── resources/           # Resource bundles
└── BLOG_SERVICE.md          # Integration documentation
```

## Configuration

If you don't use default configuration for the Docker container port and credentials, please modify the provided `.env` file.
