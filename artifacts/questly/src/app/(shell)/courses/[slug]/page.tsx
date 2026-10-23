import type { Metadata } from "next";
import CourseDetailPage from "@/views/CourseDetailPage";
import { getCourseBySlug } from "@/lib/courses";

type Params = { params: Promise<{ slug: string }> };

/**
 * Shared course links should preview properly wherever they are pasted. Only
 * published, public course facts are used — never question content.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  try {
    const course = await getCourseBySlug(slug);
    if (!course || !course.isPublished) {
      return { title: "Course unavailable — QUIZMI" };
    }

    const description =
      course.description?.split("\n")[0]?.slice(0, 180) ||
      `Practise ${course.title} with real computer-based test questions on QUIZMI.`;
    const images = course.coverImageUrl ? [{ url: course.coverImageUrl }] : undefined;

    return {
      title: `${course.title} — QUIZMI`,
      description,
      alternates: { canonical: `/courses/${course.slug}` },
      openGraph: {
        type: "website",
        title: `${course.title} — QUIZMI`,
        description,
        url: `/courses/${course.slug}`,
        images,
      },
      twitter: {
        card: "summary_large_image",
        title: `${course.title} — QUIZMI`,
        description,
        images: images?.map((image) => image.url),
      },
    };
  } catch {
    return { title: "Course — QUIZMI" };
  }
}

export default function Page() {
  return <CourseDetailPage />;
}
