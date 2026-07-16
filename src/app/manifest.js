export default function manifest() {
    return {
        name: "Torre Fuerte",
        short_name: "TorreFuerte",
        description: "Plataforma de distribución de torres fuertes",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#6366f1",
        // Íconos usando solo el favicon existente
        icons: [
            {
                src: "/favicon.ico",
                sizes: "64x64 32x32 24x24 16x16",
                type: "image/x-icon"
            },
            {
                src: "/vercel.svg",
                sizes: "any",
                type: "image/svg+xml"
            }
        ],
        categories: ["business", "productivity"],
        lang: "es",
        dir: "ltr",
        prefer_related_applications: false
    };
}