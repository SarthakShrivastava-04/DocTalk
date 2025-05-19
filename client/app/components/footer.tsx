import { Logo } from "@/app/components/logo";
import Link from "next/link";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

const links = [
  {
    title: "About",
    href: "#",
  },
  {
    title: "Help",
    href: "#",
  },
  {
    title: "Contact",
    href: "#",
  },
  {
    title: "Privacy",
    href: "#",
  },
];

export default function FooterSection() {
  return (
    <footer className="border-b bg-zinc-950 pt-12 dark:bg-transparent">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex gap-12 justify-between">
          <div className="md:col-span-2">
            <Link href="/" aria-label="go home" className="block size-fit">
              <Logo />
            </Link>
          </div>

          <div className="flex gap-4 md:gap-12 sm:gap-8">
            {links.map((link, index) => (
              <div key={index} className="space-y-8 text-sm">
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-primary block duration-150"
                >
                  <span>{link.title}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t py-6">
          <span className="text-muted-foreground order-last block text-center text-sm md:order-first">
            © {new Date().getFullYear()} DocTalk, All rights reserved
          </span>
          <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
            <span className="text-muted-foreground order-last block text-center text-sm md:order-first">Made by Sarthak</span>
            <Link
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground hover:text-primary block"
            >
              <GitHubLogoIcon className="h-5 w-5" />
            </Link>
        
          </div>
        </div>
      </div>
    </footer>
  );
}
