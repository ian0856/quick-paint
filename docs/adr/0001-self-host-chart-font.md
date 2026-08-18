# Self-host the Chart Image font

Quick Paint uses the version-locked `@fontsource-variable/noto-sans-sc@5.3.0` assets for both chart preview and Chart Image rendering, allowing the browser to load only the required pre-generated `unicode-range` fragments and using weights 400 and 700. This adds roughly 4.9 MB of SIL OFL 1.1 licensed assets, but avoids operating-system font differences changing text layout, clipping, and exported pixels; export gives required font loading at most three seconds within a single five-second end-to-end deadline and fails instead of silently falling back.
