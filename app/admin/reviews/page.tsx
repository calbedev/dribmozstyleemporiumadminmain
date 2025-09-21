import { PermissionGuard } from "@/components/admin/permission-guard"
import { ReviewList } from "@/components/admin/reviews/review-list"

export default function ReviewsPage() {
  return (
    <PermissionGuard action="read" resource="reviews">
      <ReviewList />
    </PermissionGuard>
  )
}
