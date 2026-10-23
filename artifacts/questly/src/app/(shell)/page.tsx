import HomePage from "@/views/HomePage";
import { getOptionalSessionUser } from "@/lib/auth";
import { listPublishedCourses, listSubjects } from "@/lib/courses";
import type { CourseSummary } from "@/lib/types";

// Course access and purchase state depend on the signed-in learner.
export const dynamic = "force-dynamic";

export default async function Page() {
  let initialCourses: CourseSummary[] = [];
  let initialSubjects: string[] = [];
  let initialError: string | null = null;

  try {
    const user = await getOptionalSessionUser();
    [initialCourses, initialSubjects] = await Promise.all([
      listPublishedCourses({ limit: 12 }, user?.id ?? null),
      listSubjects(),
    ]);
  } catch (error) {
    console.error("Homepage course load failed", error);
    initialError = "Courses could not be loaded right now.";
  }

  return (
    <HomePage
      initialCourses={initialCourses}
      initialSubjects={initialSubjects}
      initialError={initialError}
    />
  );
}
