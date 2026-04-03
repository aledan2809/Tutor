export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason) => {
      console.error("[unhandledRejection]", reason);
      // Log but don't crash - let the process continue handling requests
    });

    process.on("uncaughtException", (error) => {
      console.error("[uncaughtException]", error);
      // For fatal errors (e.g., ECONNREFUSED on DB), exit gracefully
      if (
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("ENOTFOUND")
      ) {
        console.error("[FATAL] Critical service unavailable, shutting down...");
        process.exit(1);
      }
    });
  }
}
