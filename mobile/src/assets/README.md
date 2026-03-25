# HiRhub Mobile Assets

This directory contains placeholder assets for the mobile application.

## Required Assets

You need to add the following image files:

1. **icon.png** (512x512) - App icon
2. **splash.png** (1024x768) - Splash screen image
3. **adaptive-icon.png** (1024x1024) - Android adaptive icon
4. **favicon.png** (48x48) - Web favicon

## Creating Placeholder Assets

For development, you can create simple placeholder images:

### Option 1: Using Canva
1. Go to canva.com
2. Create designs with dimensions above
3. Use purple/blue gradient theme (#667eea to #764ba2)
4. Add "HiRhub" text or rocket emoji 🚀

### Option 2: Using Online Tools
- **icon**: https://www.canva.com/icons/
- **splash**: https://www.canva.com/banners/
- Generate gradient backgrounds

### Option 3: Quick Placeholder
Create a simple colored square using any image editor with:
- Background: Linear gradient from #667eea to #764ba2
- Center: White rocket emoji or"HR" text

## Asset Guidelines

### iOS Icon
- 512x512 PNG
- No transparency
- Rounded corners added automatically

### Android Adaptive Icon
- 1024x1024 PNG
- Safe zone in center 66%
- Transparency supported

### Splash Screen
- 1024x768 PNG
- Landscape orientation
- Brand centered

## After Adding Assets

Run:
```bash
cd mobile
npx expo start -c
```

The `-c` flag clears cache and reloads assets.
