import { Metadata } from "next";
import RoomClient from "@/components/RoomClient";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Room ${code} — ClipSync`,
    description: `Real-time clipboard room ${code}. Share clips instantly across all your devices.`,
  };
}

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const roomCode = code.toUpperCase();

  return <RoomClient code={roomCode} />;
}
