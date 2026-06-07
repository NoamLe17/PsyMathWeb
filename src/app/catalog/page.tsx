"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CourseCatalog from "@/components/CourseCatalog";
import CourseCheckout from "@/components/CourseCheckout";

export default function CatalogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<"catalog" | "checkout">("catalog");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  if (currentView === "checkout" && selectedCourse) {
    return (
      <CourseCheckout
        setCurrentView={(view: string) => {
          if (view === "catalog") setCurrentView("catalog");
          else if (view === "my-courses") router.push("/dashboard");
          else setCurrentView(view as any);
        }}
        course={selectedCourse}
        user={user}
      />
    );
  }

  return (
    <CourseCatalog
      setCurrentView={(view: string) => {
        if (view === "checkout") setCurrentView("checkout");
        else if (view === "my-courses") router.push("/dashboard");
      }}
      setSelectedCourse={setSelectedCourse}
    />
  );
}
