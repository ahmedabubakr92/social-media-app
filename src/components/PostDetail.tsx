import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import type { Post } from "./PostList";
import LikeButton from "./LikeButton";

interface Props {
  postId: number;
}

async function fetchPost(id: number): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export default function PostDetail({ postId }: Props) {
  const {
    data: post,
    isLoading,
    error,
  } = useQuery<Post, Error>({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
  });

  if (isLoading) return <div>Loading post...</div>;

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-bold mb-6 text-center bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{post?.title}</h2>
      <img 
        src={post?.image_url} 
        alt={post?.title}
        className="mt-4 rounded object-cover w-full h-64"
      />
      <p className="text-gray-400">
        {post?.content}
      </p>
      <p className="text-gray-500 text-sm">
        Posted on:{" "}
        {post?.created_at
          ? new Date(post.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Unknown date"}
      </p>

      <LikeButton postId={postId} />
    </div>
  );
}
