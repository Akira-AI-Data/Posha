# Posha Internal Testing Steps

## Release File

Upload:

android/app/build/outputs/bundle/release/app-release.aab

## Steps

1. Open Google Play Console.
2. Select Posha.
3. Go to Testing > Internal testing.
4. Create a new release.
5. Upload app-release.aab.
6. Add release name: Posha 1.0 internal test.
7. Add release notes:

Initial internal test for Posha Android. Includes meal logging, AI photo meal analysis, barcode flow, weekly meal planning, shopping sync, pantry basics, and dashboard tracking.

8. Add testers by email.
9. Save and roll out to internal testing.
10. Copy the internal testing opt-in link and share it with testers.

## Recommended Tester Emails

rahulpagidi025@gmail.com

## Watch For

- Google login works on Android WebView.
- Photo upload opens camera/gallery.
- AI photo meal analysis returns structured result.
- Barcode photo fallback works.
- Meal plan and shopping sync work after login.
- Paid route gates behave correctly.
