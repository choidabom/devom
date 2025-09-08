import { ReactNode } from "react";
import { InlineLink } from "./InlineLink";

export const tabs = [
  {
    name: "Projects",
    path: "/archive/projects",
    items: {
      label: "projects",
    },
  },
  {
    name: "Photos",
    path: "/archive/photos",
    items: {
      label: "photos",
    },
  },
  {
    name: "Posts",
    path: "/archive/posts",
    items: {
      label: "posts",
    },
  },
  {
    name: "Experiments",
    path: "/archive/experiments",
    items: {
      label: "experiments",
    },
  },
];

interface FileSystemProps {
  children: ReactNode;
  items: {
    amount: number;
    label: string;
  };
  currentPath?: string;
}

export function FileSystem({ children, items, currentPath = "/archive" }: FileSystemProps) {
  const archiveTitle = "Archive";

  return (
    <section className="w-full flex flex-col lg:flex-row lg:pb-4 md:mb-4 mb-12 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-7 lg:pt-8 h-screen">
      <div className="flex items-center mb-6 py-4 sticky top-0 lg:top-14 z-50 lg:hidden bg-white/95 backdrop-blur-xl dark:bg-black/90 border-b border-neutral-200 dark:border-neutral-800 -mx-4 lg:mx-0 px-4 lg:px-0">
        <div className="flex relative items-center">
          <InlineLink link="/archive" className="px-2 -ml-2 text-base">
            {archiveTitle}
          </InlineLink>
          {tabs.find((tab) => tab.path === currentPath) && (
            <>
              <p className="text-neutral-500 dark:text-neutral-500 mx-1.5"> / </p>
              <p className="font-medium px-2 text-neutral-600 dark:text-neutral-400 truncate text-base">{tabs.find((tab) => tab.path === currentPath)?.name}</p>
            </>
          )}
        </div>
      </div>
      <div className="lg:w-80 w-full mb-4 md:mb-8 lg:h-[calc(100vh-2rem)] lg:sticky lg:top-0 lg:overflow-hidden lg:pr-12">
        <h1 className="text-lg sm:text-xl lg:text-2xl line-clamp-2 mb-4 sm:mb-5 lg:mb-6 text-neutral-400 selection:bg-blue-50 selection:text-blue-300 dark:text-neutral-500 dark:selection:bg-blue-950 dark:selection:text-blue-500 font-semibold leading-snug transition-colors group hover:text-neutral-400">
          {archiveTitle}
        </h1>
        <ul className="sticky top-24 mb-8 lg:mb-0 hidden lg:block w-full">
          <li className="w-full flex items-center justify-between">
            <a
              href="/archive"
              className={
                "underline-offset-2 font-medium group w-full flex items-center justify-between py-2 px-2 rounded-md transition-colors " +
                (currentPath === "/archive"
                  ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
                  : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900")
              }
            >
              <span className="group-hover:underline">{archiveTitle}</span>
              <span className={"no-underline font-mono font-medium " + (currentPath === "/archive" ? "text-black dark:text-white" : "text-neutral-300 dark:text-neutral-600")}>
                /
              </span>
            </a>
          </li>
          {tabs.map((tab, index) => (
            <li key={index}>
              <a
                href={tab.path}
                className={
                  "underline-offset-2 font-medium group pl-6 w-full flex items-center justify-between py-2 px-2 rounded-md transition-colors " +
                  (currentPath === tab.path
                    ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white"
                    : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900")
                }
              >
                <span className="group-hover:underline">{tab.name}</span>
                <span className={"no-underline font-mono font-medium " + (currentPath === tab.path ? "text-black dark:text-white" : "text-neutral-300 dark:text-neutral-600")}>
                  {`/${tab.items.label}`}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 bg-neutral-100 p-6 sm:p-8 md:p-10 lg:p-12 h-[calc(100vh-4rem)] dark:bg-[#101010] rounded-lg lg:rounded-none overflow-y-auto">{children}</div>
    </section>
  );
}
