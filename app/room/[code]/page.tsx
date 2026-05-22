import { Metadata } from "next";
import RoomClient from "@/components/RoomClient";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Room ${code}`,
    description: `Real-time online clipboard room ${code}. Share text and files instantly across all your devices.`,
    alternates: {
      canonical: `/room/${code}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const roomCode = code.toUpperCase();

  return <RoomClient code={roomCode} />;
}
