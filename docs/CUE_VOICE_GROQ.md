# CUE voice and text: Groq

14 October 2026. Candidate Beta 0.0.5, PR96 preview and staging only.

The authenticated smart-capture endpoint retains workspace/role/artist checks and the existing monthly allowance. It uses the private GROQ_API_KEY, Whisper Large V3 Turbo for audio, and GPT OSS 20B for structured extraction. Optional overrides are CUEBOOKER_GROQ_TRANSCRIPTION_MODEL and CUEBOOKER_GROQ_CAPTURE_MODEL. Old OpenAI overrides do not control the adapter. Credentials never reach the browser. No billing tier, quota increase or provider purchase is performed; confirm free-plan settings in the owner's account. The mailbox classifier code is unchanged and shares the extraction model quota.

Each stage makes one bounded provider request, without retries or alternate-model attempts. The server validates the complete JSON contract. Audio and transcripts are not stored or logged by this endpoint. Human review/apply/create remains required; AI never sends or confirms a booking.

If extraction fails or returns429 after transcription, the response preserves the authorized caller's transcript. The client derives basic fields locally and warns that AI is unavailable. No new text AI request follows a429. If transcription itself is rejected, browser dictation is the fallback; if absent, report failure and allow typed input. The same applies when the existing monthly quota rejects before transcription. Never claim that text was recovered without a transcript.

Stop waits at most1500ms for final browser dictation; interim text can be preserved. Closing CUE cancels submission and releases tracks. Date/time punctuation never joins the following fee in local extraction.

Regression tests use a compiled Vue component and actual Edge handler with mocked transport. They cover stop/cancel, Safari MIME, structured output,429 at both stages, invalid output, text, quota and viewer rejection. They consume no live provider quota and do not prove microphone/provider accuracy.

Rollout requires the paired frontend and smart-capture staging source, retaining existing JWT/auth configuration. Verify actual Safari/iPhone voice, dates, venues, fees and one agency capture. Production, Google/privacy/provider-retention and release gates remain separate. Rollback restores the prior frontend and smart-capture v26 source; no schema change occurred.

References: https://console.groq.com/docs/speech-to-text , https://console.groq.com/docs/structured-outputs , https://console.groq.com/docs/rate-limits .
