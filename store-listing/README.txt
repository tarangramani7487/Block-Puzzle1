Block Puzzle — Store Listing Assets
====================================

This folder contains ASO-optimised copy for both Google Play and the Apple App
Store. Each field has its own file so you can copy-paste into Play Console /
App Store Connect without touching the formatting.

Folder layout
-------------
google-play/
  app-name.txt            Google Play "App name" (max 30 chars)
  short-description.txt   Google Play "Short description" (max 80 chars)
  full-description.txt    Google Play "Full description" (max 4000 chars)
  release-notes.txt       Google Play "What's new" (max 500 chars)

app-store/
  app-name.txt            App Store "App Name" (max 30 chars)
  subtitle.txt            App Store "Subtitle" (max 30 chars)
  promotional-text.txt    App Store "Promotional Text" (max 170 chars)
  description.txt         App Store "Description" (max 4000 chars)
  keywords.txt            App Store "Keywords" field (max 100 chars, comma-sep)
  release-notes.txt       App Store "What's New in This Version" (max 4000)
  copyright.txt           App Store "Copyright" field (shown on product page)

keyword-research.txt      Target keyword list, ranked by priority. Reference
                          only — not pasted anywhere.
category-and-ratings.txt  Suggested category, content rating, and tags.


ASO cheat sheet (keep in mind when editing)
-------------------------------------------
Google Play
  - Indexes the FULL description. Use target keywords naturally 2–4 times each.
  - App name + short description have the strongest ranking weight.
  - Keep short description benefit-first — it's shown above the fold.
  - "What's new" is indexed too; include a key feature phrase in each release.

App Store (iOS)
  - Does NOT index the long description. Rankings come from app name,
    subtitle, keywords field, and in-app purchase names.
  - Keywords field is 100 chars, comma-separated, no spaces, no plurals of
    singular words you already included (Apple handles stemming).
  - Never repeat a word already in the app name or subtitle in keywords.
  - Promotional text can be updated without a new build — use it for events.


Localisation
------------
Only English (US) is included here. Once the app has traction, Hindi, Spanish,
Portuguese, and Indonesian are high-ROI translations for a casual puzzle game.
