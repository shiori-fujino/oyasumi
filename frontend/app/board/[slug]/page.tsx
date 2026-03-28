import Link from "next/link";
import { API_BASE } from "@/lib/api";

type BoardDetail = {
  id: number;
  author: number;
  author_username: string;
  category: string;
  title: string;
  slug: string;
  pretty_slug: string;
  body: string;
  views: number;
  created_at: string;
};

async function getPost(slug: string): Promise<BoardDetail | null> {
  const res = await fetch(`${API_BASE}/api/board/${slug}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
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

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#5f5a54]">
        <div className="mx-auto w-[92%] max-w-5xl py-6 md:w-[86%] md:py-10">
          <div className="mb-8">
            <Link
              href="/board"
              className="block w-fit text-[12px] text-[#8e8a84]"
            >
              ← Back to board
            </Link>
          </div>

          <p className="text-sm text-[#948d85]">Post not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#5f5a54]">
      <div className="mx-auto w-[92%] max-w-5xl py-6 md:w-[86%] md:py-10">
        <div className="mb-8">
          <Link
            href="/board"
            className="block w-fit text-[12px] text-[#8e8a84]"
          >
            &lt;&lt; BACK TO BOARD
          </Link>
        </div>

        <article>
          <h1 className="text-[30px] font-medium leading-[1.18] tracking-[-0.02em] text-[#4f4a45] md:text-[40px]">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#8e8a84]">
            <span className={categoryStyle(post.category)}>
              {categoryLabel(post.category)}
            </span>

            <span className="text-[#5f5a54]">{post.author_username}</span>

            <span>{formatDate(post.created_at)}</span>

            <span className="text-[#b5aea6]">{post.views} views</span>
          </div>

          <div className="mt-8 whitespace-pre-wrap text-[16px] leading-8 text-[#5b5650]">
            {post.body}
          </div>
        </article>
      </div>
    </main>
  );
}