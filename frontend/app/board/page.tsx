import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import PostAccessNote from "@/components/PostAccessNote";

type BoardPost = {
  id: number;
  category: string;
  title: string;
  slug: string;
  pretty_slug: string;
  views: number;
  created_at: string;
};

type BoardResponse = {
  results: BoardPost[];
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  sort: string;
  category: string;
};

type SearchParams = Promise<{
  sort?: string;
  category?: string;
  page?: string;
}>;

async function getPosts(sort: string, category: string, page: number): Promise<BoardResponse> {
  try {
    const params = new URLSearchParams({
      sort,
      category,
      page: String(page),
    });

    const res = await fetch(`https://oyasumi-vi2k.onrender.com//api/board/?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        results: [],
        page: 1,
        page_size: 10,
        total_count: 0,
        total_pages: 1,
        sort: "latest",
        category: "all",
      };
    }

    return res.json();
  } catch {
    return {
      results: [],
      page: 1,
      page_size: 10,
      total_count: 0,
      total_pages: 1,
      sort: "latest",
      category: "all",
    };
  }
}

function formatDate(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `${day}${month}${year}`;
}

function categoryStyle(cat: string) {
  switch (cat) {
    case "news":
      return "text-[#7da6c6]";
    case "blog":
      return "text-[#8fb39a]";
    case "jobs":
      return "text-[#c78fa0]";
    case "promo":
      return "text-[#b49ac8]";
    default:
      return "text-[#8e8a84]";
  }
}

function categoryLabel(cat: string) {
  switch (cat) {
    case "news":
      return "News";
    case "blog":
      return "Blog";
    case "jobs":
      return "Jobs";
    case "promo":
      return "Promo";
    default:
      return cat;
  }
}

function buildHref(sort: string, category: string, page: number) {
  const params = new URLSearchParams();

  if (sort !== "latest") params.set("sort", sort);
  if (category !== "all") params.set("category", category);
  if (page !== 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `/board?${qs}` : "/board";
}

function controlClass(active: boolean, category?: string) {
  const base = active
    ? "underline underline-offset-4"
    : "transition hover:underline";

  const color = categoryStyle(category || "all");

  return active
    ? `${color} ${base}`
    : `text-[#7d766e] hover:${color.replace("text-", "text-")} ${base}`;
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const sort = sp.sort === "views" ? "views" : "latest";
  const category =
    sp.category && ["all", "news", "blog", "jobs", "promo"].includes(sp.category)
      ? sp.category
      : "all";
  const page = sp.page ? Math.max(1, Number(sp.page) || 1) : 1;

  const data = await getPosts(sort, category, page);
  const posts = data.results ?? [];

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#5f5a54]">
      <div className="mx-auto w-[92%] max-w-5xl py-6 md:w-[86%] md:py-10">


        <div className="mt-4 mb-5 flex flex-col gap-3 border-b border-[#ddd6cc] pb-3 text-[12px] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href={buildHref("latest", category, 1)} className={controlClass(sort === "latest")}>
              Latest
            </Link>
            <Link href={buildHref("views", category, 1)} className={controlClass(sort === "views")}>
              Views
            </Link>

            <span className="text-[#c2bcb4]">|</span>

            <Link href={buildHref(sort, "all", 1)} className={controlClass(category === "all")}>
              All
            </Link>
            <Link href={buildHref(sort, "news", 1)} className={controlClass(category === "news", "news")}>
              News
            </Link>
            <Link href={buildHref(sort, "blog", 1)} className={controlClass(category === "blog", "blog")}>
              Blog
            </Link>
            <Link href={buildHref(sort, "jobs", 1)} className={controlClass(category === "jobs", "jobs")}>
              Jobs
            </Link>
            <Link href={buildHref(sort, "promo", 1)} className={controlClass(category === "promo", "promo")}>
              Promo
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="py-10 text-sm text-[#948d85]">No posts yet.</div>
        ) : (
          <div>
            {posts.map((post) => (
              <div
                key={post.id}
                className="border-b border-[#e4ddd4] py-3 transition hover:bg-[#f5f1ea] md:py-4"
              >
                <div className="md:hidden">
                  <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                    <span className={categoryStyle(post.category)}>
                      {categoryLabel(post.category)}
                    </span>

                    <div className="flex items-center gap-2 text-[#928b83]">
                      <span>{formatDate(post.created_at)}</span>
                      <span>·</span>
                      <span>{post.views}</span>
                    </div>
                  </div>

                  <Link
                    href={`/board/${post.pretty_slug}`}
                    className="block text-[13px] leading-[1.4] tracking-[-0.01em] text-[#57514b] hover:text-[#2f2b28] hover:underline"
                  >
                    {post.title}
                  </Link>
                </div>

                <div className="hidden grid-cols-12 items-center text-[13px] md:grid">
                  <div className={`col-span-2 ${categoryStyle(post.category)}`}>
                    {categoryLabel(post.category)}
                  </div>

                  <div className="col-span-6 pr-6">
                    <Link
                      href={`/board/${post.pretty_slug}`}
                      className="block truncate text-[14px] tracking-[-0.01em] text-[#57514b] transition hover:text-[#2f2b28] hover:underline"
                      title={post.title}
                    >
                      {post.title}
                    </Link>
                  </div>

                  <div className="col-span-2 text-[12px] text-[#928b83]">
                    {formatDate(post.created_at)}
                  </div>

                  <div className="col-span-2 text-right text-[12px] text-[#928b83]">
                    {post.views}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-center gap-4 py-6 text-[12px] text-[#7d766e]">
              {data.page > 1 ? (
                <Link
                  href={buildHref(sort, category, data.page - 1)}
                  className="hover:text-[#5a544e] hover:underline"
                >
                  Prev
                </Link>
              ) : (
                <span className="opacity-40">Prev</span>
              )}

              <span>
                {data.page} / {data.total_pages}
              </span>

              {data.page < data.total_pages ? (
                <Link
                  href={buildHref(sort, category, data.page + 1)}
                  className="hover:text-[#5a544e] hover:underline"
                >
                  Next
                </Link>
              ) : (
                <span className="opacity-40">Next</span>
              )}
            </div>
          </div>
        )}
      </div>
 <PostAccessNote />
    </main>
  );
}