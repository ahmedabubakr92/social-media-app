import { useState, useRef, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
}

async function createPost(post: PostInput, imageFile: File) {
  const filePath = `${post.title}-${Date.now()}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("posts-images")
    .upload(filePath, imageFile);

  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrlData } = supabase.storage
    .from("posts-images")
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, image_url: publicUrlData.publicUrl });

  if (error) {
    await supabase.storage.from("posts-images").remove([filePath]);
    throw new Error(error.message);
  }

  return data;
}

export default function CreatePost() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {user} = useAuth()

  const { mutate, isPending, isError, isSuccess } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile);
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) return;
    mutate({ post: { title, content, avatar_url: user?.user_metadata.avatar_url || null }, imageFile: selectedFile });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      return;
    }
    setSelectedFile(null);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      <div>
        <label htmlFor="title" className="block mb-2 font-medium">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-white/25 bg-transparent p-2 rounded"
        />
      </div>
      <div>
        <label htmlFor="content" className="block mb-2 font-medium">
          Content
        </label>
        <textarea
          name="content"
          id="content"
          required
          value={content}
          rows={5}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border border-white/25 bg-transparent p-2 rounded"
        />
      </div>
      <div>
        <label htmlFor="image" className="block mb-2 font-medium">
          Upload Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          name="image"
          id="image"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="w-full text-gray-200"
        />
      </div>

      {isError && (
        <p className="text-red-500">Something went wrong. Try again.</p>
      )}
      {isSuccess && <p>Post created successfully</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-purple-500 text-white px-4 py-2 rounded cursor-pointer"
      >
        {isPending ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
