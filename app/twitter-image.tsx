import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0b0b0b",
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        <div style={{ fontSize: 68, marginBottom: 22 }}>PDF Plume</div>
        <div style={{ fontSize: 32, fontWeight: 500, color: "#c9c9c9" }}>
          Edit PDFs in your browser
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
