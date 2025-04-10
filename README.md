# Rando

Rando is a fun and interactive web application that randomizes lists with engaging animations. It's designed to be visually appealing while providing practical functionality for randomizing items.

## Features

### Core Functionality
- **List Randomization**: Shuffle your list items with a click of a button
- **URL-Based Lists**: Items are stored in the URL for easy sharing and bookmarking
- **Clipboard Integration**: Press Ctrl+C to copy the randomized list to clipboard
- **Auto-Copy**: Optionally enable automatic copying to clipboard after randomization

### User Interface
- **Card Grid Layout**: Items displayed as a grid of attractive cards
- **Responsive Design**: Works on desktop and mobile devices
- **Drag and Drop**: Reorder cards manually by dragging them
- **Visual Feedback**: Notifications when items are copied to clipboard

### Customization
- **Sticky Items**: Mark specific items as "sticky" to keep them in place during randomization
- **Custom Templates**: Format how items appear when copied to clipboard
- **Animation Selection**: Choose which animations to include in the random pool
- **Tab Switch Animation**: Optional animation when returning to the tab

### Animations
Rando includes 11 different animations for shuffling:
- Fly and Spin
- Elastic Bounce
- Swirl Vortex
- Matrix Rain
- Chain Juggle
- Swing Chain
- Tornado
- Fireworks
- Melt
- Roller Coaster
- Splash

## Usage

### Basic Usage
1. Visit the application URL
2. Enter your list items in the settings panel
3. Click the "Randomize" button to shuffle the items
4. Press Ctrl+C to copy the randomized list to clipboard

### URL Parameters
The application uses URL parameters to store:
- List items
- Sticky items
- Template format

This allows you to share your list configuration by simply sharing the URL.

### Settings Panel
Access the settings panel by clicking the gear icon to:
- Edit your list items
- Set custom templates for clipboard export
- Toggle which items should be "sticky"
- Configure animation preferences
- Enable/disable auto-copy and tab switch animations

### Templates
Use templates to format how items appear when copied to clipboard:
- `{item}` - The basic item text
- `{pad:N}` - Add padding spaces to make items a specific length

Example: `{pad:10}{item}` will ensure each item has at least 10 characters by adding spaces.

## Technical Details

### Built With
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [GSAP](https://greensock.com/gsap/) - Animation library
- [TailwindCSS](https://tailwindcss.com/) - Styling

### Development
To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License
This project is open source and available under the [MIT License](LICENSE).
