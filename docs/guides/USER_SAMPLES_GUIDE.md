# User Sound Library Guide

The User Sound Library lets you use your own audio samples in Basilisk. Load samples from your computer or from a hosted URL, then use them in your Strudel patterns.

## Quick Start

1. Click the **waveform icon** (AudioWaveform) in the REPL header to open the User Library panel
2. Choose your source type:
   - **Local**: Select a folder on your computer
   - **URL**: Enter a URL to hosted samples
3. Browse your samples in the directory tree
4. **Single-click** to preview a sample
5. **Double-click** to insert `s("sampleName")` into your code
6. Use the sample in your patterns!

## Source Types

### Local Files (Recommended for Testing)

Best for: Private samples, quick testing, one-off sessions.

1. Click the **Local** tab
2. Click **Choose Folder**
3. Select a folder containing your audio files
4. Grant permission when prompted

**Notes:**
- Samples are loaded for the current session only
- You'll need to re-link after refreshing the page
- Supported in Chrome 86+ and Edge 86+
- Firefox and Safari have limited support

### CDN/URL (Recommended for Sharing)

Best for: Sharing samples, persistence across sessions, collaborating.

1. Click the **URL** tab
2. Enter the base URL where your samples are hosted
3. Click **Load Samples**

Your URL needs a `samples.json` manifest file. Example formats:

**Simple flat list:**
```json
{
  "samples": ["kick.wav", "snare.wav", "hihat.wav"]
}
```

**Nested directory structure:**
```json
{
  "directories": {
    "drums": {
      "samples": ["kick.wav", "snare.wav"],
      "directories": {
        "hihat": {
          "samples": ["open.wav", "closed.wav"]
        }
      }
    },
    "synths": {
      "samples": ["pad.wav", "lead.wav"]
    }
  }
}
```

## Using Your Samples

Once loaded, samples are automatically registered with Strudel. Use them with the `s()` function:

```javascript
// Play a single sample
s("kick")

// Play multiple samples
s("kick snare kick snare").slow(2)

// Mix with built-in samples
s("kick snare").layer(s("hh*4"))

// Add effects
s("mysample").speed(0.5).room(0.8)

// Use in patterns
s("<kick snare> [hh hh]").slow(2)
```

## Supported Audio Formats

- WAV (.wav)
- MP3 (.mp3)
- OGG (.ogg)
- FLAC (.flac)
- AIFF (.aiff)

## Panel Features

### Search
Type in the search box to filter samples by name. The search works across all directories.

### Expand/Collapse
- Click folder icons to expand/collapse individual directories
- Use the chevron buttons in the header to expand/collapse all

### Preview
Single-click any sample to hear a preview. Click another sample to stop the previous preview.

### Insert
Double-click a sample to insert `s("sampleName")` at your cursor position in the editor.

### Unlink
Click the unlink icon to disconnect the current source and clear all loaded samples.

## Hosting Your Samples

### GitHub (Free)

1. Create a repository for your samples
2. Upload your audio files
3. Create a `samples.json` manifest
4. Use the raw URL: `https://raw.githubusercontent.com/username/repo/main`

### Cloudflare R2 (Free tier)

1. Create an R2 bucket
2. Upload samples and manifest
3. Enable public access
4. Use the bucket URL

### Any Static Host

Any web server that serves static files works. Just make sure:
- CORS headers allow cross-origin requests
- The `samples.json` manifest is accessible at `{baseUrl}/samples.json`

## Organizing Your Samples

**Recommended folder structure:**
```
samples/
├── samples.json
├── drums/
│   ├── kick.wav
│   ├── snare.wav
│   └── hihat/
│       ├── open.wav
│       └── closed.wav
├── bass/
│   ├── sub.wav
│   └── growl.wav
└── fx/
    ├── riser.wav
    └── impact.wav
```

**Tips:**
- Use descriptive filenames (sample names come from filenames)
- Avoid spaces in filenames (use underscores or hyphens)
- Keep samples organized by category
- Shorter names are easier to type in patterns

## Troubleshooting

### "File System Access not supported"
Your browser doesn't support the File System Access API. Use Chrome or Edge, or use URL mode instead.

### "Failed to fetch manifest"
- Check that the URL is correct
- Ensure the server has CORS enabled
- Verify `samples.json` exists at `{baseUrl}/samples.json`

### "No audio samples found"
- Check that your audio files have supported extensions
- Verify the manifest lists the correct filenames
- Make sure paths in the manifest match actual file locations

### Sample name conflicts
If you have multiple samples with the same filename in different directories, they'll be registered with unique path-based names.

### Samples not playing
- Check browser console for errors
- Verify the audio file URLs are accessible
- Ensure audio files are valid and not corrupted
