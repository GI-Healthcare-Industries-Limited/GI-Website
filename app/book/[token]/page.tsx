import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InterviewBookingForm } from "../booking-form";
export const metadata: Metadata = {
  title: "Book your conversation",
  robots: { index: false, follow: false, nocache: true },
};
export default async function BookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  return <InterviewBookingForm token={token} />;
}
