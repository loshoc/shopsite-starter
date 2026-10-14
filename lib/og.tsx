import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { theme } from "@/lib/theme";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** OFL Inter Medium. See assets/fonts/OFL.txt. */
function loadInter(): Promise<Buffer> {
  return readFile(join(process.cwd(), "assets/fonts/Inter-Medium.woff"));
}

/** 1200×630 card: Inter name and muted subtitle on the cool background. */
export async function renderOgImage(title: string, subtitle: string) {
  const inter = await loadInter();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: theme.bg,
          padding: "80px 88px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontSize: 72,
            fontWeight: 500,
            lineHeight: 1.05,
            color: theme.fg,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.35,
            color: theme.muted,
            marginTop: 24,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        {
          name: "Inter",
          data: inter,
          style: "normal",
          weight: 500,
        },
      ],
    },
  );
}
