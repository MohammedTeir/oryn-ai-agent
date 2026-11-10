# IBM Plex Sans Arabic candidate

The owner approved IBM Plex Sans Arabic for further testing on 2026-11-10; final visual, RTL and accessibility acceptance remains open. These exact version 1.101 font files and `OFL.txt` are from the [Google Fonts snapshot at commit 702964cf46bd1bf33d0745d24bbaac33edf8b8af](https://github.com/google/fonts/tree/702964cf46bd1bf33d0745d24bbaac33edf8b8af/ofl/ibmplexsansarabic). See the adjacent SIL Open Font License 1.1, copyright IBM Corp. and reserved font name Plex. The Android config plugin includes the license in the APK; the build verifies hashes of each font and the license.

The family is used as a candidate in the shell's regular and semibold UI text. The temporary ORYN header wordmark and error-recovery fallback retain system typography. No approved brand artwork has been modified. Android rendering, fallback, 200% scaling and TalkBack are not verified by a cloud build.

On 2026-11-10, a local `fontTools` character-map inspection checked the 146 string literals in `milestone1/strings.ts`: all non-whitespace characters were present in each of the three candidate files. This does not establish shaping, layout, or complete Unicode coverage on Android. See [the design review](../../../../docs/design/milestone-1-ai-agent-rtl-review.md) for provenance and the owner's limited approval.
