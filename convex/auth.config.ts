const clerkFrontendApiUrl = process.env.CLERK_FRONTEND_API_URL;

const authConfig = {
  providers: clerkFrontendApiUrl
    ? [
        {
          domain: clerkFrontendApiUrl,
          applicationID: "convex",
        },
      ]
    : [],
};

export default authConfig;
