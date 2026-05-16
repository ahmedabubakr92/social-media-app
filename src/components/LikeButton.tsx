import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

interface Props {
  postId: number;
}

interface Vote {
  id: number;
  post_id: number;
  user_id: string;
  vote: number;
}

async function fetchUserVote(
  postId: number,
  userId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("votes")
    .select("vote")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch vote for post ${postId}: ${error.message}`);
  return data?.vote ?? null;
}

async function vote(voteValue: number, postId: number, userId: string) {
  const { data: existingVote, error: readError } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw new Error(`Failed to read existing vote: ${readError.message}`);

  if (existingVote && existingVote.vote === voteValue) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("id", existingVote.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("votes")
      .upsert(
        { post_id: postId, user_id: userId, vote: voteValue },
        { onConflict: "post_id,user_id" }
      );

    if (error) throw new Error(error.message);
  }
}

async function fetchVotes(postId: number): Promise<Vote[]> {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId);

  if (error) throw new Error(error.message);
  return data as Vote[];
}

export default function LikeButton({ postId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: votes, error, isLoading } = useQuery<Vote[], Error>({
    queryKey: ["votes", postId],
    queryFn: () => fetchVotes(postId),
    refetchInterval: 5000
  });

  const { data: currentVote } = useQuery({
    queryKey: ["vote", postId, user?.id],
    queryFn: () => fetchUserVote(postId, user!.id),
    enabled: !!user,
  });

  const { mutate } = useMutation({
    mutationFn: (voteValue: number) => {
      if (!user) throw new Error("You must be logged in to vote!");
      return vote(voteValue, postId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vote", postId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["votes", postId] });
    },
  });

  if (isLoading) {
    return <div>Loading votes...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  const likeCount = votes?.filter((v) => v.vote === 1).length ?? 0;
  const dislikeCount = votes?.filter((v) => v.vote === -1).length ?? 0;

  return (
    <div>
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
          currentVote === 1
            ? "text-purple-400 bg-purple-500/10"
            : "text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
        }`}
        onClick={() => mutate(1)}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
          />
        </svg>
        Like {likeCount > 0 && <span>{likeCount}</span>}
      </button>
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
          currentVote === -1
            ? "text-red-400 bg-red-500/10"
            : "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
        }`}
        onClick={() => mutate(-1)}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
          />
        </svg>
        Dislike {dislikeCount > 0 && <span>{dislikeCount}</span>}
      </button>
    </div>
  );
}
