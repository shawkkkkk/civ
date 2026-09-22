import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CIV",
    short_name: "CIV",
    description: "Build your army. Build the world.",
    start_url: "/",
    display: "standalone",
    background_color: "#090b0b",
    theme_color: "#090b0b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
