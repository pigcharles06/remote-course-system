import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Distance Learning Courses <br /> Application & Review System
        </h1>
        <p className="text-lg leading-8 text-gray-600">
          National Yang Ming Chiao Tung University
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
