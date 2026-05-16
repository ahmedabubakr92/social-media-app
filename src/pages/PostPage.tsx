import { useParams } from "react-router"
import PostDetail from "../components/PostDetail"

export default function PostPage() {
    const { id } = useParams<{ id: string }>()
    const postId = Number(id)

    if (!id || !Number.isInteger(postId) || postId <= 0) {
        return <div className="pt-10">Invalid post ID.</div>
    }

    return (
        <div className="pt-10">
            <PostDetail postId={postId} />
        </div>
    )
}