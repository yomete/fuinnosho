import Link from "next/link";

export function Footer() {
  return (
    <footer className="fixed bottom-0 w-full py-4 bg-transparent">
      <div className="container flex justify-center text-sm text-muted-foreground">
        Made by{" "}
        <Link
          href="https://www.yomieluwan.de"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-medium hover:text-foreground transition-colors"
        >
          Yomi Eluwande
        </Link>
      </div>
    </footer>
  );
}
