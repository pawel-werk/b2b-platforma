import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const noindex = process.env.ROBOTS_NOINDEX !== "false";

  if (noindex) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel/", "/b2b/", "/api/", "/pay/"],
    },
  };
}
