interface ImportMetaEnv {
  VITE_GRAPHQL_URL: string;
  /** Optional passphrase that gates the developer simulator page; empty = no gate. */
  VITE_SIMULATOR_KEY?: string;
  /** Public project key of the Black Badge Studio feedback widget; empty = widget not loaded. */
  VITE_FEEDBACK_WIDGET_KEY?: string;
  /** Override for the feedback widget script URL (defaults to app.blackbadge.studio). */
  VITE_FEEDBACK_WIDGET_SCRIPT?: string;
  /** Base URL serving /tests/scenarios.json and /tests/runner.mjs; defaults to the API base. */
  VITE_TESTS_BASE?: string;
  /** Version reported to the feedback widget; falls back to the build time. */
  VITE_APP_VERSION?: string;
}
