// app/page.tsx or app/page.jsx
"use client"
import dynamic from "next/dynamic";
import HomePageComponent from "../components/HomePage";
const CornerstoneViewer = dynamic(() => import("../components/HomePage"), {
  ssr: false,
});

export default function HomePage() {
  return <HomePageComponent />;
}
