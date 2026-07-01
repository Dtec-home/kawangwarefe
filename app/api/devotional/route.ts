import { NextResponse } from "next/server";
import { load } from "cheerio";

export async function GET() {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    // e.g., https://whiteestate.org/devotional/cc/03_17/
    const url = `https://whiteestate.org/devotional/cc/${month}_${day}/`;

    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      throw new Error(`Failed to fetch from White Estate: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);

    const title = $("h1.page-title.pull-left").text().trim();

    const paragraphs: string[] = [];
    $(".egw_content_wrapper").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) {
        paragraphs.push(text);
      }
    });

    let scriptureReference = "";
    if (paragraphs.length > 0) {
      scriptureReference = paragraphs[0]; // the bible verse reference
    }

    // The rest of the content is the actual reading.
    const content = paragraphs.slice(1).join("\n\n");

    const devotional = {
      id: `egw-${month}-${day}`,
      title: title || `Devotional for ${today.toLocaleDateString()}`,
      content: content,
      author: "Ellen G. White",
      scriptureReference: scriptureReference,
      publishDate: today.toISOString(),
      isFeatured: true,
      // optional image
      featuredImageUrl: "",
    };

    return NextResponse.json({ devotional });
  } catch (error) {
    console.error("Error scraping daily devotional:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily devotional from EGW Estate", message: String(error) },
      { status: 500 }
    );
  }
}
