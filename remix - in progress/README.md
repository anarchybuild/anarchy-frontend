# Style Fusion - AI Image Generator

Style Fusion is a dynamic web application that allows users to reimagine their photos in any style they can imagine. By leveraging the power of Google's Gemini API, users can upload a portrait, provide a creative theme (e.g., "cyberpunk," "watercolor painting," "viking warrior"), and generate a unique, AI-powered image.

The application is built with React, TypeScript, and Tailwind CSS, and features a fluid, interactive user experience with animations powered by Framer Motion.

## Features

- **Image Upload**: Users can upload a portrait image (PNG, JPG, WEBP) as the base for generation.
- **Dynamic Theming**: An open text input allows users to specify any theme, offering limitless creative possibilities.
- **AI Image Generation**: Integrates with the `gemini-2.5-flash-image-preview` model to generate high-quality, stylized images.
- **Interactive Gallery**: Generated images are displayed in a responsive, animated gallery.
- **Image Regeneration**: Users can regenerate any image with a single click if the result isn't perfect.
- **Individual Downloads**: Each generated image can be downloaded directly.
- **Album Creation**: A composite "album page" featuring all successfully generated images can be created and downloaded as a single JPEG file.
- **Robust Error Handling**: The application includes a retry mechanism for transient network errors and a fallback prompt system for potentially blocked user prompts.

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini 2.5 Flash Image Preview
- **AI SDK**: `@google/genai`
- **Animation**: Framer Motion
- **Dependencies**: Served via `esm.sh` through an `importmap` in `index.html`.

---

## Project Structure

The codebase is organized into components, services, and utility libraries for a clean and maintainable structure.

```
.
├── index.html            # The main HTML entry point, includes importmap for dependencies.
├── index.tsx             # The React application root that mounts the App component.
├── App.tsx               # The main application component, manages state and UI logic.
├── services/
│   └── geminiService.ts  # Handles all communication with the Gemini API.
├── components/
│   ├── PolaroidCard.tsx  # A versatile card for displaying images (uploaded, pending, generated).
│   ├── Footer.tsx        # The application footer.
│   └── ui/
│       └── draggable-card.tsx # Framer Motion component for draggable, physics-based cards.
├── lib/
│   ├── albumUtils.ts     # Logic for generating the downloadable album page via HTML Canvas.
│   └── utils.ts          # Utility functions (e.g., `cn` for classnames).
└── README.md             # This file.
```

### File Breakdown

- **`App.tsx`**: This is the core of the application. It uses React's `useState` hook to manage the application's state, including the uploaded image, the list of generated images (each with its own status: `pending`, `done`, or `error`), and user input. It orchestrates the entire user flow from uploading an image to generating and managing themed versions.

- **`services/geminiService.ts`**: This module isolates all logic related to the Gemini API.
  - It initializes the `GoogleGenAI` client.
  - The `generateStyledImage` function is the primary export. It takes an image and a prompt, handles the conversion to base64, and constructs the API request.
  - **Important**: It features a robust error-handling mechanism. It automatically retries API calls on 500-series errors and implements a fallback prompt system. If the initial user-provided prompt is blocked (often resulting in a non-image response), the service attempts a second, safer, more generic prompt to increase the likelihood of a successful generation.

- **`components/PolaroidCard.tsx`**: (Renamed from a previous version, but the filename persists). This is a multi-state component that displays an image. It can show:
  - A placeholder for the initial file upload.
  - A loading spinner while an image is being generated.
  - The successfully generated image with a "developing" animation effect.
  - An error state if generation fails.
  - Interactive buttons for regenerating or downloading the image.

- **`components/ui/draggable-card.tsx`**: A UI component powered by Framer Motion that wraps `PolaroidCard`. It adds a 3D perspective effect on hover and allows the card to be dragged around with realistic physics. The "shake to regenerate" feature is implemented here by monitoring drag velocity.

- **`lib/albumUtils.ts`**: A powerful utility that uses the **HTML Canvas API** to create a custom image from scratch.
  - It defines a high-resolution canvas.
  - It draws a background, titles, and then programmatically loads each generated image.
  - It arranges the images in a grid, applying slight random rotations and shadows to mimic a scrapbook/album feel.
  - Finally, it exports the entire canvas as a high-quality JPEG data URL, which is then used for the download link.

---

## Getting Started

This project is designed to run directly in the browser without a local build step, thanks to the use of an `importmap` and `esm.sh`.

### Prerequisites

1.  **API Key**: You must have a Google Gemini API key.
2.  **Environment Variable**: The application is hardcoded to look for the API key in `process.env.API_KEY`. You will need to ensure this is available in the environment where you serve the files.

### Running the App

1.  **Set up the API Key**:
    - For local development, you can use a tool like `vite` which supports environment variables, or manually replace `process.env.API_KEY` in `services/geminiService.ts` (not recommended for production).
    - When deploying, set the `API_KEY` as an environment variable in your hosting provider's settings.

2.  **Serve the Files**:
    - You can use any simple static file server. For example, with Node.js installed:
      ```bash
      # Install the server globally
      npm install -g serve

      # Serve the project directory
      serve .
      ```
    - Open your browser to the local address provided by the server (e.g., `http://localhost:3000`).

## How to Customize ("Remix")

This app is a great foundation for further experimentation with the Gemini API.

- **Tweak the Prompts**: Modify the prompt strings in `App.tsx` and `services/geminiService.ts` to change the base style or the fallback behavior.
- **Change the Model**: Edit `services/geminiService.ts` to use a different Gemini model.
- **Customize the Album**: The `lib/albumUtils.ts` file is a self-contained canvas workshop. You can change the layout, fonts, backgrounds, and branding of the downloaded album page.
- **Add More Controls**: Extend the UI in `App.tsx` to include more generation parameters, such as negative prompts, aspect ratios, or quality settings that can be passed to the Gemini API.
