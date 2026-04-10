// src/app/api/timetable/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db/prisma";
import { parseFromPDF, parseFromImage, parseFromText } from "@/lib/parser/academicParser";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawText = formData.get("text") as string | null;
    const name = (formData.get("name") as string) || "My Timetable";

    let periods;

    if (rawText) {
      periods = await parseFromText(rawText);
    } else if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === "application/pdf") {
        periods = await parseFromPDF(buffer);
      } else if (file.type.startsWith("image/")) {
        periods = await parseFromImage(buffer);
      } else {
        // Treat as text file
        periods = await parseFromText(buffer.toString("utf-8"));
      }
    } else {
      return NextResponse.json({ error: "No file or text provided" }, { status: 400 });
    }

    const rawTextContent = rawText || (file ? `Uploaded: ${file.name}` : "");

    const timetable = await prisma.academicTimetable.upsert({
      where: { id: session.user.id + "-default" },
      update: { name, rawText: rawTextContent, periods, updatedAt: new Date() },
      create: {
        id: session.user.id + "-default",
        userId: session.user.id,
        name,
        rawText: rawTextContent,
        periods,
      },
    });

    return NextResponse.json({ timetable, periodsFound: periods.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to parse timetable" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const timetable = await prisma.academicTimetable.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ timetable });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
