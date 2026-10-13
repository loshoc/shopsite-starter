import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { theme } from "@/lib/theme";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** OFL Fraunces 144pt Medium. See assets/fonts/OFL.txt. */
function loadFraunces(): Promise<Buffer> {
  return readFile(join(process.cwd(), "assets/fonts/Fraunces-Medium.woff"));
}

/** 1200×630 card: Fraunces name, 4px highlight rule, muted subtitle. */
export async function renderOgImage(title: string, subtitle: string) {
  const fraunces = await loadFraunces();
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
            fontFamily: "Fraunces",
            fontSize: 96,
            lineHeight: 1,
            color: theme.fg,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            width: 144,
            height: 4,
            backgroundColor: theme.highlight,
            marginTop: 28,
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 36,
            lineHeight: 1.3,
            color: theme.muted,
            marginTop: 28,
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
          name: "Fraunces",
          data: fraunces,
          style: "normal",
          weight: 500,
        },
      ],
    },
  );
}
